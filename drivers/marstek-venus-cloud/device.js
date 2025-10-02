'use strict';

const Homey = require('homey');
const MarstekCloudClient = require('../../lib/marstek-cloud-client');

module.exports = class MarstekVenusCloudDevice extends Homey.Device {

    async onInit() {
        if (this.getSetting('debug')) this.log('MarstekVenusCloudDevice has been initialized');

        await this._ensureCapabilities();
        await this._loadConfiguration();
        await this._initialiseClient();

        await this._updateCapabilitiesWithNull();
        this._startLastMessageTicker();
        this._startPolling();
    }

    async onAdded() {
        if (this.getSetting('debug')) this.log('MarstekVenusCloudDevice has been added');
    }

    async onDeleted() {
        this._stopPolling();
        this._stopLastMessageTicker();
        if (this.getSetting('debug')) this.log('MarstekVenusCloudDevice has been deleted');
    }

    async onUninit() {
        this._stopPolling();
        this._stopLastMessageTicker();
        if (this.getSetting('debug')) this.log('MarstekVenusCloudDevice has been uninitialized');
    }

    async _ensureCapabilities() {
        if (!this.hasCapability('meter_power.imported')) await this.addCapability('meter_power.imported');
        if (!this.hasCapability('meter_power.exported')) await this.addCapability('meter_power.exported');
        if (!this.hasCapability('meter_power.load')) await this.addCapability('meter_power.load');
        if (!this.hasCapability('measure_power_ongrid')) await this.addCapability('measure_power_ongrid');
        if (!this.hasCapability('measure_power_offgrid')) await this.addCapability('measure_power_offgrid');
        if (!this.hasCapability('measure_power_pv')) await this.addCapability('measure_power_pv');
        if (!this.hasCapability('last_message_received')) await this.addCapability('last_message_received');
    }

    async _loadConfiguration() {
        this._siteId = await this.getStoreValue('siteId') ?? this.getSetting('siteId');
        this._deviceSn = await this.getStoreValue('deviceSn') ?? this.getSetting('deviceSn');
        this._deviceId = await this.getStoreValue('deviceId');
        this._credentials = await this.getStoreValue('credentials');

        if (!this._credentials || !this._credentials.username || !this._credentials.password) {
            throw new Error('Missing cloud account credentials. Please repair the device.');
        }

        if (!this._siteId || !this._deviceSn) {
            throw new Error('Missing Marstek identifiers. Please repair the device.');
        }

        await this.setSettings({
            username: this._credentials.username,
            siteId: this._siteId,
            deviceSn: this._deviceSn,
        });

        await this.setStoreValue('siteId', this._siteId);
        await this.setStoreValue('deviceSn', this._deviceSn);
        await this.setStoreValue('deviceId', this._deviceId ?? null);
        await this.setStoreValue('credentials', this._credentials);
    }

    async _initialiseClient() {
        this._client = new MarstekCloudClient({
            username: this._credentials.username,
            password: this._credentials.password,
            baseUrl: this._credentials.baseUrl,
            logger: this,
        });
        try {
            await this._client.login();
        } catch (err) {
            this.error('Initial login failed:', err);
            await this.setUnavailable('Unable to authenticate with Marstek cloud');
            throw err;
        }
    }

    async _updateCapabilitiesWithNull() {
        await this.setCapabilityValue('battery_charging_state', null);
        await this.setCapabilityValue('meter_power', null);
        await this.setCapabilityValue('measure_power', null);
        await this.setCapabilityValue('measure_temperature', null);
        await this.setCapabilityValue('measure_battery', null);
        await this.setCapabilityValue('meter_power.imported', null);
        await this.setCapabilityValue('meter_power.exported', null);
        await this.setCapabilityValue('meter_power.load', null);
        await this.setCapabilityValue('measure_power_ongrid', null);
        await this.setCapabilityValue('measure_power_offgrid', null);
        await this.setCapabilityValue('measure_power_pv', null);
        await this.setCapabilityValue('last_message_received', null);
    }

    _startLastMessageTicker() {
        if (this._lastMessageInterval) return;
        this._lastMessageInterval = this.homey.setInterval(async () => {
            if (!this._lastMessageTimestamp) return;
            const diff = Date.now() - this._lastMessageTimestamp;
            await this.setCapabilityValue('last_message_received', parseInt(diff / 1000));
        }, 1000);
    }

    _stopLastMessageTicker() {
        if (this._lastMessageInterval) {
            this.homey.clearInterval(this._lastMessageInterval);
            this._lastMessageInterval = null;
        }
    }

    _startPolling() {
        if (this._pollInterval) return;
        this._pollInterval = this.homey.setInterval(() => this._poll(), 30000);
        this._poll();
    }

    _stopPolling() {
        if (this._pollInterval) {
            this.homey.clearInterval(this._pollInterval);
            this._pollInterval = null;
        }
    }

    async _poll() {
        try {
            const payload = await this._client.fetchDeviceStatus({
                siteId: this._siteId,
                deviceSn: this._deviceSn,
                deviceId: this._deviceId,
            });
            await this._handleStatusPayload(payload);
            if (!this.getAvailable()) await this.setAvailable();
        } catch (err) {
            this.error('Error fetching Marstek cloud data:', err);
            await this.setUnavailable('Unable to reach Marstek cloud');
        }
    }

    async _handleStatusPayload(payload) {
        if (!payload) return;
        const status = this._extractStatus(payload);
        if (!status) return;

        if (this.getSetting('debug')) this.log('Cloud payload', JSON.stringify(status));

        this._lastMessageTimestamp = Date.now();
        await this.setCapabilityValue('last_message_received', 0);

        const firmware = this._determineFirmwareVersion(payload, status);
        const dividerPower = firmware >= 154 ? 1 : 10;
        const dividerEnergy = firmware >= 154 ? 10 : 100;
        const dividerCapacity = firmware >= 154 ? 1000 : 100;

        const temperature = this._pickNumber(status, ['bat_temp', 'batteryTemp', 'battery_temperature']);
        if (temperature !== null) {
            const adjustedTemperature = (temperature > 100 && firmware < 154) ? (temperature / 10) : temperature;
            await this.setCapabilityValue('measure_temperature', adjustedTemperature);
        }

        const capacity = this._pickNumber(status, ['bat_capacity', 'batteryCapacity', 'battery_capacity']);
        if (capacity !== null) {
            await this.setCapabilityValue('meter_power', capacity / dividerCapacity);
        }

        const stateOfCharge = this._pickNumber(status, ['bat_soc', 'batterySoc', 'soc']);
        if (stateOfCharge !== null) {
            await this.setCapabilityValue('measure_battery', stateOfCharge);
        }

        const batteryPower = this._pickNumber(status, ['bat_power', 'batteryPower', 'battery_power']);
        if (batteryPower !== null) {
            await this.setCapabilityValue('battery_charging_state', batteryPower > 0 ? 'charging' : (batteryPower < 0 ? 'discharging' : 'idle'));
            await this.setCapabilityValue('measure_power', batteryPower / dividerPower);
        }

        const imported = this._pickNumber(status, ['total_grid_input_energy', 'gridInputEnergy', 'grid_input_total']);
        if (imported !== null) {
            await this.setCapabilityValue('meter_power.imported', imported / dividerEnergy);
        }

        const exported = this._pickNumber(status, ['total_grid_output_energy', 'gridOutputEnergy', 'grid_output_total']);
        if (exported !== null) {
            await this.setCapabilityValue('meter_power.exported', exported / dividerEnergy);
        }

        const load = this._pickNumber(status, ['total_load_energy', 'loadEnergyTotal', 'load_total']);
        if (load !== null) {
            await this.setCapabilityValue('meter_power.load', load / dividerEnergy);
        }

        const ongrid = this._pickNumber(status, ['ongrid_power', 'onGridPower', 'gridPower']);
        if (ongrid !== null) {
            await this.setCapabilityValue('measure_power_ongrid', ongrid * -1);
        }

        const offgrid = this._pickNumber(status, ['offgrid_power', 'offGridPower', 'backupPower']);
        if (offgrid !== null) {
            await this.setCapabilityValue('measure_power_offgrid', offgrid * -1);
        }

        const pvPower = this._pickNumber(status, ['pv_power', 'pvPower', 'pvPowerW']);
        if (pvPower !== null) {
            await this.setCapabilityValue('measure_power_pv', pvPower * -1);
        }
    }

    _extractStatus(payload) {
        return payload?.result
            ?? payload?.data?.status
            ?? payload?.data?.deviceStatus
            ?? payload?.data?.device
            ?? payload?.data
            ?? payload?.status
            ?? null;
    }

    _determineFirmwareVersion(payload, status) {
        const firmwareCandidate = this._pickNumber(payload, ['firmware', 'deviceVersion', 'fwVersion']);
        if (firmwareCandidate !== null) return firmwareCandidate;
        const statusCandidate = this._pickNumber(status, ['fw', 'fw_ver', 'firmware']);
        if (statusCandidate !== null) return statusCandidate;
        const model = this.getSetting('model');
        if (model) {
            const version = Number(String(model).split(' v')[1]);
            if (!isNaN(version)) return version;
        }
        return 154; // default to latest scaling
    }

    _pickNumber(source, keys) {
        if (!source) return null;
        for (const key of keys) {
            if (key in source && source[key] !== null && source[key] !== undefined) {
                const value = Number(source[key]);
                if (!isNaN(value)) return value;
            }
        }
        return null;
    }
};
