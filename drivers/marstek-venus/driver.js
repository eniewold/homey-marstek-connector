'use strict';

const Homey = require('homey');

module.exports = class MarstekVenusDriver extends Homey.Driver {

    /**
     * onInit is called when the driver is initialized.
     */
    async onInit() {
        this.log('MarstekVenusDriver has been initialized');
    }
    async onUninit() {
        this.log('MarstekVenusDriver has been uninitialized');
        await this.homey.app.getSocket().disconnect();
    }

    /**
     * onPairListDevices is called when a user is adding a device
     * and the 'list_devices' view is called.
     * This should return an array with the data of devices that are available for pairing.
     */
    async onPairListDevices() {
        // Broadcast and detect marstek devices
        return await this.broadcastDetect();
    }

    // Message number to broadcast (increased every poll)
    pollMessage = 0;
    // Wait time between broadcast messages (ms)
    pollWaitTime = 15009;
    // Actual message strings to broadcast
    pollMessages = [
        { method: "ES.GetStatus", params: { id: 0 } },
        { method: "Bat.GetStatus", params: { id: 0 } }
    ];
    // interval handle
    interval = null;
    // message id counter
    pollId = 9000;

    // Start polling of battery system data by broadcasting messages periodically
    pollDevices = []

    // Actual poll function (periodically called)
    async poll() {
        const socket = this.homey.app.getSocket();
        if (socket) {
            try {
                const pollMessage = this.pollMessages[this.pollMessage];
                const message = { id: "Homey-" + String(this.pollId++), method: pollMessage.method, params: pollMessage.params };
                await socket.broadcast(JSON.stringify(message));
            } catch (err) {
                this.error('Error broadcasting:', err);
            }
            this.pollMessage = (this.pollMessage + 1 < this.pollMessages.length) ? (this.pollMessage + 1) : 0;
        }
    }

    // Add a new device to the pollers
    pollStart(device) {
        this.pollDevices.push(device);
        if (!this.interval) {
            this.log("Started background polling");
            this.interval = this.homey.setInterval(async () => this.poll(), this.pollWaitTime);
            this.poll()
        }
    }

    // Stop polling, called by device. When no devices need polling; the polling will stop.
    pollStop(device) {
        // Remove the device from the polling devices
        const index = this.pollDevices.indexOf(device);
        if (index !== -1) this.pollDevices.splice(index, 1);
        // When no more devices are left; stop interval polling
        if (this.interval && this.pollDevices.length === 0) {
            this.homey.clearInterval(this.interval);
            this.interval = null;
            this.log("Stopped background polling");
        }
    }

    // Broadcast an UDP message to the local network, waiting for a reply from the Marstek Venus device(s)
    async broadcastDetect() {
        let devices = [];
        const socket = this.homey.app.getSocket();
        return new Promise((resolve, reject) => {

            // Handler for messages received
            const handler = (json, remote) => {
                // Always log received data during detection
                this.log(`Received for ${json.src}:`, JSON.stringify(json));                
                // Only further check messages that have the correct properties
                if (json && json.src && json.result && json.result.device) {
                    // Detect if device is alread in array
                    const unique = json.src;
                    if (!devices.find((element) => element.data.id === unique)) {
                        devices.push({
                            name: unique,
                            data: {
                                id: unique,   // this seems to be the only unique id in the response
                            },
                            settings: {
                                src: unique,
                                model: `${json.result.device} v${json.result.ver}`
                            }
                        })
                    }
                }
            }
            socket.on(handler);

            // Message to detect batteries as documented in the API
            const message = '{"id":0,"method":"Marstek.GetDevice","params":{"ble_mac":"0"}}';
            this.log("Detection broadcasting:", message);
            socket.broadcast(message).then(() => {
                // Start broadcasting message
                const interval = this.homey.setInterval(() => {
                    socket.broadcast(message)
                }, 2000);
                // Stop broadcasting after 9 seconds (Homey waits 10 seconds before timeout)
                this.homey.setTimeout(() => {
                    this.homey.clearInterval(interval);
                    socket.off(handler);
                    resolve(devices);
                }, 9000);
            }).catch((reason) => {
                this.error('Error broadcasting message:', reason);
                socket.off(handler);
                reject(reason);
            });
        });
    }

};
