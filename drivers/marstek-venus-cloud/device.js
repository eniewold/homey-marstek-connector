'use strict';

const Homey = require('homey');

/**
 * Represents a Marstek Venus device connected via the Marstek cloud APIs.
 * Handles authentication, capability updates and periodic polling of cloud status.
 * @extends Homey.Device
 */
module.exports = class MarstekVenusCloudDevice extends Homey.Device {

    /**
     * Called when the device is initialised.
     * Loads credentials, initialises the shared cloud client, resets capabilities,
     * and starts the polling cycle.
     * @returns {Promise<void>} Resolves once initialisation completes.
     */
    async onInit() {
        if (this.getSetting('debug')) this.log('MarstekVenusCloudDevice has been initialized');
        await this._loadConfiguration();
        await this._initialiseClient();
        await this._updateCapabilitiesWithNull();
        this._startPolling();
    }

    /**
     * Called after the device has been added to Homey.
     * Currently used for debug logging only.
     * @returns {Promise<void>} Resolves once logging completes.
     */
    async onAdded() {
        if (this.getSetting('debug')) this.log('MarstekVenusCloudDevice has been added');
    }

    /**
     * Called when the device is removed by the user.
     * Stops background polling and logs the action when debug is enabled.
     * @returns {Promise<void>} Resolves once cleanup completes.
     */
    async onDeleted() {
        this._stopPolling();
        if (this.getSetting('debug')) this.log('MarstekVenusCloudDevice has been deleted');
    }

    /**
     * Called when Homey uninitialises the device.
     * Ensures polling is stopped to free up resources.
     * @returns {Promise<void>} Resolves once cleanup completes.
     */
    async onUninit() {
        this._stopPolling();
        if (this.getSetting('debug')) this.log('MarstekVenusCloudDevice has been uninitialized');
    }

    /**
     * Loads the credentials and device identifier from Homey's store.
     * @returns {Promise<void>} Resolves once configuration values are retrieved.
     * @throws {Error} When required credentials are missing.
     */
    async _loadConfiguration() {
        // Load credentials from store
        this._username = await this.getStoreValue('username');
        this._password = await this.getStoreValue('password');  // Already stored as MD5 Encoded
        this._devid = await this.getStoreValue('devid');

        if (!this._username || !this._password || !this._devid) {
            throw new Error('Missing cloud account credentials or device details. Please re-pair (remove and add) the device.');
        }
    }

    /**
     * Retrieves or creates the Marstek cloud client for the stored credentials and ensures it is authenticated.
     * @returns {Promise<void>} Resolves once the client is authenticated.
     * @throws {Error} When authentication fails.
     */
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
    }

    /**
     * Resets the relevant device capabilities to `null` until fresh data is received.
     * @returns {Promise<void>} Resolves once capability values are cleared.
     */
    async _updateCapabilitiesWithNull() {
        await this.setCapabilityValue('measure_battery', null);
        await this.setCapabilityValue('measure_power', null);
        await this.setCapabilityValue('measure_power.charge', null);
        await this.setCapabilityValue('measure_power.discharge', null);
        await this.setCapabilityValue('last_message_received', null);
    }

    /**
     * Starts the polling cycle that retrieves cloud data and updates the last message capability.
     */
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
        }, 5000);

    }

    /**
     * Stops the polling cycle and clears both the poll and last-message intervals.
     */
    _stopPolling() {
        if (this._pollInterval) {
            if (this.getSetting('debug')) this.log('[cloud] polling stopped');
            this.homey.clearInterval(this._pollInterval);
            this._pollInterval = null;
        }
        if (this.lastInterval) this.homey.clearInterval(this.lastInterval);
    }

    /**
     * Executes a single poll by requesting device status from the cloud API and updating capabilities.
     * @returns {Promise<void>} Resolves when the capability updates complete.
     */
    async _poll() {
        try {
            // retrieve data of all devices
            const payload = await this._client.fetchDeviceStatus();

            // Filter correct device
            const status = payload.find((device) => device.devid === this._devid);
            if (status) {
                await this._handleStatusPayload(status);
                if (!this.getAvailable()) await this.setAvailable();
            } else {
                this.error('[cloud] Device details not found in payload for device', this._devid);
                this._updateCapabilitiesWithNull();
            }
        } catch (err) {
            this.error('[cloud] Error fetching Marstek cloud data:', err.message || err);
            await this.setUnavailable('Unable to reach Marstek cloud.');
        }
    }

    /**
     * Processes the payload returned from the cloud API and updates device capabilities.
     * @param {any} status - Raw status payload returned by the cloud API.
     * @returns {Promise<void>} Resolves once the capability values have been updated.
     */
    async _handleStatusPayload(status) {
        if (!status) {
            this.error("[cloud] Payload not found or no data in payload", status);
            return;
        };
        if (this.getSetting('debug')) this.log('[cloud] Device payload to proces', JSON.stringify(status));

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
