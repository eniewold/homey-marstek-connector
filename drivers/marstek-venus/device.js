'use strict';

const Homey = require('homey');

module.exports = class MarstekVenusDevice extends Homey.Device {

    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
        if (this.getSetting("debug")) this.log('MarstekVenusDevice has been initialized');

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
        if (!this.hasCapability('meter_power.load')) await this.addCapability('meter_power.load');
        if (!this.hasCapability('measure_power_ongrid')) await this.addCapability('measure_power_ongrid');
        if (!this.hasCapability('measure_power_offgrid')) await this.addCapability('measure_power_offgrid');
        if (!this.hasCapability('measure_power_pv')) await this.addCapability('measure_power_pv');

        // Default capability values
        await this.setCapabilityValue('battery_charging_state', null);      // Charte state (Possible values: "idle", "charging", "discharging")
        await this.setCapabilityValue('meter_power', null);                 // Power remaining (In kWh)
        await this.setCapabilityValue('measure_power', null);               // Power usage/delivery (In Watts)
        await this.setCapabilityValue('measure_temperature', null);         // Main battery temperature (In degrees celcius)
        await this.setCapabilityValue('measure_battery', null);             // State of Charge in %
        await this.setCapabilityValue('meter_power.imported', null);        // Total power imported (in kWh)
        await this.setCapabilityValue('meter_power.exported', null);        // Total power exported (in kWh)
        await this.setCapabilityValue('meter_power.load', null);            // Total power exported (in kWh)
        await this.setCapabilityValue('measure_power_ongrid', null);        // Current power usage of on-grid port (in W)
        await this.setCapabilityValue('measure_power_offgrid', null);       // Current power usage of off-grid port (in W)
        await this.setCapabilityValue('measure_power_pv', null);            // Current power usage of off-grid port (in W)
    }

    // Create an handler that we can use to bind/unbind the onMessage function
    handler = this.onMessage.bind(this);

    // Start listening on messages received after broadcast
    async startListening() {
        if (this.getSetting("debug")) this.log("Start listening");
        this.homey.app.getSocket().on(this.handler)
    }

    // Stop listening on messages
    stopListening() {
        if (this.getSetting("debug")) this.log("Stop listening");
        this.homey.app.getSocket().off(this.handler);
    }

    // Start polling at regular intervals
    startPolling() {
        if (this.getSetting("debug")) this.log("Start polling");
        this.driver.pollStart(this.getSetting("src"));
    }

    // End the polling interval
    stopPolling() {
        if (this.getSetting("debug")) this.log("Stop polling");
        this.driver.pollStop(this.getSetting("src"));
    }

    /**
     * Handle incoming UDP messages
     * @param {any} json - json object received from source
     * @param {any} rinfo - remote source address details
     */
    async onMessage(json, rinfo) {
        // Check if device is still present
        if (!this.getAvailable()) {
            this.error('Device is deleted or not available (yet)');
            return;
        }
        try {
            // Check if message is for this instance (only)
            if (json.src !== this.getSetting("src")) return;

            // Debug received details (if requested)
            if (this.getSetting("debug")) this.log(`Received for ${json.src}:`, JSON.stringify(json), JSON.stringify(rinfo));

            // Try to retrieve the firmware version from the settings (including deprecated method) -- this.getSettings("firmware") ?? 
            let firmware = 0;
            if (this.getSetting("firmware")) {
                firmware = Number(this.getSetting("firmware"));
            } else {
                const model = this.getSetting("model");
                if (model) firmware = Number(model.split(' v')[1]);
            }

            // Determine the capabilities to changed based on the content of the received message
            if (json.result) {
                const result = json.result;

                // Main battery temperature (In degrees celcius)
                if (!isNaN(result.bat_temp)) {
                    // Some batteries have different decimal multiplier
                    if (result.bat_temp > 100) result.bat_temp = result.bat_temp / ((firmware >= 154) ? 1.0 : 10.0);
                    await this.setCapabilityValue('measure_temperature', result.bat_temp);
                }

                // Power remaining (In kWh)
                if (!isNaN(result.bat_capacity)) await this.setCapabilityValue('meter_power', result.bat_capacity / ((firmware >= 154) ? 1000.0 : 100.0));

                // Battery state of charge
                if (!isNaN(result.bat_soc)) await this.setCapabilityValue('measure_battery', result.bat_soc);

                // Battery power and charging state
                if (!isNaN(result.bat_power)) {
                    // Charge state (Possible values: "idle", "charging", "discharging")
                    await this.setCapabilityValue('battery_charging_state', (result.bat_power > 0) ? "charging" : (result.bat_power < 0) ? "discharging" : "idle");
                    await this.setCapabilityValue('measure_power', result.bat_power / ((firmware >= 154) ? 1.0 : 10.0));
                }

                // Input and output energy (kWh)
                if (!isNaN(result.total_grid_input_energy)) await this.setCapabilityValue('meter_power.imported', result.total_grid_input_energy / ((firmware >= 154) ? 10.0 : 100.0));
                if (!isNaN(result.total_grid_output_energy)) await this.setCapabilityValue('meter_power.exported', result.total_grid_output_energy / ((firmware >= 154) ? 10.0 : 100.0));
                if (!isNaN(result.total_load_energy)) await this.setCapabilityValue('meter_power.load', result.total_load_energy / ((firmware >= 154) ? 10.0 : 100.0));

                // Additional capabilities as communicated by Marstek to display in Homey (Watt)
                if (!isNaN(result.ongrid_power)) await this.setCapabilityValue('measure_power_ongrid', result.ongrid_power * -1);
                if (!isNaN(result.offgrid_power)) await this.setCapabilityValue('measure_power_offgrid', result.offgrid_power * -1);
                if (!isNaN(result.pv_power)) await this.setCapabilityValue('measure_power_pv', result.pv_power * -1);
            }

        }
        catch (error) {
            this.error('Error processing incoming message:', error);
            return;
        }
    }

    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted() {
        this.stopPolling();
        this.stopListening();
        if (this.getSetting("debug")) this.log('MarstekVenusDevice has been deleted');
    }

    async onUninit() {
        this.stopPolling();
        this.stopListening();
        if (this.getSetting("debug")) this.log('MarstekVenusDevice has been uninitialized');
    }

};