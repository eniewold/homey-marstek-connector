'use strict';

const Homey = require('homey');
const MarstekCloud = require('../../lib/marstek-cloud');
const crypto = require('crypto');

/**
 * Driver for Marstek Venus devices connected via the Marstek cloud service.
 * Manages pairing, credential reuse and provides access to shared cloud clients.
 * @extends Homey.Driver
 */
module.exports = class MarstekVenusCloudDriver extends Homey.Driver {

    /**
     * Called when the driver is initialised.
     * Prepares state for pairing sessions and client caching.
     * @returns {Promise<void>} Resolves when initialisation completes.
     */
    async onInit() {
        this.log('MarstekVenusCloudDriver has been initialized');
        this._pairSessions = new Map();
        this._clients = new Map();
        this.debug = (process.env.DEBUG === '1');
    }

    /**
     * Called when the driver is uninitialised by Homey.
     * Clears any cached sessions and clients to free resources.
     * @returns {Promise<void>} Resolves once cleanup completes.
     */
    async onUninit() {
        this.log('MarstekVenusCloudDriver has been uninitialized');
        this._pairSessions.clear();
        this._clients.clear();
    }

    /**
     * Handles a pairing session for the cloud driver.
     * Sets up handlers for login, device listing and session teardown.
     * @param {Object} session The pairing session provided by Homey.
     * @returns {Promise<void>} Resolves once handlers have been registered.
     */
    async onPair(session) {
        this._pairSessions.set(session, {});

        session.setHandler('login', async ({ username, password }) => {
            // Make sure to encode password immediately
            const credentials = {
                username: username?.trim(),
                password: this.encode(password)
            };
            if (!credentials.username || !credentials.password) {
                throw new Error('Please enter both username and password');
            }

            // Create a cloud client instance and store details into session (for other discovered devices)
            const client = this.getClient(credentials);
            await client.login();
            this._pairSessions.set(session, { credentials, client });
            return true;
        });

        session.setHandler('list_devices', async () => {
            const state = this._pairSessions.get(session);
            if (!state || !state.client) throw new Error('Not authenticated');
            const devices = await state.client.fetchDevices();
            if (!devices || devices.length === 0) {
                throw new Error('No devices were returned by the Marstek cloud account');
            }

            // Map received devices into known format
            return devices.map((device) => ({
                name: device.name,
                data: {
                    id: device.devid,
                },
                store: {
                    username: state.credentials.username,
                    password: state.credentials.password,
                    name: device.name,
                    type: device.type,
                    devid: device.devid,
                },
                settings: {
                    username: state.credentials.username,
                    type: device.type || '(unknown)',
                },
            }));
        });

        session.setHandler('disconnect', async () => {
            this._pairSessions.delete(session);
        });
    }

    /**
     * Retrieves or creates a cached Marstek cloud client for the provided credentials.
     * @param {{ username: string, password: string }} credentials Cloud account credentials.
     * @returns {MarstekCloud|null} The cached client instance or a newly created one.
     */
    getClient(credentials) {
        // Check if there already a client
        const client = this._clients.get(credentials.username);
        if (!client) {
            if (this.debug) this.log("Cloud client not found, create new instance with stored credentials.")
            const newClient = new MarstekCloud(
                credentials.username,
                credentials.password,
                this                    // pass our Homey Driver object for logging method access
            );
            this._clients.set(credentials.username, newClient);
            return newClient;
        } else {
            if (this.debug) this.log("Using available instance of cloud client.")
            return client;
        }
        return null;
    }

    /**
     * Encodes a plain-text password using MD5 hashing as required by the Marstek cloud API.
     * @param {string} password Plain-text password to encode.
     * @returns {string} The hashed password string.
     */
    encode(password) {
        return crypto.createHash('md5').update(password).digest('hex');
    }

};
