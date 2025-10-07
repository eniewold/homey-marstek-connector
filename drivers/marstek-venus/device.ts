'use strict';

import Homey from 'homey'
import dgram from 'dgram'               // For UDP binding and sending
import MarstekBatteryContoller from '../../app'
import MarstekVenusDriver from './driver'

/**
 * Represents a Marstek Venus device connected locally via UDP.
 * The device listens for broadcast messages, keeps capabilities in sync,
 * and exposes polling controls.
 * @extends Homey.Device
 */
export default class MarstekVenusDevice extends Homey.Device {

    // Handler bound to the socket listener so it can be registered/unregistered.
    private handler = this.onMessage.bind(this);

    //Identifier for the interval that updates the last received timestamp.
    private interval?: NodeJS.Timeout = undefined;

    // Cast pointer to our app
    private myApp: MarstekBatteryContoller = this.homey.app as MarstekBatteryContoller;
    private myDriver: MarstekVenusDriver = this.driver as MarstekVenusDriver;

    // Timestamp last received details
    private timestamp?: Date = undefined;

    /**
     * Called by Homey when the device is initialized.
     * Starts listening to the shared UDP socket, resets capabilities,
     * and schedules background polling.
     * @returns {Promise<void>} Resolves once startup work completes.
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

    /**
     * Resets the registered capabilities to `null` so they appear as unknown in Homey.
     * Also ensures each capability exists on the device, adding any that are missing
     * to support upgrades that introduce new capabilities.
     * @returns {Promise<void>} Resolves once all capabilities are synchronised.
     */
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

    /**
     * Registers the UDP message listener for this device on the shared socket.
     * @returns {Promise<void>} Resolves when the listener has been registered.
     */
    async startListening() {
        if (this.getSetting("debug")) this.log("Start listening");
        this.myApp.getSocket().on(this.handler)
    }

    /**
     * Removes the UDP message listener for this device from the shared socket.
     */
    stopListening() {
        if (this.getSetting("debug")) this.log("Stop listening");
        this.myApp.getSocket().off(this.handler);
    }

    /**
     * Starts the periodic polling routine for the device.
     * The driver initiates UDP broadcasts and an interval keeps the
     * `last_message_received` capability updated.
     */
    startPolling() {
        if (this.getSetting("debug")) this.log("Start polling");
        this.myDriver.pollStart(this.getSetting("src"));
        // Also start updating the last received message capability
        this.interval = this.homey.setInterval(async () => {
            if (this.timestamp) {
                const now = new Date();
                const diff = (now.getTime() - this.timestamp.getTime());
                await this.setCapabilityValue('last_message_received', Math.round(diff / 1000));
            }
        }, 5000);
    }

    /**
     * Stops the periodic polling routine and clears the update interval.
     */
    stopPolling() {
        if (this.getSetting("debug")) this.log("Stop polling");
        this.myDriver.pollStop(this.getSetting("src"));
        if (this.interval) this.homey.clearInterval(this.interval);
    }

    /**
     * Handles incoming UDP messages received by the shared socket.
     * Updates device state when the payload belongs to this device and
     * exposes diagnostic information when debug logging is enabled.
     * @param {any} json JSON payload received from the UDP socket.
     * @param {any} remote Metadata describing the remote sender (e.g. address).
     * @returns {Promise<void>} Resolves once the payload has been processed.
     */
    async onMessage(json: any, remote: dgram.RemoteInfo) {
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
                this.timestamp = new Date();
                await this.setCapabilityValue('last_message_received', 0);       // number of seconds the last received message

                // Main battery temperature (In degrees celcius)
                if (!isNaN(result.bat_temp)) {
                    // TODO: figure out what the actual multipliers are per firmware, for now, use sanity check
                    if (result.bat_temp > 50) result.bat_temp /= 10.0;
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
     * Called when the user removes the device from Homey.
     * Cleans up polling and socket listeners.
     * @returns {Promise<void>} Resolves once cleanup finishes.
     */
    async onDeleted() {
        this.stopPolling();
        this.stopListening();
        if (this.getSetting("debug")) this.log('MarstekVenusDevice has been deleted');
    }

    /**
     * Called when the device instance is uninitialised by Homey.
     * Cleans up background resources similar to {@link MarstekVenusDevice#onDeleted}.
     * @returns {Promise<void>} Resolves once cleanup completes.
     */
    async onUninit() {
        this.stopPolling();
        this.stopListening();
        if (this.getSetting("debug")) this.log('MarstekVenusDevice has been uninitialized');
    }

};

// Also use module.exports for Homey
module.exports = MarstekVenusDevice;
