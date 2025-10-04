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
    // Also make sure they are added when device does not have capability; useful for version upgrades with new capabilites
    async resetCapabilities() {
        const capabilities = [
            'battery_charging_state',      // Charte state (Possible values: "idle", "charging", "discharging")
            'meter_power',                 // Power remaining (In kWh)
            'measure_power',               // Power usage/delivery (In Watts)
            'measure_temperature',         // Main battery temperature (In degrees celcius)
            'measure_battery',             // State of Charge in %
            'meter_power.imported',        // Total power imported (in kWh)
            'meter_power.exported',        // Total power exported (in kWh)
            'meter_power.load',            // Total power exported (in kWh)
            'measure_power_ongrid',        // Current power usage of on-grid port (in W)
            'measure_power_offgrid',       // Current power usage of off-grid port (in W)
            'measure_power_pv',            // Current power usage of off-grid port (in W)
            'last_message_received'        // number of seconds the last received message
        ];
        for (const cap of capabilities) {
            if (!this.hasCapability(cap)) await this.addCapability(cap);
            await this.setCapabilityValue(cap, null);
        }
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
        // Also start updating the last received message capability
        this.interval = this.homey.setInterval(async () => {
            if (this.timestamp) {
                const diff = Date.now() - this.timestamp;
                await this.setCapabilityValue('last_message_received', parseInt(diff / 1000));
            }
        }, 1000);
    }

    // End the polling interval
    interval = null;
    stopPolling() {
        if (this.getSetting("debug")) this.log("Stop polling");
        this.driver.pollStop(this.getSetting("src"));
        if (this.interval) this.homey.clearInterval(this.interval);
    }

    /**
     * Handle incoming UDP messages
     * @param {any} json json object received from source
     * @param {any} remote remote source address details
     */
    timestamp = null;
    async onMessage(json, remote) {
        // Check if device is still present
        if (!this.getAvailable()) {
            this.error('Device is deleted or not available (yet)');
            return;
        }
        try {
            // Check if message is for this instance (only)
            if (json.src !== this.getSetting("src")) return;

            // Debug received details (if requested)
            if (this.getSetting("debug")) this.log(`Received for ${json.src}:`, JSON.stringify(json), JSON.stringify(remote));

            // Update remote IP address of device (can change due to DHCP leases)
            if (remote.address) this.setStoreValue("address", remote.address);

            // Try to retrieve the firmware version from the settings (including deprecated method)
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

                // Remember our timestamp for last message received
                this.timestamp = Date.now();
                await this.setCapabilityValue('last_message_received', 0);       // number of seconds the last received message

                // Main battery temperature (In degrees celcius)
                if (!isNaN(result.bat_temp)) {
                    // Some batteries have different decimal multiplier
                    result.bat_temp /= ((firmware >= 154) ? 1.0 : 10.0);
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