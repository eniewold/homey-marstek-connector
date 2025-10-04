'use strict';

const Homey = require('homey');

module.exports = class MarstekVenusDriver extends Homey.Driver {

    /**
     * onInit is called when the driver is initialized.
     */
    async onInit() {
        this.log('MarstekVenusDriver has been initialized');
        await this.registerFlowListeners();
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
    // Actual messages to broadcast (request Energy System more frequently)
    pollMessages = [
        { method: "ES.GetStatus", params: { id: 0 } },
        { method: "Bat.GetStatus", params: { id: 0 } },
        { method: "ES.GetStatus", params: { id: 0 } },
        { method: "ES.GetStatus", params: { id: 0 } },
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
            this.pollMessage = (this.pollMessage + 1) % this.pollMessages.length;
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

    // Register flow listeners to take action when flow is action is taken
    async registerFlowListeners() {
        // Inline function to register handlers
        const register = (id, handler) => {
            const card = this.homey.flow.getActionCard(id);
            card.registerRunListener(async (args) => {
                await handler(args);
                return true;
            });
        };

        // Make sure to register all flow handlers
        register('marstek_auto_mode', async ({ device }) => this.setModeAuto(device));
        register('marstek_ai_mode', async ({ device }) => this.setModeAI(device));
        register('marstek_manual_mode', async ({ device, start_time, end_time, days, power, enable }) => this.setModeManual(device, start_time, end_time, days, power, enable));
        register('marstek_passive_mode', async ({ device, power, seconds }) => this.setModePassive(device, power, seconds));
    }

    // Create config object for device mode 'Auto'
    async setModeAuto(device) {
        const config = {
            mode: "Auto",
            auto_cfg: {
                enable: 1
            }
        }
        await this.setModeConfiguration(device, config);
    }

    // Create config object for device mode 'AI'
    async setModeAI(device) {
        const config = {
            mode: "AI",
            ai_cfg: {
                enable: 1
            }
        }
        await this.setModeConfiguration(device, config);
    }

    /**  Create config object for device mode 'Manual'
     * Example JSON:
    {
        "id": 1,
        "method": "ES.SetMode",
        "params": {
            "id": 0,
                "config": {
                "mode": "Manual",
                "manual_cfg": {
                    "time_num": 1,
                    "start_time": "08:30",
                    "end_time": "20:30",
                    "week_set": 127,
                    "power": 100,
                    "enable": 1
                }
            }
        }
    }
     */
    async setModeManual(device, start_time, end_time, days, power, enable) {
        let bitArray = [..."00000000"];
        days.forEach((day) => { bitArray[parseInt(day)] = "1" });
        const bitString = bitArray.join("");
        let bitValue = parseInt(bitString, 2);
        const config = {
            mode: "Manual",
            manual_cfg: {
                time_num: 9,
                start_time: start_time,
                end_time: end_time,
                week_set: bitValue,
                power: power,
                enable: enable ? 1 : 0
            }
        }
        await this.setModeConfiguration(device, config);
    }

    /** Create config object for device mode 'Passive'
     * {
            "id": 1,
            "method": "ES.SetMode",
            "params": {
                "id": 0,
                    "config": {
                    "mode": "Passive",
                    "passive_cfg": {
                        "power": 100,
                        "cd_time": 300
                    }
                }
            }
        }
     * 
     */
    async setModePassive(device, power, seconds) {
        const numericPower = Number(power);
        const numericSeconds = Number(seconds);

        if (Number.isNaN(numericPower) || Number.isNaN(numericSeconds)) {
            throw new Error('Power and seconds must be numbers');
        }
        if (numericPower < 0 || numericSeconds < 0) {
            throw new Error('Power and seconds must be zero or greater');
        }

        const config = {
            mode: 'Passive',
            passive_cfg: {
                power: numericPower,
                cd_time: numericSeconds,
            }
        }

        await this.setModeConfiguration(device, config);
    }

       
    // Prepare mode configuration message, transmit and check response
    async setModeConfiguration(device, config) {
        const maxRetries = 5;
        let attempt = 0;
        let lastError;

        while (attempt < maxRetries) {
            try {
                // Send command
                const result = await this.sendCommand(
                    device,
                    'ES.SetMode',
                    { id: 0, config: config }
                );
                // Only resolve when exact expected result is found { result: { id: 0, set_result: true }}
                if (result && typeof result === 'object' && 'set_result' in result && !result.set_result) {
                    throw new Error('Device rejected the requested mode change');
                }
                // Success
                return;
            } catch (err) {
                lastError = err;
                attempt++;
                if (attempt < maxRetries) {
                    this.log(`Retrying setModeConfiguration (attempt ${attempt + 1}/${maxRetries}) due to error:`, err.message);
                }
            }
        }
        // If all retries failed, throw the last error
        throw lastError;
    }

    // Send a command using the UDP server
    async sendCommand(device, method, params = {}, timeout = 15000) {
        const socket = this.homey.app.getSocket();
        const address = device.getStoreValue("address");
        if (!socket) throw new Error('Socket connection is not available.');
        if (!address) throw new Error('Device IP address it not available. Re-pair device or wait for first response from battery.');

        // Create payload with unique id
        const unique = "Homey-" + String(this.pollId++);
        const payload = {
            id: unique,
            method,
            params: params,
        };

        return await new Promise((resolve, reject) => {
            const handler = (json, remote) => {
                if (json.id === unique) {
                    cleanup();
                    if (json && json.result) {
                        resolve(json.result ?? null);
                    } else {
                        reject(new Error('Received json response is not as expected'));
                    }
                }
            };

            const cleanup = () => {
                socket.off(handler);
                this.homey.clearTimeout(timer);
            };

            const timer = this.homey.setTimeout(() => {
                this.error("Timeout while waiting for mode change response");
                cleanup();
                reject(new Error('Timed out waiting for device response'));
            }, timeout);

            socket.on(handler);

            socket.send(JSON.stringify(payload), address).catch((err) => {
                cleanup();
                reject(err);
            });
        });
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
                                id: unique,
                            },
                            settings: {
                                src: unique,
                                model: `${json.result.device} v${json.result.ver}`,
                                firmware: String(json.result.ver)   // firmware number, make sure to cast to string due to label (read-only) configuration
                            },
                            store: {
                                address: remote.address             // Store initial IP address
                            }
                        })
                    }
                }
            }
            socket.on(handler);

            // Message to detect batteries as documented in the API
            const message = '{"id":"Homey-Detect","method":"Marstek.GetDevice","params":{"ble_mac":"0"}}';
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
