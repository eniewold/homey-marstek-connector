'use strict';

const { URL } = require('url');
const https = require('https');
const http = require('http');

/**
 * Minimal Marstek cloud API client that mirrors the communication flow used by the
 * community marstek_cloud project. The client is able to authenticate with the
 * Marstek cloud using a username/password combination and periodically retrieve
 * the latest battery statistics for a site/device combination.
 */
class MarstekCloudClient {

    /**
     * @param {{ username: string, password: string, baseUrl?: string, logger?: { log: Function, error: Function } }} options
     */
    constructor({ username, password, baseUrl, logger } = {}) {
        if (!username || !password) throw new Error('Username and password are required');
        this.username = username;
        this.password = password;
        this.baseUrl = baseUrl ?? 'https://cloud.marstek.com';
        this.logger = logger ?? console;
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiresAt = 0;
        this.cookies = new Map();
    }

    /**
     * Authenticate with the Marstek cloud service.
     */
    async login() {
        this.logger.log('[cloud] Performing login');
        const response = await this._request({
            path: '/api/user/login',
            method: 'POST',
            body: {
                username: this.username,
                password: this.password,
            },
            requiresAuth: false,
        });

        const accessToken = response?.access_token
            ?? response?.data?.accessToken
            ?? response?.token
            ?? response?.data?.token;
        if (!accessToken) {
            throw new Error('Login did not return an access token');
        }

        const refreshToken = response?.refresh_token
            ?? response?.data?.refreshToken
            ?? response?.data?.refresh_token
            ?? response?.refreshToken;

        const expiresIn = response?.expires_in
            ?? response?.data?.expiresIn
            ?? response?.data?.expire_time
            ?? response?.data?.expires_in
            ?? 3000;

        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenExpiresAt = Date.now() + (Number(expiresIn) * 1000);
        return {
            accessToken,
            refreshToken,
            expiresIn,
        };
    }

    /**
     * Retrieve all devices linked to the authenticated account.
     * @returns {Promise<Array<{ id: string, name: string, siteId: string, deviceSn: string, productName?: string }>>}
     */
    async fetchDevices() {
        await this._ensureAuthenticated();

        // The cloud API exposes both GET and POST flavours, try the common ones
        const candidates = [
            { method: 'GET', path: '/api/device/list' },
            { method: 'POST', path: '/api/device/list', body: {} },
            { method: 'POST', path: '/api/app/device/list', body: { pageNo: 1, pageSize: 100 } },
            { method: 'GET', path: '/api/app/device/list' },
        ];

        let lastError = null;
        for (const candidate of candidates) {
            try {
                const payload = await this._request({ ...candidate });
                const devices = this._parseDevices(payload);
                if (devices.length > 0) return devices;
            } catch (err) {
                lastError = err;
                this.logger.error('[cloud] Failed to fetch devices using', candidate.path, err.message ?? err);
            }
        }

        if (lastError) throw lastError;
        return [];
    }

    /**
     * Retrieve a device status payload for the specified identifiers.
     * @param {{ siteId: string, deviceSn: string, deviceId?: string }} params
     * @returns {Promise<any>}
     */
    async fetchDeviceStatus({ siteId, deviceSn, deviceId }) {
        await this._ensureAuthenticated();

        const bodyVariants = [
            { method: 'POST', path: '/api/device/status', body: { siteId, deviceSn, deviceId } },
            { method: 'POST', path: '/api/device/getStatus', body: { siteId, deviceSn, deviceId } },
            { method: 'POST', path: '/api/app/device/status', body: { siteId, deviceSn, deviceId } },
            { method: 'GET', path: `/api/device/status?siteId=${encodeURIComponent(siteId)}&deviceSn=${encodeURIComponent(deviceSn ?? '')}` },
        ];

        let lastError = null;
        for (const variant of bodyVariants) {
            try {
                const payload = await this._request({ ...variant });
                if (payload) return payload;
            } catch (err) {
                lastError = err;
                this.logger.error('[cloud] Failed to fetch device status using', variant.path, err.message ?? err);
            }
        }

        if (lastError) throw lastError;
        return null;
    }

    /**
     * Ensure that the client has a valid token before performing a request.
     */
    async _ensureAuthenticated() {
        if (this.accessToken && Date.now() < this.tokenExpiresAt - 60_000) return;
        if (this.refreshToken) {
            try {
                await this._refresh();
                return;
            } catch (err) {
                this.logger.error('[cloud] Refresh failed, falling back to new login', err.message ?? err);
            }
        }
        await this.login();
    }

    async _refresh() {
        if (!this.refreshToken) throw new Error('No refresh token available');
        const response = await this._request({
            path: '/api/user/refresh',
            method: 'POST',
            body: {
                refreshToken: this.refreshToken,
            },
            requiresAuth: false,
        });

        const accessToken = response?.access_token
            ?? response?.data?.accessToken
            ?? response?.token
            ?? response?.data?.token;
        if (!accessToken) throw new Error('Refresh did not return a token');

        const expiresIn = response?.expires_in
            ?? response?.data?.expiresIn
            ?? response?.data?.expire_time
            ?? response?.data?.expires_in
            ?? 3000;

        this.accessToken = accessToken;
        this.tokenExpiresAt = Date.now() + (Number(expiresIn) * 1000);
        if (response?.refresh_token || response?.data?.refreshToken) {
            this.refreshToken = response?.refresh_token ?? response?.data?.refreshToken;
        }
    }

    /**
     * Execute a HTTP request against the Marstek cloud API.
     * @param {{ path: string, method?: string, body?: any, headers?: Record<string,string>, requiresAuth?: boolean }} options
     * @returns {Promise<any>}
     */
    async _request({ path, method = 'GET', body, headers, requiresAuth = true } = {}) {
        if (!path) throw new Error('A path is required');
        const url = new URL(path, this.baseUrl);
        const httpModule = url.protocol === 'https:' ? https : http;

        const requestHeaders = Object.assign({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }, headers);

        if (requiresAuth && this.accessToken) {
            requestHeaders.Authorization = `Bearer ${this.accessToken}`;
        }

        const cookieHeader = this._getCookieHeader();
        if (cookieHeader) requestHeaders.Cookie = cookieHeader;

        const payload = body !== undefined && body !== null ? JSON.stringify(body) : null;
        if (payload) requestHeaders['Content-Length'] = Buffer.byteLength(payload);

        return new Promise((resolve, reject) => {
            const req = httpModule.request({
                method,
                protocol: url.protocol,
                hostname: url.hostname,
                port: url.port,
                path: `${url.pathname}${url.search}`,
                headers: requestHeaders,
            }, (res) => {
                let data = '';
                res.on('data', chunk => { data += chunk; });
                res.on('end', () => {
                    try {
                        this._storeCookies(res.headers['set-cookie']);
                        if (res.statusCode && res.statusCode >= 400) {
                            const message = data ? this._parseErrorMessage(data) : res.statusMessage;
                            return reject(new Error(message || `HTTP ${res.statusCode}`));
                        }
                        if (!data) return resolve(null);
                        const parsed = JSON.parse(data);
                        resolve(parsed);
                    } catch (err) {
                        reject(err);
                    }
                });
            });
            req.on('error', reject);
            if (payload) req.write(payload);
            req.end();
        });
    }

    _parseDevices(response) {
        if (!response) return [];
        const list = response?.devices
            ?? response?.data?.devices
            ?? response?.data?.list
            ?? response?.data?.deviceList
            ?? response?.data?.records
            ?? response?.data?.items
            ?? response?.result
            ?? [];

        const array = Array.isArray(list) ? list : [];
        return array.map((item, index) => {
            const siteId = item?.siteId ?? item?.site_id ?? item?.siteID ?? item?.stationId ?? item?.station_id ?? item?.plantId;
            const deviceSn = item?.deviceSn ?? item?.sn ?? item?.device_sn ?? item?.serialNumber ?? item?.serial_number ?? item?.deviceSnCode;
            const deviceId = item?.deviceId ?? item?.id ?? item?.device_id;
            const name = item?.name ?? item?.deviceName ?? item?.device_name ?? item?.stationName ?? item?.plantName ?? `Marstek battery ${index + 1}`;
            const productName = item?.productName ?? item?.product_name ?? item?.model ?? item?.deviceModel;
            return {
                id: deviceId ?? `${siteId ?? 'site'}-${deviceSn ?? index}`,
                name,
                siteId: siteId ? String(siteId) : '',
                deviceSn: deviceSn ? String(deviceSn) : '',
                deviceId: deviceId ? String(deviceId) : undefined,
                productName,
            };
        }).filter(device => device.siteId || device.deviceSn);
    }

    _parseErrorMessage(payload) {
        try {
            const json = JSON.parse(payload);
            return json?.message || json?.msg || json?.error || json?.error_description || payload;
        } catch (err) {
            return payload;
        }
    }

    _storeCookies(setCookieHeaders) {
        if (!setCookieHeaders) return;
        const headers = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
        headers.forEach(header => {
            const [cookie] = header.split(';');
            const [name, value] = cookie.split('=');
            if (name) this.cookies.set(name.trim(), value ?? '');
        });
    }

    _getCookieHeader() {
        if (this.cookies.size === 0) return '';
        return Array.from(this.cookies.entries()).map(([key, value]) => `${key}=${value}`).join('; ');
    }
}

module.exports = MarstekCloudClient;
