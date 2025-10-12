import Homey from 'homey';

// Use require for esModule class instances

export default class MarstekBatteryContoller extends Homey.App {
    /**
     * onInit is called when the app is initialized.
     */
    async onInit() {
        this.log('MarstekBatteryAPI has been initialized');
    }

    /**
     * This method is called when the app is destroyed
     */
    async onUninit() {
        this.log('MarstekBatteryAPI has been uninitialized');
    }
};

// Also use module.exports for Homey
module.exports = MarstekBatteryContoller;
