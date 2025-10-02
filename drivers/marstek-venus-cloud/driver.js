'use strict';

const Homey = require('homey');
const MarstekCloud = require('../../lib/marstek-cloud');
const crypto = require('crypto');

module.exports = class MarstekVenusCloudDriver extends Homey.Driver {

    async onInit() {
        this.log('MarstekVenusCloudDriver has been initialized');
        this._pairSessions = new Map();
        this._clients = new Map();
    }

    async onUninit() {
        this.log('MarstekVenusCloudDriver has been uninitialized');
        this._pairSessions.clear();
        this._clients.clear();
    }

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

    // Retrieve Marstek Cloud Client related to username
    getClient(credentials, logger) {
        // Check if there already a client
        const client = this._clients.get(credentials.username);
        if (!client) {
            const newClient = new MarstekCloud({ ...credentials, logger: logger || this });
            this._clients.set(credentials.username, newClient);
            return newClient;
        } else {
            return client;
        }
        return null;
    }

    // encode password using MD5
    encode(password) {
        return crypto.createHash('md5').update(password).digest('hex');
    }


};
