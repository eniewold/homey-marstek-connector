'use strict';

const Homey = require('homey');
const MarstekSocket = require('./socket');

module.exports = class MarstekBatteryAPI extends Homey.App {

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
                this.socket = null;
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
            this.socket = null;
        }
    }

    /**
     * Retrieve an instance of the Marstek Battery socket helper
     * @returns {MarstekSocket}
     */
    getSocket() {
        // Create a socket instance, used for communication by all devices
        if (!this.socket) this.socket = new MarstekSocket(this);
        return this.socket ?? null;
    }

};
