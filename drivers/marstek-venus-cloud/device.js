'use strict';

const Homey = require('homey');

module.exports = class MarstekVenusCloudDevice extends Homey.Device {

    async onInit() {
        if (this.getSetting('debug')) this.log('MarstekVenusCloudDevice has been initialized');
        await this._loadConfiguration();
        await this._initialiseClient();
        await this._updateCapabilitiesWithNull();
        this._startPolling();
    }

    async onAdded() {
        if (this.getSetting('debug')) this.log('MarstekVenusCloudDevice has been added');
    }

    async onDeleted() {
        this._stopPolling();
        if (this.getSetting('debug')) this.log('MarstekVenusCloudDevice has been deleted');
    }

    async onUninit() {
        this._stopPolling();
        if (this.getSetting('debug')) this.log('MarstekVenusCloudDevice has been uninitialized');
    }

    async _loadConfiguration() {
        // Load credentials from store
        this._username = await this.getStoreValue('username');
        this._password = await this.getStoreValue('password');  // MD5 Encoded
        this._devid = await this.getStoreValue('devid');

        if (!this._username || !this._password || !this._devid) {
            throw new Error('Missing cloud account credentials or device details. Please re-pair (remove and add) the device.');
        }
    }

    async _initialiseClient() {
        // Retrieve client related to the current credentials
        this._client = this.driver.getClient(
            {
                username: this._username,
                password: this._password
            },
            this
        );

        if (!this._client) {
            this.error('[cloud] No client available for these credentials');
            await this.setUnavailable('Unable to authenticate with Marstek cloud');
            return;
        }

        try {
            await this._client.login();
        } catch (err) {
            this.error('Initial login failed:', err);
            await this.setUnavailable('Unable to authenticate with Marstek cloud');
            throw err;
        }
    }

    // Initial value for capabilities
    async _updateCapabilitiesWithNull() {
        await this.setCapabilityValue('measure_battery', null);
        await this.setCapabilityValue('measure_power', null);
        await this.setCapabilityValue('measure_power.charge', null);
        await this.setCapabilityValue('measure_power.discharge', null);
    }

    _startPolling() {
        // Start retrieving details from cloud service
        if (this._pollInterval) return;
        if (this.getSetting('debug')) this.log('[cloud] polling started');

        // Poll every 60 seconds
        this._pollInterval = this.homey.setInterval(() => this._poll(), 60000);

        // Initial poll
        this._poll();

        // Also start updating the last received message capability
        this.lastInterval = this.homey.setInterval(async () => {
            if (this.lastTimestamp) {
                const diff = Date.now() - this.lastTimestamp;
                await this.setCapabilityValue('last_message_received', parseInt(diff / 1000));
            }
        }, 1000);

    }

    _stopPolling() {
        if (this._pollInterval) {
            if (this.getSetting('debug')) this.log('[cloud] polling stopped');
            this.homey.clearInterval(this._pollInterval);
            this._pollInterval = null;
            if (this.lastInterval) this.homey.clearInterval(this.lastInterval);
        }
    }

    async _poll() {
        try {
            const payload = await this._client.fetchDeviceStatus(this._devid);
            await this._handleStatusPayload(payload);
            if (!this.getAvailable()) await this.setAvailable();
        } catch (err) {
            this.error('Error fetching Marstek cloud data:', err);
            await this.setUnavailable('Unable to reach Marstek cloud.');
        }
    }

    // Handle the received device status details
    async _handleStatusPayload(status) {
        if (!status) {
            this.error("Payload not found or no data in payload");
            return;
        };    
        if (this.getSetting('debug')) this.log('[cloud] payload', JSON.stringify(status));

        // Log report time
        this.lastTimestamp = new Date(status.report_time * 1000);
        if (this.getSetting('debug')) this.log('[cloud] Last cloud update:', new Date(status.report_time * 1000));

        // State of Charge (%)
        if (!isNaN(status.soc)) await this.setCapabilityValue('measure_battery', status.soc);

        // Power (charge minus discharge)
        await this.setCapabilityValue('measure_power', status.charge - status.discharge);
        await this.setCapabilityValue('measure_power.charge', status.charge);
        await this.setCapabilityValue('measure_power.discharge', status.discharge);
    }


};
