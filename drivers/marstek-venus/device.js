'use strict';

const Homey = require('homey');

module.exports = class MarstekVenusDevice extends Homey.Device {

    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
        if (this.getSetting("debug")) this.log('MarstekVenusDevice has been initialized');

        // Make sure socket is connected
        await this.homey.app.socket.connect();

        // Start listening on UDP server on driver
        await this.startListening();

        // Default capability values
        await this.resetCapabilities();

        // Start polling at regular intervals
        this.startPolling();
    }

    // Reset all capabilities to null so that they are invalidated and shown as unknown in Homey
    async resetCapabilities() {
        // Check if device has all capabilities (introduced in v0.5.0)
        if (!this.hasCapability('meter_power.imported')) await this.addCapability('meter_power.imported');
        if (!this.hasCapability('meter_power.exported')) await this.addCapability('meter_power.exported');
        if (!this.hasCapability('measure_power_ongrid')) await this.addCapability('measure_power_ongrid');
        if (!this.hasCapability('measure_power_offgrid')) await this.addCapability('measure_power_offgrid');

        // Default capability values
        this.setCapabilityValue('battery_charging_state', null);        // Charte state (Possible values: "idle", "charging", "discharging")
        this.setCapabilityValue('meter_power', null);                   // Power remaining (In kWh)
        this.setCapabilityValue('measure_power', null);                 // Power usage/delivery (In Watts)
        this.setCapabilityValue('measure_temperature', null);           // Main battery temperature (In degrees celcius)
        this.setCapabilityValue('measure_battery', null);               // State of Charge in %
        this.setCapabilityValue('meter_power.imported', null);          // Total power imported (in kWh)
        this.setCapabilityValue('meter_power.exported', null);          // Total power exported (in kWh)
        this.setCapabilityValue('measure_power_ongrid', null);          // Current power usage of on-grid port (in W)
        this.setCapabilityValue('measure_power_offgrid', null);         // Current power usage of off-grid port (in W)
    }

    // Create an handler that we can use to bind/unbind the onMessage function
    handler = this.onMessage.bind(this);

    // Start listening on messages received after broadcast
    async startListening() {
        if (this.getSetting("debug")) this.log("Start listening");
        this.homey.app.socket.on(this.handler)
    }

    // Stop listening on messages
    stopListening() {
        if (this.getSetting("debug")) this.log("Stop listening");
        this.homey.app.socket.off(this.handler);
    }

    // Start polling at regular intervals
    startPolling() {
        if (this.getSetting("debug")) this.log("Start polling");
        this.driver.pollStart();
    }

    // End the polling interval
    stopPolling() {
        if (this.getSetting("debug")) this.log("Stop polling");
        this.driver.pollStop();
    }

    /**
     * Handle incoming UDP messages
     * @param {any} json - json object received from source
     * @param {any} rinfo - remote source address details
     */
    onMessage(json, rinfo) {
        try {
            // Check if message is for this instance
            if (json.src !== this.getSetting("src")) return;

            // Debug received details (if requested)
            if (this.getSetting("debug")) this.log(`Received for ${json.src}:`, JSON.stringify(json), JSON.stringify(rinfo));

            // Switch for different message types
            switch (json.id) {
                // New status from Battery has been received
                case "Bat.GetStatus":
                    this.setBatteryStatusCapabilities(json.result);
                    break;
                // New status from Energy System has been received
                case "ES.GetStatus":
                    this.setEnergySystemStatusCapabilities(json.result);
                    break;
                default:
                    if (this.getSetting("debug")) this.log('Ignored message ID:', json.id);
                    break;
            }
        }
        catch (error) {
            this.error('Error processing incoming message:', error);
            return;
        }
    }

    /**
     * Apply the received battery status message details to the capabilities
     * @param {any} status
     */
    setBatteryStatusCapabilities(status) {
        // Check if status is valid
        if (!status) {
            this.error('Invalid received battery status');
            return;
        }
        // Check if status contains expected properties
        if (typeof status.bat_capacity === 'undefined' || typeof status.bat_temp === 'undefined') {
            this.error('Incomplete received battery status (undefined found)');
            return;
        }
        // Check if status values are numbers
        if (isNaN(status.bat_capacity) || isNaN(status.bat_temp)) {
            this.error('Invalid received battery status (NaN found)');
            return;
        }
        // Check if device is still present
        if (!this.getAvailable()) {
            this.error('Device is deleted or not available (yet)');
            return;
        }

        // Check if temperature range is multiplied by 10
        if (status.bat_temp > 100) status.bat_temp = status.bat_temp / 10.0;

        // Set the capabilities
        this.setCapabilityValue('meter_power', status.bat_capacity / 100.0);        // Power remaining (In kWh)
        this.setCapabilityValue('measure_temperature', status.bat_temp);            // Main battery temperature (In degrees celcius)
    }

    /**
     * Apply the received energy system status message details to the capabilities
     * @param {any} status
     */
    setEnergySystemStatusCapabilities(status) {
        // Check if status is valid
        if (!status) {
            this.error('Invalid received battery status');
            return;
        }
        // Check if status contains expected properties
        if (typeof status.bat_soc === 'undefined' || typeof status.bat_power === 'undefined') {
            this.error('Incomplete received battery status (undefined found)');
            return;
        }
        // Check if status values are numbers
        if (isNaN(status.bat_soc) || isNaN(status.bat_power)) {
            this.error('Invalid received battery status (NaN found)');
            return;
        }
        // Check if device is still present
        if (!this.getAvailable()) {
            this.error('Device is deleted or not available (yet)');
            return;
        }

        // Set the capabilities
        this.setCapabilityValue('measure_battery', status.bat_soc);
        /**
         * For a battery
         * Charging → the battery is consuming power → measure_power should be positive
         * Discharging → the battery is producing power → measure_power should be negative
         * That way the battery behaves consistently with e.g. a solar inverter driver in Homey.
         */
        this.setCapabilityValue('battery_charging_state', (status.bat_power > 0) ? "charging" : (status.bat_power < 0) ? "discharging" : "idle");        // Charte state (Possible values: "idle", "charging", "discharging")
        this.setCapabilityValue('measure_power', status.bat_power / 10.0);
        // imported / exported meter readings (as defined by Homey Energy)
        this.setCapabilityValue('meter_power.imported', status.total_grid_input_energy / 100);
        this.setCapabilityValue('meter_power.exported', status.total_grid_output_energy / 100);
        // Additional capabilities as communicated by Marstek to display in Homey
        this.setCapabilityValue('measure_power_ongrid', status.ongrid_power * -1);
        this.setCapabilityValue('measure_power_offgrid', status.offgrid_power * -1);

    }

    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted() {
        this.stopPolling();
        this.stopListening();
        if (this.getSetting("debug")) this.log('MarstekVenusDevice has been deleted');
    }

};