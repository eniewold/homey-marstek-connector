'use strict';

const Homey = require('homey');

module.exports = class MarstekVenusDriver extends Homey.Driver {

    /**
     * onInit is called when the driver is initialized.
     */
    async onInit() {
        this.log('MarstekVenusDriver has been initialized');
        await this._registerFlowListeners();
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

    async _registerFlowListeners() {
        const register = (id, handler) => {
            const card = this.homey.flow.getActionCard(id);
            card.registerRunListener(async (args) => {
                await handler(args);
                return true;
            });
        };

        register('marstek_auto_mode_on', async ({ device }) => this._setModeEnabled(device, 'Auto', true));
        register('marstek_auto_mode_off', async ({ device }) => this._setModeEnabled(device, 'Auto', false));
        register('marstek_ai_mode_on', async ({ device }) => this._setModeEnabled(device, 'AI', true));
        register('marstek_ai_mode_off', async ({ device }) => this._setModeEnabled(device, 'AI', false));
        register('marstek_manual_mode_on', async ({ device }) => this._setModeEnabled(device, 'Manual', true));
        register('marstek_manual_mode_off', async ({ device }) => this._setModeEnabled(device, 'Manual', false));
        register('marstek_passive_mode_on', async ({ device }) => this._setPassiveMode(device, true));
        register('marstek_passive_mode_off', async ({ device }) => this._setPassiveMode(device, false));
        register('marstek_passive_mode_set', async ({ device, power, seconds }) => this._configurePassiveMode(device, power, seconds));
    }

    async _setModeEnabled(device, mode, enabled) {
        const config = await this._getModeConfiguration(device);
        const updated = this._cloneConfig(config);

        if (enabled) updated.mode = mode;

        switch (mode) {
            case 'Auto':
                updated.auto_cfg = Object.assign({}, updated.auto_cfg, { enable: enabled ? 1 : 0 });
                break;
            case 'AI':
                updated.ai_cfg = Object.assign({}, updated.ai_cfg, { enable: enabled ? 1 : 0 });
                break;
            case 'Manual':
                updated.manual_cfg = Object.assign({}, updated.manual_cfg, { enable: enabled ? 1 : 0 });
                break;
            default:
                throw new Error(`Unsupported mode: ${mode}`);
        }

        await this._setModeConfiguration(device, updated);
    }

    async _setPassiveMode(device, enabled) {
        const config = await this._getModeConfiguration(device);
        const updated = this._cloneConfig(config);

        updated.passive_cfg = Object.assign({}, updated.passive_cfg);

        if (enabled) {
            updated.mode = 'Passive';
        } else {
            updated.passive_cfg.cd_time = 0;
            updated.mode = 'Auto';
        }

        await this._setModeConfiguration(device, updated);
    }

    async _configurePassiveMode(device, power, seconds) {
        const numericPower = Number(power);
        const numericSeconds = Number(seconds);

        if (Number.isNaN(numericPower) || Number.isNaN(numericSeconds)) {
            throw new Error('Power and seconds must be numbers');
        }
        if (numericPower < 0 || numericSeconds < 0) {
            throw new Error('Power and seconds must be zero or greater');
        }

        const config = await this._getModeConfiguration(device);
        const updated = this._cloneConfig(config);

        updated.mode = 'Passive';
        updated.passive_cfg = Object.assign({}, updated.passive_cfg, {
            power: numericPower,
            cd_time: numericSeconds,
        });

        await this._setModeConfiguration(device, updated);
    }

    _cloneConfig(config) {
        return JSON.parse(JSON.stringify(config ?? {}));
    }

    async _getModeConfiguration(device) {
        const result = await this._sendCommand(device, 'ES.GetMode', { id: 0 }, { waitForResponse: true });
        const config = result && typeof result === 'object' ? (result.config ?? result) : null;
        if (!config || typeof config !== 'object') {
            throw new Error('Failed to retrieve mode configuration');
        }
        return config;
    }

    async _setModeConfiguration(device, config) {
        const sanitized = this._cloneConfig(config);
        const result = await this._sendCommand(device, 'ES.SetMode', { id: 0, config: sanitized }, { waitForResponse: true });
        if (result && typeof result === 'object' && 'set_result' in result && !result.set_result) {
            throw new Error('Device rejected the requested mode change');
        }
    }

    async _sendCommand(device, method, params = {}, { waitForResponse = false, timeout = 5000 } = {}) {
        const socket = this.homey.app.getSocket();
        if (!socket) throw new Error('Socket connection is not available');

        const messageId = `Homey-${method}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
        const deviceSrc = device && typeof device.getSetting === 'function' ? device.getSetting('src') : null;
        const paramsPayload = Object.assign({ id: 0 }, params);
        if (deviceSrc) paramsPayload.src = paramsPayload.src ?? deviceSrc;

        const payload = {
            id: messageId,
            method,
            params: paramsPayload,
        };

        if (!waitForResponse) {
            await socket.broadcast(JSON.stringify(payload));
            return null;
        }

        if (!deviceSrc) throw new Error('Device source identifier is missing');

        return await new Promise((resolve, reject) => {
            const handler = (json) => {
                if (!json || json.src !== deviceSrc || json.id !== messageId) return;
                cleanup();
                if (json.error) {
                    reject(new Error(json.error.message || 'Device returned an error'));
                } else {
                    resolve(json.result ?? null);
                }
            };

            const cleanup = () => {
                socket.off(handler);
                this.homey.clearTimeout(timer);
            };

            const timer = this.homey.setTimeout(() => {
                cleanup();
                reject(new Error('Timed out waiting for device response'));
            }, timeout);

            socket.on(handler);

            socket.broadcast(JSON.stringify(payload)).catch((err) => {
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
                                firmware: String(json.result.ver)    // firmware number, make sure to cast to string due to label (read-only) configuration
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
