'use strict';

const Homey = require('homey');

/**
 * Driver responsible for managing Marstek Venus devices that communicate over UDP.
 * It provides device discovery, background polling, flow card actions and command handling.
 *
 * @extends Homey.Driver
 */
module.exports = class MarstekVenusDriver extends Homey.Driver {

    /**
     * Called when the driver is initialised.
     * Sets up flow listeners and logs driver startup.
     *
     * @returns {Promise<void>} Resolves once initialisation completes.
     */
    async onInit() {
        this.log('MarstekVenusDriver has been initialized');
        await this.registerFlowListeners();
    }

    /**
     * Called when the driver is uninitialised by Homey.
     *
     * @returns {Promise<void>} Resolves after cleaning up the shared socket connection.
     */
    async onUninit() {
        this.log('MarstekVenusDriver has been uninitialized');
        await this.homey.app.getSocket().disconnect();
    }

    /**
     * Handles the `list_devices` pairing view request by broadcasting discovery messages.
     *
     * @returns {Promise<Array<{name: string, data: {id: string}, settings: object, store: object}>>}
     * Resolves with the list of devices available for pairing.
     */
    async onPairListDevices() {
        // Broadcast and detect marstek devices
        return await this.broadcastDetect();
    }

    /**
     * Index of the message currently being broadcast.
     *
     * @type {number}
     */
    pollMessage = 0;

    /**
     * Delay between poll broadcasts in milliseconds.
     *
     * @type {number}
     */
    pollWaitTime = 15009;

    /**
     * Rotating list of messages that should be broadcast to request device status.
     *
     * @type {{ method: string, params: any }[]}
     */
    pollMessages = [
        { method: "ES.GetStatus", params: { id: 0 } },
        { method: "Bat.GetStatus", params: { id: 0 } },
        { method: "ES.GetStatus", params: { id: 0 } },
        { method: "ES.GetStatus", params: { id: 0 } },
    ];

    /**
     * Interval handle for the poll loop.
     *
     * @type {NodeJS.Timeout | null}
     */
    interval = null;

    /**
     * Message identifier counter used to keep requests unique.
     *
     * @type {number}
     */
    pollId = 9000;

    /**
     * Identifiers of devices currently participating in polling.
     *
     * @type {string[]}
     */
    pollDevices = []

    /**
     * Broadcasts a status request to the connected devices based on the rotating poll configuration.
     *
     * @returns {Promise<void>} Resolves once the message has been broadcast.
     */
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

    /**
     * Adds a device to the poll list and starts the polling interval if necessary.
     *
     * @param {string} device - Unique identifier of the device to poll.
     */
    pollStart(device) {
        this.pollDevices.push(device);
        if (!this.interval) {
            this.log("Started background polling");
            this.interval = this.homey.setInterval(async () => this.poll(), this.pollWaitTime);
            this.poll()
        }
    }

    /**
     * Removes a device from the poll list and stops the interval when no devices remain.
     *
     * @param {string} device - Unique identifier of the device to stop polling for.
     */
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

    /**
     * Registers listeners for the flow action cards supplied by the driver.
     *
     * @returns {Promise<void>} Resolves once the listeners are registered.
     */
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

    /**
     * Configures the device for automatic mode.
     *
     * @param {import('./device')} device - Target device instance.
     * @returns {Promise<void>} Resolves once the command succeeds.
     */
    async setModeAuto(device) {
        const config = {
            mode: "Auto",
            auto_cfg: {
                enable: 1
            }
        }
        await this.setModeConfiguration(device, config);
    }

    /**
     * Configures the device for AI mode.
     *
     * @param {import('./device')} device - Target device instance.
     * @returns {Promise<void>} Resolves once the command succeeds.
     */
    async setModeAI(device) {
        const config = {
            mode: "AI",
            ai_cfg: {
                enable: 1
            }
        }
        await this.setModeConfiguration(device, config);
    }

    /**
     * Configures the device for manual mode using the supplied schedule details.
     *
     * Example JSON:
     * {
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
     *
     * @param {import('./device')} device - Target device instance.
     * @param {string} start_time - Start time (HH:mm) for the manual schedule.
     * @param {string} end_time - End time (HH:mm) for the manual schedule.
     * @param {string[]} days - Collection of weekday indices (0-6) when the schedule applies.
     * @param {number} power - Target power setting for manual mode.
     * @param {boolean} enable - Whether the manual schedule should be enabled.
     * @returns {Promise<void>} Resolves once the command succeeds.
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

    /**
     * Configures the device for passive mode with the specified power and cooldown.
     *
     * Example JSON:
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
     * @param {import('./device')} device - Target device instance.
     * @param {number|string} power - Desired power value (can be provided as string from flow).
     * @param {number|string} seconds - Cooldown duration in seconds (can be provided as string from flow).
     * @returns {Promise<void>} Resolves once the command succeeds.
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


    /**
     * Sends the supplied mode configuration to the device and retries on transient errors.
     *
     * @param {import('./device')} device - Target device instance.
     * @param {object} config - Mode configuration payload.
     * @returns {Promise<void>} Resolves once the device confirms the configuration.
     * @throws {Error} When the device rejects the configuration or all retries fail.
     */
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

    /**
     * Sends a command to a device via the shared UDP socket and waits for the response.
     *
     * @param {import('./device')} device - Target device instance.
     * @param {string} method - RPC method to invoke.
     * @param {object} [params={}] - Parameters to include in the payload.
     * @param {number} [timeout=15000] - Time in milliseconds to wait for a response.
     * @returns {Promise<any>} Resolves with the JSON payload returned by the device.
     * @throws {Error} When the socket or device address are missing, or the operation times out.
     */
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

    /**
     * Discovers Marstek Venus devices by broadcasting a detection message and collecting responses.
     *
     * @returns {Promise<Array<{name: string, data: {id: string}, settings: object, store: object}>>} Resolves with the discovered devices.
     */
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
