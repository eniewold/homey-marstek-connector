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
        this.debug = (process.env.DEBUG === '1');
    }

    // Safe write to log (of parent) with fallback to console
    log(...args) {
        if (this.parent) {
            if (this.debug) this.parent.log('[socket]', ...args);
        } else {
            console.log(...args);
        }
    }

    // Safe write to error log (of parent if available) with fallback to console
    error(...args) {
        if (this.parent) {
            this.parent.error('[socket]', ...args);
        } else {
            console.error(...args);
        }
    }

    /**
     * Connects to the Marstek device.
     */
    async connect() {
        return new Promise((resolve, reject) => {
            // If socket already exists, just resolve
            if (this.socket && this.connected) {
                this.log('Socket already exists, resolve without binding');
                resolve(this.socket);
            } else {
                try {
                    this.log('Create and bind socket');

                    // Create the UDP socket and add message handler
                    this.socket = dgram.createSocket({
                        type: 'udp4',
                        reuseAddr: true,
                        reusePort: true,
                        receiveBlockList: this.blocklist
                    }, (message, remote) => {
                        // ignore messages from our own broadcast
                        if (remote.address !== this.getLocalIPAddress()) {
                            this.log('Message received from', remote.address);
                            const json = JSON.parse(message.toString());
                            this.log('Message parsed', JSON.stringify(json));
                            this._handlerExecute(json, remote);
                        }
                    });
                    // Bind to our IP address(es)
                    this.socket.bind({
                        port: this.port,    // Although variable, this is set to 30000
                        address: null,      // make sure to bind to all local addresses    
                        exclusive: true     // exclusive usage, we are the only one listening on this port
                    }, () => {
                        this.log('Socket bound to port ', this.port);
                        // Make sure to receive all broadcasted messages (catch in case of binding problems)
                        try {
                            this.socket.setBroadcast(true);
                        } catch (err) {
                            this.error('Could not set the broadcast flag:', err);
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
                    this.error('Error binding socket:', err);
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
        if (iface) {
            const subnet = ip.subnet(iface.address, iface.netmask);
            return subnet ? subnet.broadcastAddress : null;
        } else {
            this.error("No external IPv4 interface found; broadcast address could not be determined");
        }
        return null;
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
                this.error("Can't broadcast, tot connected");
                reject("Not connected")
            }
            try {
                this.log("Broadcast:", message);
                const buffer = new Buffer.from(message);
                const address = this.getBroadcastAddress();
                this.socket.send(buffer, 0, buffer.length, this.port, address, (err, bytes) => {
                    if (err) {
                        this.error("Error sending broadcast:", err);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            } catch (err) {
                this.error('Exception sending broadcast:', err);
                reject(err);
            }
        });
    }


    // Add handler to listener
    on(handler) {
        this.error("Handler added");
        this._handlerAdd(handler);
    }

    // Off function for external usage
    off(handler) {
        this.log("Handler removed");
        this._handlerRemove(handler);
    }

    // Close message received from the socket
    onClose() {
        this.error("Closed event");
        this.connected = false;
        // TODO: handle unexpected closure
    }

    // Error message received from the socket
    onError(err) {
        this.error("Error received: ", err);
        // TODO: handle errors
    }

    // Disconnect socket
    disconnect() {
        this.log("Disconnecting");
        if (this.socket) {
            this.socket.close();
            this.connected = false;
        }
    }

    // Clean up 
    destroy() {
        this.disconnect();
        if (this.socket) {
            this.socket.unref();
            this.socket = null;
        }
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
                this.error("Handler callback error", err);
            }
        });
    }
}
