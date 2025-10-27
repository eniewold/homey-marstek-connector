import os from 'os'
import ip from 'ip'; // For converting broadcast IP address
import dgram from 'dgram'               // For UDP binding and sending

// Load homey config
import { config } from './config';

/**
 * @description Manages UDP socket communication specific for Marstek Venus home batteries
 * @class
 */
export default class MarstekSocket {

    // Private properties
    private parent: any = undefined;
    private port: number = 30000;
    private connected: boolean = false;
    private socket?: dgram.Socket;
    private handlers: Array<Function> = [];

    /**
     * Creates a new MarstekSocket instance.
     * @constructor
     * @param {object} parent - the Homey parent that is creating this class (for logging)
     */
    constructor(parent: any) {
        // Check if required parameters are passed
        if (!parent) throw new Error("[socket] Parent parameter required");

        // Remember our Homey parent object
        this.parent = parent;
    }

    /**
     * Safe write to log (of Homey parent) with fallback to console
     * @param {...any} args
     */
    log(...args: any[]) {
        if (this.parent) {
            if (config.isTestVersion) this.parent.log('[socket]', ...args);
        } else {
            console.log('[socket]', ...args);
        }
    }

    /**
     * Safe write to error log (of Homey parent) with fallback to console
     * @param {...any} args
     */
    error(...args: any[]) {
        if (this.parent) {
            this.parent.error('[socket]', ...args);
        } else {
            console.error('[socket]', ...args);
        }
    }

    /**
     * Connects to the Marstek device over an UDP socket.
     * @async
     * @returns {Promise<dgram.Socket>} Socket that is connected
     */
    async connect() {
        // Return a promise structure
        return new Promise((resolve, reject) => {
            // If socket already exists, just resolve
            if (this.socket && this.connected) {
                this.log('Socket already exists, resolve without binding');
                resolve(this.socket);
                return;
            }

            // If socket not found, create and connect (bind)
            try {
                this.log('Create and bind socket');

                // If socket is available, make sure to disconnect
                if (this.socket) this.disconnect();

                // Create the UDP socket and add message handler
                this.socket = dgram.createSocket({
                    type: 'udp4',
                    //    reuseAddr: true,
                    //    reusePort: true,
                }, async (message, remote) => {
                    // ignore messages from our own broadcast
                    if (remote.address !== this.getLocalIPAddress()) {
                        this.log('Message received from', remote.address);
                        const json = JSON.parse(message.toString());
                        this.log('Message parsed', JSON.stringify(json));
                        await this.callback(json, remote);
                    }
                });

                // Bind to our IP address(es)
                this.socket.bind({
                    port: this.port,    // Although variable, this is set to 30000
                    address: undefined, // make sure to bind to all local addresses
                    exclusive: true     // exclusive usage, we are the only one listening on this port
                }, () => {
                    this.log('Socket bound to port', this.port);
                    // Make sure to receive all broadcasted messages (catch in case of binding problems)
                    try {
                        if (!this.socket) throw new Error("Socket not available after binding");
                        this.socket.setBroadcast(true);
                        // Signal that the binding is completed
                        this.connected = true;
                    } catch (err) {
                        this.error('Could not set the broadcast flag:', (err as Error).message || err);
                        this.disconnect();
                        reject(err)
                        return;
                    }
                    // Finally resolve our promise
                    resolve(this.socket);
                });

                // Handle error events
                this.socket.on("error", (err) => {
                    this.error("onError", err);
                    this.disconnect();
                    this.connected = false;
                });

                // Handle close events
                this.socket.on('close', () => {
                    this.error("onClose");
                    this.connected = false;
                });

            } catch (err) {
                this.error('Error binding socket:', (err as Error).message || err);
                this.disconnect();
                reject(err);
                return;
            }

        });
    }

    /**
     * Retrieve Homey external IPv4 interface (assume single iface for Homey)
     * @returns {os.NetworkInterfaceInfoIPv4} the first external IP4 address structure of Homey network interfaces
     */
    getInterface() {
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            const ifaceList = interfaces[name];
            if (!ifaceList) continue;
            for (const iface of ifaceList) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface;
                }
            }
        }
        return undefined;
    }

    /**
     * Create a broadcast network address from Homey network interface
     * @returns {string} IPv4 address formatted as broadcast address
     */
    getBroadcastAddress() {
        const iface = this.getInterface();
        if (iface) {
            const subnet = ip.subnet(iface.address, iface.netmask);
            return subnet ? subnet.broadcastAddress : undefined;
        } else {
            this.error("No external IPv4 interface found; broadcast address could not be determined");
        }
        return undefined;
    }

    /**
     * Retrieve our external IPv4 address from Homey external network address
     * @returns {string} the first external IP4 address of Homey network interfaces
     */
    getLocalIPAddress() {
        const iface = this.getInterface();
        return iface ? iface.address : undefined;
    }

    /**
     * Broadcast a string message over the socket. Open socket when needed.
     * @param {string} message String message to transmit
     */
    async broadcast(message: string) {
        await this.transmit(message);
    }

    /**
     * Send given message over the socket. Open socket when needed.
     * @param {string} message String message to transmit
     * @param {string} address IP address to transmit to
     */
    async send(message: string, address: string) {
        // Check for address
        if (!address) throw new Error("[socket] No address given to transmit to");
        // Transmit
        await this.transmit(message, address);
    }

    /**
     * Transmit given message over socket (broadcast when no address is given)
     * @param {string} message String message to transmit
     * @param {string} [address] IP address to transmit to, leave empty to broadcast message
     */
    async transmit(message: string, address?: string) {
        // Try to connect, if not connected
        if (!this.connected) {
            try {
                await this.connect();
            } catch (err) {
                this.error("Can't transmit, not connected");
                return;
            }
        }

        // Set address to broadcast when not given
        if (!address) address = this.getBroadcastAddress();

        // Send using promise
        return new Promise((resolve, reject) => {
            try {
                this.log("Transmit:", message, address);
                const buffer = Buffer.from(message);
                this.socket?.send(buffer, 0, buffer.length, this.port, address, (err, bytes) => {
                    if (err) {
                        this.error("Error transmitting message:", err, address);
                        reject(err);
                    } else {
                        resolve(undefined);
                    }
                });
            } catch (err) {
                this.error('Exception transmitting message:', err, address);
                reject(err);
                return;
            }
        });
    }

    /**
     * Add a handler that needs to be called when messages are received
     * @param {Function} handler
     */
    on(handler: Function) {
        this.log("Handler added");
        if (!this.handlers.includes(handler)) {
            this.handlers.push(handler);  // won't add again
        }
    }

    /**
     * Remove a handler that no longer needs to be called when messages are received
     * @param {Function} handler
     */
    off(handler: Function) {
        this.log("Handler removed");
        const index = this.handlers.indexOf(handler);
        if (index !== -1) {
            this.handlers.splice(index, 1);
        }
    }

    /**
     * Execute all callback functions of all registered handlers (onMessage event)
     * @param {any} json - json object with received message details
     * @param {dgram.RemoteInfo} remote - remote details of message sender
     */
    async callback(json: any, remote: dgram.RemoteInfo) {
        this.handlers.forEach(async (handler) => {
            // TODO: prevent non-existant device handler execution
            try {
                if (typeof handler === 'function') {
                    return await handler(json, remote);
                }
            } catch (err) {
                this.error("Handler callback error", err);
            }
        });
    }

    /**
     * Disconnect the dgram UDP socket and destroy the instance
     */
    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = undefined;
        }
        this.connected = false;
    }

    /**
     * Cleanup actions when the instance is being destroyed.
     * Makes sure to disconnect and clear handler references.
     */
    destroy() {
        this.disconnect();
        this.handlers = [];
    }

}