// socket.js
// Socket communication module for Marstek Venus driver

const dgram = require('dgram');         // For UDP socket binding
const os = require('os');               // For resolving IP address
const ip = require('ip');               // For converting broadcast IP address

module.exports = class MarstekSocket {

    /**
     * Creates a new VenusSocket instance.
     * @param {parent} object - the Homey parent that is creating this class
     */
    constructor(parent) {
        // Check if required parameters are passed
        if (!parent) throw new Error("[socket] Parent parameter required");

        // Remember our Homey parent object
        this.parent = parent;

        // Default values
        this.port = 30000;
        this.connected = false;
        this.socket = null;
        this.debug = false;
    }

    /**
     * Connects to the Marstek device.
     */
    async connect() {
        return new Promise((resolve, reject) => {
            // If socket already exists, just resolve
            if (this.socket && this.connected) {
                this.parent.log('[socket] Socket already exists, resolve without binding');
                resolve(this.socket);
            } else {
                try {
                    if (this.debug) this.parent.log('[socket] Create and bind socket');
                    // Create the UDP socket
                    this.socket = dgram.createSocket({
                        type: 'udp4',
                        reuseAddr: true,
                        reusePort: true,
                        receiveBlockList: this.blocklist
                    }, (message, remote) => {
                        // ignore messages from our own broadcast
                        if (remote.address !== this.getLocalIPAddress()) {
                            if (this.debug) this.parent.log('[socket] Message received from', remote.address);
                            const json = JSON.parse(message.toString());
                            if (this.debug) this.parent.log('[socket] Message parsed', JSON.stringify(json));
                            this._handlerExecute(json, remote);
                        }
                    });
                    // Bind to our IP address(es)
                    this.socket.bind({
                        port: this.port,    // Although variable, this is set to 30000
                        address: null,      // make sure to bind to all local addresses    
                        exclusive: true     // exclusive usage, we are the only one listening on this port
                    }, () => {
                        if (this.debug) this.parent.log('[socket] Socket bound to port ', this.port);
                        // Make sure to receive all broadcasted messages (catch in case of binding problems)
                        try {
                            this.socket.setBroadcast(true);
                        } catch (err) {
                            this.parent.error('[socket] Could not set the broadcast flag:', err);
                            reject(err)
                        }
                        // Signal that the binding is completed
                        this.connected = true;
                        // Finally resolve our promise
                        resolve(this.socket);
                    });
                    // Catch any error
                    this.socket.on("error", this.onError);
                    // Catch socket close
                    this.socket.on('close', this.onClose);
                } catch (err) {
                    this.parent.error('[socket] Error binding socket:', err);
                    reject(err);
                }
            }
        });
    }

    // Retrieve our external IPv4 interface (assume single iface for Homey)
    getInterface() {
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface;
                }
            }
        }
        return null;
    }

    // Detect our ip broadcast address range
    getBroadcastAddress() {
        const iface = this.getInterface();
        const subnet = ip.subnet(iface.address, iface.netmask);
        return iface ? subnet.broadcastAddress : null;
    }

    // Retrieve our local IP address
    getLocalIPAddress() {
        const iface = this.getInterface();
        return iface ? iface.address : null;
    }

    // Immediately broadcast a mesasge (will not throttle)
    async broadcast(message) {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                if (this.debug) this.parent.error("[socket] Can't broadcast, tot connected");
                reject("Not connected")
            }
            try {
                if (this.debug) this.parent.log("[socket] Broadcast: ", message);
                const buffer = new Buffer.from(message);
                const address = this.getBroadcastAddress();
                this.socket.send(buffer, 0, buffer.length, this.port, address, (err, bytes) => {
                    if (err) {
                        this.parent.error("[socket] Error sending broadcast:", err);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            } catch (err) {
                this.parent.error('[socket] Exception sending broadcast:', err);
                reject(err);
            }
        });
    }


    // Add handler to listener
    on(handler) {
        if (this.debug) this.parent.log("[socket] Handler added");
        this._handlerAdd(handler);
    }

    // Off function for external usage
    off(handler) {
        if (this.debug) this.parent.log("[socket] Handler removed");
        this._handlerRemove(handler);
    }

    // Close message received from the socket
    onClose() {
        this.parent.error("[socket] Socket closed");
        this.connected = false;
        // TODO: handle unexpected closure
    }

    // Error message received from the socket
    onError(err) {
        this.parent.error("[socket] Error received: ", err);
        // TODO: handle errors
    }

    // Disconnect socket
    disconnect() {
        this.parent.log("[socket] disconnecting");
        if (this.socket) {
            this.socket.close();
            this.connected = false;
        }
    }

    // Clean up 
    destroy() {
        this.disconnect();
        this.socket.unref();
        this.socket.destroy();
        this.socket = null;
        this._handlers = [];
    }

    /**
     * Handlers private methods
     */
    _handlers = [];
    _handlerAdd(handler) {
        if (!this._handlers.includes(handler)) {
            this._handlers.push(handler);  // won't add again
        }
    }
    _handlerRemove(handler) {
        const index = this._handlers.indexOf(handler);
        if (index !== -1) {
            this._handlers.splice(index, 1);
        }
    }
    _handlerExecute(json, remote) {
        this._handlers.forEach((handler) => {
            // TODO: prevent non-existant device handler execution
            try {
                if (typeof handler === 'function') {
                    const result = handler(json, remote);
                }
            } catch (err) {
                this.parent.error("[socket] Handler callback error", err);
            }
        });
    }
}
