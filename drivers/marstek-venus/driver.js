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
        await this.homey.app.socket.disconnect();
    }

    /**
     * onPairListDevices is called when a user is adding a device
     * and the 'list_devices' view is called.
     * This should return an array with the data of devices that are available for pairing.
     */
    async onPairListDevices() {
        // Make sure the UDP socket is open
        await this.homey.app.socket.connect();

        // Broadcast and detect marstek devices
        let detectedDevices = await this.broadcastDetect();

        // Return all devices
        return detectedDevices.concat(testDevices);
    }

    // Number of devices that requested polling
    pollCount = 0;
    // Message number to broadcast (increased every poll)
    pollMessage = 0;
    // Wait time between broadcast messages (ms)
    pollWaitTime = 1521;
    // Actual message strings to broadcast
    pollMessages = [
        '{"id":"ES.GetStatus","method":"ES.GetStatus","params":{"id":0}}',
        '{"id":"Bat.GetStatus","method":"Bat.GetStatus","params":{"id":1}}'
    ];
    // interval handle
    interval = null;

    // Start polling of battery system data by broadcasting messages periodically
    pollStart() {
        this.pollCount++;
        if (!this.interval) {
            this.interval = this.homey.setInterval(() => {
                if (this.homey.app.socket) {
                    this.pollMessage = (this.pollMessage + 1 < this.pollMessages.length) ? (this.pollMessage + 1) : 0;
                    try {
                        this.homey.app.socket.broadcast(this.pollMessages[this.pollMessage]);
                    } catch (err) {
                        this.error('Error broadcasting:', error);
                    }
                }
            }, this.pollWaitTime);
        }
    }

    // Stop polling, called by device. When no devices need polling; the polling will stop.
    pollStop() {
        this.pollCount--;
        if (this.interval && this.pollCount === 0) {
            this.homey.clearInterval(this.interval);
            this.interval = null;
        }
    }

    // Broadcast an UDP message to the local network, waiting for a reply from the Marstek Venus device(s)
    async broadcastDetect() {
        let devices = [];
        const socket = this.homey.app.socket;
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
                            name: json.src,
                            data: {
                                id: unique,   // this seems to be the only unique id in the response
                            },
                            settings: {
                                src: json.src,
                                mac: json.result.wifi_mac,      // this is not unique, seems to be mac address for wifi access point
                                model: json.result.device + " " + json.result.ver,
                                ble: json.result.ble_mac,       // Bluetooth MAC address
                                wifi: json.result.wifi_name
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
