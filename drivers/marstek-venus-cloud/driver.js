'use strict';

const Homey = require('homey');
const MarstekCloudClient = require('../../lib/marstek-cloud-client');

module.exports = class MarstekVenusCloudDriver extends Homey.Driver {

    async onInit() {
        this.log('MarstekVenusCloudDriver has been initialized');
        this._pairSessions = new Map();
    }

    async onUninit() {
        this.log('MarstekVenusCloudDriver has been uninitialized');
        this._pairSessions.clear();
    }

    async onPair(session) {
        this._pairSessions.set(session, {});

        session.setHandler('login', async ({ username, password, baseUrl }) => {
            const credentials = {
                username: username?.trim(),
                password,
                baseUrl: baseUrl?.trim() || undefined,
            };
            if (!credentials.username || !credentials.password) {
                throw new Error('Please enter both username and password');
            }

            const client = new MarstekCloudClient({ ...credentials, logger: this });
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

            return devices.map((device) => ({
                name: device.name,
                data: {
                    id: device.id,
                },
                store: {
                    credentials: state.credentials,
                    siteId: device.siteId,
                    deviceSn: device.deviceSn,
                    deviceId: device.deviceId,
                    productName: device.productName,
                },
                settings: {
                    username: state.credentials.username,
                    siteId: device.siteId || '(unknown)',
                    deviceSn: device.deviceSn || '(unknown)',
                },
            }));
        });

        session.setHandler('disconnect', async () => {
            this._pairSessions.delete(session);
        });
    }
};
