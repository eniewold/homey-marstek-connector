'use strict';

import Homey from 'homey';

// Use require for esModule class instances
import MarstekSocket from './lib/marstek-api';

export default class MarstekBatteryContoller extends Homey.App {

    // instance of socket handler class
    private socket?: MarstekSocket = undefined;

    /**
     * onInit is called when the app is initialized.
     */
    async onInit() {
        this.log('MarstekBatteryAPI has been initialized');

        // Remove socket when unloading
        this.homey.on('unload', () => {
            this.log('MarstekBatteryAPI has been unloaded');
            if (this.socket) {
                this.socket.destroy();
                this.socket = undefined;
            }
        });
    }

    /**
     * This method is called when the app is destroyed
     */
    async onUninit() {
        this.log('MarstekBatteryAPI has been uninitialized');
        // Make sure the socket instance is cleaned and removed
        if (this.socket) {
            this.socket.destroy();
            this.socket = undefined;
        }
    }

    /**
     * Retrieve an single instance of the Marstek Battery socket helper
     * @returns {MarstekSocket} the singleton instance of a MarstekSocket class
     */
    public getSocket() {
        // Create a socket instance, used for communication by all devices
        if (!this.socket) this.socket = new MarstekSocket(this);
        return this.socket ?? undefined;
    }

};

// Also use module.exports for Homey
module.exports = MarstekBatteryContoller;
