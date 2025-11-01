import Homey from 'homey';
import dgram from 'dgram';               // For UDP binding and sending
import MarstekSocket from '../../lib/marstek-api';

// Import our loaded config
import { config } from '../../lib/config';

// Interface definition for battery messages
interface MessagePayload {
    method: 'ES.GetStatus' | 'Bat.GetStatus';
    params: { id: number };
}
interface PollRequest {
    payload: MessagePayload;
    broadcast: boolean;
}
interface MarsteRequest extends MessagePayload {
    id: number; // int16 max
}

/**
 * Driver responsible for managing Marstek Venus devices that communicate over UDP.
 * It provides device discovery, background polling, flow card actions and command handling.
 * @extends Homey.Driver
 */
export default class MarstekVenusDriver extends Homey.Driver {

    // Add extra details during debugging
    private debug: boolean = config.isTestVersion;

    // Cast pointer to our app
    private socket?: MarstekSocket = undefined;

    // Index of the message currently being broadcast.
    private pollMessage: number = 0;

    // Rotating list of messages that should be broadcast to request device status.
    private pollMessages: PollRequest[] = [
        { payload: { method: 'ES.GetStatus', params: { id: 0 } }, broadcast: false },
        { payload: { method: 'ES.GetStatus', params: { id: 0 } }, broadcast: false },
        { payload: { method: 'Bat.GetStatus', params: { id: 0 } }, broadcast: true },
        { payload: { method: 'ES.GetStatus', params: { id: 0 } }, broadcast: false },
    ];

    // Interval handle for the poll loop.
    private pollTimeout?: NodeJS.Timeout = undefined;

    // Message identifier counter used to keep requests unique.
    // Note that 
    private pollId: number = Math.round(Math.random() * 10000);

    // Identifiers of devices currently participating in polling.
    private pollDevices: Array<string> = [];

    /**
     * Called when the driver is initialised.
     * Sets up flow listeners and logs driver startup.
     * @returns {Promise<void>} Resolves once initialisation completes.
     */
    async onInit() {
        if (this.debug) this.log('MarstekVenusDriver has been initialized');
        await this.registerFlowListeners();
    }

    /**
     * Called when the driver is uninitialised by Homey.
     * @returns {Promise<void>} Resolves after cleaning up the shared socket connection.
     */
    async onUninit() {
        if (this.debug) this.log('MarstekVenusDriver has been uninitialized');
        // Make sure to destroy the socket instance
        if (this.socket) {
            this.socket.destroy();
            this.socket = undefined;
        }
    }

    /**
     * Handles the custom pairing flow by persisting shared settings before device discovery begins.
     * @param {Homey.Driver.Session} session Active pairing session for the driver.
     * @returns {Promise<void>} Resolves once the pairing handlers are registered.
     */
    async onPair(session: Homey.Driver.PairSession): Promise<void> {
        // List devices template is handled using broadcast resolved device detection
        session.setHandler('list_devices', async () => this.broadcastDetect());

        // Received when a view has changed
        session.setHandler('showView', async (viewId) => {
            // Apply default values to settings form
            if (viewId === 'show_settings') {
                const interval: number = this.homey.settings.get('default_poll_interval') || 60;
                const enabled: boolean = this.homey.settings.get('default_poll_enabled') || false;
                await session.emit('initPollSettings', { interval, enabled });
            }
        });

        // Event is emitted from HTML form
        session.setHandler('savePollInterval', async (interval: number) => {
            if (this.debug) this.log('savePollInterval', interval);
            if (typeof interval === 'number' && !Number.isNaN(interval)) {
                this.homey.settings.set('default_poll_interval', interval);
            }
        });

        // Event is emitted from HTML form
        session.setHandler('savePollEnabled', async (enabled: boolean) => {
            if (typeof enabled === 'boolean') {
                this.homey.settings.set('default_poll_enabled', enabled);
            }
        });
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

    /**
     * Broadcasts a status request to the connected devices based on the rotating poll configuration.
     * @returns {Promise<void>} Resolves once the message has been broadcast.
     */
    async poll() {
        const socket = this.getSocket();
        if (socket) {
            try {
                const pollRequest = this.pollMessages[this.pollMessage];
                const message: MarsteRequest = {
                    id: this.getUniqueID(),
                    ...pollRequest.payload,
                };
                const json = JSON.stringify(message);
                if (pollRequest.broadcast) {
                    if (this.debug) this.log('Ready to broadcast:', json);
                    await socket.broadcast(json);
                } else {
                    this.getDevices().forEach(async (device) => {
                        const src = device.getSetting('src');
                        if (!src) throw new Error('Device without a "src" setting');
                        const index = this.pollDevices.indexOf(src);
                        if (index >= 0) {
                            const address = device.getStoreValue('address');
                            if (address) {
                                if (this.debug) this.log('Ready to send:', json, address);
                                await socket.send(json, address);
                                await new Promise(resolve => this.homey.setTimeout(resolve, 1000));
                            } else {
                                this.error('Device does not have an IP address stored. Next broadcast message can fix this.')
                            }
                        } else {
                            if (this.debug) this.log('Device found that is not part of polling array:', src);
                        }
                    });
                }
            } catch (err) {
                this.error('Error broadcasting:', err);
            }
            this.pollMessage = (this.pollMessage + 1) % this.pollMessages.length;
        }
    }

    /**
     * Adds a device to the poll list and starts the polling interval if necessary.
     * @param {string} device - Unique identifier of the device to poll.
     */
    pollStart(device: string) {
        this.pollDevices.push(device);
        if (!this.pollTimeout) {
            const interval = this.getPollInterval();
            if (this.debug) this.log('Started background polling with interval', interval);
            this.pollTimeout = this.homey.setInterval(async () => await this.poll(), interval);
            this.poll()
        }
    }

    /**
     * Removes a device from the poll list and stops the interval when no devices remain.
     * @param {string} device - Unique identifier of the device to stop polling for.
     */
    pollStop(device: string) {
        // Remove the device from the polling devices
        const index = this.pollDevices.indexOf(device);
        if (index !== -1) this.pollDevices.splice(index, 1);
        // When no more devices are left; stop interval polling
        if (this.pollTimeout && this.pollDevices.length === 0) {
            this.homey.clearInterval(this.pollTimeout);
            this.pollTimeout = undefined;
            if (this.debug) this.log('Stopped background polling');
        }
    }

    /**
     * Update the poll interval based on settings of all devices (only if polling is started)
     * Called by devices when setting is changed
     */
    pollIntervalUpdate() {
        if (this.pollTimeout) {
            this.homey.clearInterval(this.pollTimeout);
            const ms = this.getPollInterval();
            this.pollTimeout = this.homey.setInterval(async () => this.poll(), ms);
            if (this.debug) this.log('Updated background polling with interval', ms);
        }
    }

    /**
     * Retrieve the minimum interval settings from the devices (in milliseconds)
     * @returns
     */
    getPollInterval(): number {
        const devices = this.getDevices();
        let interval: number = 60 * 60; // start at hour, find minimum
        const defaultInterval: number = this.homey.settings.get('default_poll_interval') || interval; // default interval from app settings
        if (this.debug) this.log('Calculating poll interval from devices, default', defaultInterval, interval);
        devices.forEach((device) => {
            // if settings is not found, default to 15 since devices used this before setting was introduced
            const seconds = device.getSetting('interval');
            if (this.debug) this.log('Adjusting to interval device setting', seconds);
            if (seconds && seconds < interval) interval = seconds;
            if (this.debug) this.log('Interval set to', interval);
            if (!interval || interval < 15) {
                interval = 600;
                if (this.debug) this.error('Interval could not be determined, fallback to 10 minutes');
            }
        });
        return (interval * 1000) + Math.round(Math.random() * 100);
    }

    /** Retrieve a new unique string for json messages
     * @returns {number} unique number
     */
    private getUniqueID(): number {
        // Increment
        this.pollId++;
        // New random value around at 16bits
        if (this.pollId >= 65535) this.pollId = Math.round(Math.random() * 10000);
        return this.pollId;
    }

    /**
     * Registers listeners for the flow action cards supplied by the driver.
     * @returns {Promise<void>} Resolves once the listeners are registered.
     */
    async registerFlowListeners(): Promise<void> {
        // Inline function to register handlers
        const register = (id: string, handler: Function) => {
            const card = this.homey.flow.getActionCard(id);
            card.registerRunListener(async (args: any) => {
                await handler(args);
                return true;
            });
        };

        // Explicitly type the argument objects for each flow card
        register('marstek_auto_mode', async ({ device }: { device: Homey.Device }) => this.setModeAuto(device));
        register('marstek_ai_mode', async ({ device }: { device: Homey.Device }) => this.setModeAI(device));
        register(
            'marstek_manual_mode',
            async ({
                device,
                start_time,
                end_time,
                days,
                power,
                enable,
            }: {
                device: Homey.Device,
                start_time: string,
                end_time: string,
                days: string[],
                power: number,
                enable: boolean,
            }) => this.setModeManual(device, start_time, end_time, days, power, enable)
        );
        register(
            'marstek_passive_mode',
            async ({
                device,
                power,
                seconds,
            }: {
                device: Homey.Device,
                power: number | string,
                seconds: number | string,
            }) => this.setModePassive(device, power, seconds)
        );
    }

    /**
     * Configures the device for automatic mode.
     * @param {Homey.device} device - Target device instance.
     * @returns {Promise<void>} Resolves once the command succeeds.
     */
    async setModeAuto(device: Homey.Device) {
        const config = {
            mode: 'Auto',
            auto_cfg: {
                enable: 1
            },
        };
        await this.setModeConfiguration(device, config);
    }

    /**
     * Configures the device for AI mode.
     * @param {Homey.device} device - Target device instance.
     * @returns {Promise<void>} Resolves once the command succeeds.
     */
    async setModeAI(device: Homey.Device) {
        const config = {
            mode: 'AI',
            ai_cfg: {
                enable: 1
            },
        };
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
     * @param {Homey.device} device Target device instance.
     * @param {string} start_time Start time (HH:mm) for the manual schedule.
     * @param {string} end_time End time (HH:mm) for the manual schedule.
     * @param {string[]} days Collection of weekday indices (0-6) when the schedule applies.
     * @param {number} power Target power setting for manual mode.
     * @param {boolean} enable Whether the manual schedule should be enabled.
     * @returns {Promise<void>} Resolves once the command succeeds.
     */
    async setModeManual(device: Homey.Device, start_time: string, end_time: string, days: string[], power: number, enable: boolean) {
        const bitArray = [...'00000000'];
        days.forEach((day: string) => { bitArray[parseInt(day)] = '1' });
        const bitString = bitArray.join('');
        const bitValue = parseInt(bitString, 2);
        const config = {
            mode: 'Manual',
            manual_cfg: {
                time_num: 9,
                start_time: start_time,
                end_time: end_time,
                week_set: bitValue,
                power: power,
                enable: enable ? 1 : 0,
            }
        };
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
     * @param {Homey.device} device Target device instance.
     * @param {number|string} power Desired power value (can be provided as string from flow).
     * @param {number|string} seconds Cooldown duration in seconds (can be provided as string from flow).
     * @returns {Promise<void>} Resolves once the command succeeds.
     */
    async setModePassive(device: Homey.Device, power: number|string, seconds: number|string) {
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
        };

        await this.setModeConfiguration(device, config);
    }


    /**
     * Sends the supplied mode configuration to the device and retries on transient errors.
     * @param {import('./device')} device Target device instance.
     * @param {object} config Mode configuration payload.
     * @returns {Promise<void>} Resolves once the device confirms the configuration.
     * @throws {Error} When the device rejects the configuration or all retries fail.
     */
    async setModeConfiguration(device: Homey.Device, config: object) {
        const maxRetries = 5;
        let attempt = 0;
        let lastError;

        while (attempt < maxRetries) {
            try {
                // Send command
                const result = await this.sendCommand(
                    device,
                    'ES.SetMode',
                    {
                        id: 0,
                        config: config,
                    },
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
                    if (this.debug) this.log(`Retrying setModeConfiguration (attempt ${attempt + 1}/${maxRetries}) due to error:`, (err as Error).message || err);
                }
            }
        }
        // If all retries failed, throw the last error
        throw lastError;
    }

    /**
     * Sends a command to a device via the shared UDP socket and waits for the response.
     * @param {Homey.device} device Target device instance.
     * @param {string} method RPC method to invoke.
     * @param {object} [params={}] Parameters to include in the payload.
     * @param {number} [timeout=10000] Time in milliseconds to wait for a response.
     * @returns {Promise<any>} Resolves with the JSON payload returned by the device.
     * @throws {Error} When the socket or device address are missing, or the operation times out.
     */
    async sendCommand(device: Homey.Device, method: string, params = {}, timeout = 10000) {
        const socket = this.getSocket();
        const address = device.getStoreValue('address');
        if (!socket) throw new Error('Socket connection is not available.');
        if (!address) throw new Error('Device IP address it not available. Re-pair device or wait for first response from battery.');

        // Create payload with unique id
        const unique: number = this.getUniqueID();
        const payload = {
            id: unique,             // seems to be limited to 16bits integer
            method,
            params: params,
        };

        return await new Promise((resolve, reject) => {
            const handler = (json: any, remote: dgram.RemoteInfo) => {
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
                this.error('Timeout while waiting for mode change response');
                cleanup();
                reject(new Error('Timed out waiting for device response'));
            }, timeout);

            socket.on(handler);

            socket.send(JSON.stringify(payload), address).catch((err: Error) => {
                cleanup();
                reject(err);
            });
        });
    }

    /**
     * Discovers Marstek Venus devices by broadcasting a detection message and collecting responses.
     * @returns {Promise<Array<{name: string, data: {id: string}, settings: object, store: object}>>} Resolves with the discovered devices.
     */
    async broadcastDetect(): Promise<Array<any>> {
        let devices: Array<any> = [];
        const socket = this.getSocket();
        return new Promise((resolve, reject) => {

            // Handler for messages received
            const handler = (json: any, remote: dgram.RemoteInfo) => {
                // Always log received data during detection
                if (this.debug) this.log(`Received for ${json.src}:`, JSON.stringify(json), JSON.stringify(remote));                
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
                                poll: !!this.homey.settings.get('default_poll_enabled'),
                                interval: this.homey.settings.get('default_poll_interval') || 60,
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
            if (this.debug) this.log('Detection broadcasting:', message);
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
            }).catch((reason: Error) => {
                this.error('Error broadcasting message:', reason);
                socket.off(handler);
                reject(reason);
            });
        });
    }

};

// Also use module.exports for Homey
module.exports = MarstekVenusDriver;
