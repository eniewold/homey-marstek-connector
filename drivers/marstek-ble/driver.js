'use strict';

const Homey = require('homey');

module.exports = class MarstekBleDriver extends Homey.Driver {

    async onInit() {
        this.log('MarstekBleDriver has been initialized');
    }

    async onPair(session) {
        this.log('Starting BLE pairing session');
        let discovered = [];

        const discover = async () => {
            try {
                const advertisements = await this.homey.ble.discover();
                const byUuid = new Map();
                for (const ad of advertisements) {
                    if (!ad.localName || !ad.localName.startsWith('MST_')) continue;
                    const uuid = ad.uuid || ad.id;
                    if (byUuid.has(uuid)) continue;
                    byUuid.set(uuid, {
                        name: ad.localName,
                        data: { id: uuid },
                        store: {
                            peripheralUuid: uuid,
                            peripheralId: ad.id,
                            mac: ad.address || '',
                        },
                        settings: {
                            peripheralUuid: uuid,
                            peripheralId: ad.id,
                            mac: ad.address || '',
                            model: '(unknown)',
                            firmware: '(unknown)'
                        }
                    });
                }
                discovered = Array.from(byUuid.values());
                this.log(`Discovered ${discovered.length} BLE device(s)`);
            } catch (error) {
                this.error('BLE discovery failed', error);
                discovered = [];
            }
        };

        session.setHandler('showView', async viewId => {
            if (viewId === 'loading') {
                await discover();
                await session.showView('list_devices');
            }
        });

        session.setHandler('list_devices', async () => discovered);
    }
};
