'use strict';

const { URL } = require('url');
const https = require('https');
const http = require('http');

/**
 * @description Manages communication to the Marstek Cloud for authentication and device details retrieval.
 * @class
 */

module.exports = class MarstekCloud {

    /**
     * Creates a new MarstekSocket instance.
     * @constructor
     * @param {string} username The email address that is used to login to the Marstek Cloud
     * @param {string} password MD5 enrypted password for the Marstek Cloud account
     * @param {object} [parent] The Homey parent that is creating this class (for logging)
     */
    constructor(username, password, parent) {
        if (!username || !password) throw new Error('Username and (encrypted) password are required');
        this.username = username;
        this.password = password;
        this.baseUrl = 'https://eu.hamedata.com';
        this.logger = parent ?? console;
        this.token = null;
        this.devices = null;
        this.lastDeviceStatus = null;           // last received device status is stored here for caching
        this.debug = (process.env.DEBUG === '1');
    }

    /**
     * Authenticate with the Marstek cloud service.
     * use POST on URL: https://eu.hamedata.com/app/Solar/v2_get_device.php
        {
          code: '2',
          register_date: '2025-09-08 11:39:19',
          msg: '登录成功，已绑定设备',
          token: '7fe122488b71ffa36d9bce1e41dc755f',
          data: [
            {
              devid: '2834958029834958023',
              name: 'MST_ACCP_aaaa',
              sn: 'HCOUPLE50251703184',
              mac: 'acd628a75a93',
              type: 'HMG-50',
              access: '1',
              bluetooth_name: 'MST_ACCP_aaaa',
              date: '2025-09-08 11:49:52'
            }
          ]
        }
     */
    async login() {
        if (this.debug) this.logger.log("[cloud] Login request, for new token");

        // Login is done by requesting devices using username and MD5 password
        const response = await this.request(
            `/app/Solar/v2_get_device.php?pwd=${this.password}&mailbox=${this.username}`,
            'POST'
        );

        // Store received token
        if (response && response.token) {
            if (this.debug) this.logger.log("[cloud] New token received");
            this.token = response.token;
        } else {
            throw new Error('[cloud] Login did not return an access token.');
        }

        // Store the received devices
        if (response.data) {
            if (this.debug) this.logger.log("[cloud] New list of devices received:", JSON.stringify(response.data));
            this.devices = response.data;
        } else {
            this.logger.error("[cloud] Login did not return any devices.")
            this.devices = null;
        }
    }

    /**
     * Retrieve all devices linked to the authenticated account.
     * @returns {Array<object>} array of devices retrieve during authentication
     */
    async fetchDevices() {
        return this.devices || [];
    }

    /**
     * Retrieve a status for all devices
     * @param {string} devid Unique device id as communicated in device list response
     */
    async fetchDeviceStatus(devid) {
        // Make sure a token is available
        if (!this.token) await this.login();

        try {
            // Check if last response is within cache
            if (this.lastDeviceStatus && this.timestamp && ((new Date() - this.timestamp) < 59000)) {
                if (this.debug) this.logger.log("[cloud] Using cached device status response");
                const status = this.lastDeviceStatus.find((device) => device.devid === devid);
                if (status) return status;
            }

            // Request latest device details
            let response = await this.requestDeviceList();

            // If response indicated token problems; make sure to login again
            if (response && response.code === "8") {
                if (this.debug) this.logger.log("[cloud] Token is (no longer) valid, refreshing token and retry call");
                this.token = null;
                await this.login();
                // Request latest device details (again)
                response = await this.requestDeviceList();
            }

            // Detect is device status is received
            if (!response || !response.data) {
                this.logger.error('[cloud] Incorrect response was received', response);
                throw new Error("[cloud] Incorrect response was received");
            }

            // Record the last successful received response 
            this.timestamp = new Date();
            this.lastDeviceStatus = response.data;
            if (this.debug) this.logger.log("[cloud] Device status details received", JSON.stringify(response.data));

            // Retrieve the requested device only
            const status = response.data.find((device) => device.devid === devid);
            if (!status) {
                this.logger.error("[cloud] No data for device was received", devid);
                return null;
            }
            return status;

        } catch (err) {
            this.logger.error('[cloud] Failed to fetch device status: ', err.message ?? err);
            if (err) throw err;
        }
        return null;
    }

    /**
     * Helper function to retrieve device list from the Marstek cloud
     * @returns {Promise<any>} 
     * Use GET on URL: https://eu.hamedata.com/ems/api/v1/getDeviceList?token=<TOKEN>
     *  {
          "timeZone": "Europe/Amsterdam",
          "devid": "2834958029834958023",
          "name": "MST_ACCP_aaaa",
          "mac": "acd628a75a93",
          "type": "HMG-50",
          "access": "1",
          "version": "153",
          "bluetooth_name": "MST_ACCP_aaaa",
          "sn": "HCOUPLE50651903294",
          "soc": 63,                    // State of Charge (%)
          "discharge": 0,               // Discharge Grid (Watt)
          "charge": 1993,               // Charge Grid (Watt)
          "load": 0,                    // Unknown
          "profit": "0.00",             // Profit
          "pv": -1993,                  // Unknown (Watt)
          "report_time": 1759403159,    // Last update received (epoch)
          "salt": "0,ab32caea00126c7b",
          "is_support": 1,
          "status": 1
        }
     */
    async requestDeviceList() {
        // Request latest device details (again)
        return await this.request(`/ems/api/v1/getDeviceList?token=${this.token}`);
    }

    /**
     * Execute a HTTP request against the Marstek cloud API.
     * @param {string} path Path to call (exclude hostname and protocol)
     * @param {string} [method] HTTP method (default to GET)
     * @returns {Promise<any>} resolved when request is completed and return the JSON data received as parsed object
     */
    async request(path, method) {
        if (!path) throw new Error('A path is required');
        const url = new URL(path, this.baseUrl);
        const httpModule = url.protocol === 'https:' ? https : http;

        return new Promise((resolve, reject) => {
            const request = {
                method: method || "GET",
                protocol: url.protocol,
                hostname: url.hostname,
                port: url.port,
                path: `${url.pathname}${url.search}`,
                headers: { Accept: 'application/json' },
            }
            const req = httpModule.request(request, (res) => {
                let data = '';
                res.on('data', chunk => { data += chunk; });
                res.on('end', () => {
                    try {
                        // Incorrect http status received
                        if (res.statusCode && res.statusCode >= 400) {
                            this.logger.error('[cloud] Incorrect HTTP status code received', res.statusCode);
                            return reject(new Error(data || `HTTP ${res.statusCode}`));
                        }
                        // Empty response
                        if (!data) {
                            this.logger.error('[cloud] Empty response received');
                            return resolve(null);
                        }
                        // Finally parse and resolve
                        const parsed = JSON.parse(data);
                        resolve(parsed);
                    } catch (err) {
                        reject(err);
                    }
                });
            });
            req.on('error', reject);
            req.end();
        });
    }

}