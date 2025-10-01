'use strict';

const Homey = require('homey');
const protocol = require('./lib/protocol');

const SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
const CHARACTERISTIC_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';
const POLL_INTERVAL_MS = 60 * 1000;

module.exports = class MarstekBleDevice extends Homey.Device {

    pollHandle = null;
    reconnectHandle = null;
    peripheral = null;
    messageSequence = 0;

    async onInit() {
        if (this.getSetting('debug')) this.log('MarstekBleDevice initialized');
        await this.resetCapabilities();
        await this.updateStaticSettings();
        await this.initializeConnection();
    }

    async updateStaticSettings() {
        const updates = {};
        const storedUuid = this.getStoreValue('peripheralUuid') || (this.getData() ? this.getData().id : null);
        if (storedUuid && this.getSetting('peripheralUuid') !== storedUuid) updates.peripheralUuid = storedUuid;
        const storedId = this.getStoreValue('peripheralId');
        if (storedId && this.getSetting('peripheralId') !== storedId) updates.peripheralId = storedId;
        const storedMac = this.getSetting('mac');
        if (!storedMac && this.getStoreValue('mac')) updates.mac = this.getStoreValue('mac');
        if (Object.keys(updates).length) {
            try {
                await this.setSettings(updates);
            } catch (error) {
                this.error('Failed to persist static settings', error);
            }
        }
    }

    async initializeConnection() {
        try {
            await this.ensurePeripheral();
            await this.readDeviceInfo();
            await this.pollStatus();
            this.startPolling();
            await this.setAvailable();
        } catch (error) {
            this.error('Failed to initialize BLE device', error);
            await this.setUnavailable(error.message);
            this.scheduleReconnect();
        }
    }

    async resetCapabilities() {
        const ensureCapability = async capability => {
            if (!this.hasCapability(capability)) await this.addCapability(capability);
        };
        await ensureCapability('meter_power.imported');
        await ensureCapability('meter_power.exported');
        await ensureCapability('meter_power.load');
        await ensureCapability('measure_power_ongrid');
        await ensureCapability('measure_power_offgrid');
        await ensureCapability('measure_power_pv');

        await this.setCapabilityValue('battery_charging_state', null);
        await this.setCapabilityValue('meter_power', null);
        await this.setCapabilityValue('measure_power', null);
        await this.setCapabilityValue('measure_temperature', null);
        await this.setCapabilityValue('measure_battery', null);
        await this.setCapabilityValue('meter_power.imported', null);
        await this.setCapabilityValue('meter_power.exported', null);
        await this.setCapabilityValue('meter_power.load', null);
        await this.setCapabilityValue('measure_power_ongrid', null);
        await this.setCapabilityValue('measure_power_offgrid', null);
        await this.setCapabilityValue('measure_power_pv', null);
    }

    async ensurePeripheral() {
        if (this.peripheral && this.peripheral.isConnected) return this.peripheral;
        const uuid = this.getStoreValue('peripheralUuid') || this.getSetting('peripheralUuid') || (this.getData() ? this.getData().id : null);
        if (!uuid) {
            throw new Error('Missing peripheral UUID');
        }
        const advertisement = await this.homey.ble.find(uuid);
        if (!advertisement) {
            throw new Error('BLE device not found');
        }
        this.peripheral = await advertisement.connect();
        if (this.getSetting('debug')) this.log('Connected to BLE peripheral', uuid);
        return this.peripheral;
    }

    async disconnectPeripheral() {
        if (this.peripheral) {
            try {
                await this.peripheral.disconnect();
            } catch (error) {
                this.error('Failed to disconnect peripheral', error);
            }
            this.peripheral = null;
        }
    }

    startPolling() {
        if (this.pollHandle) return;
        this.pollHandle = this.homey.setInterval(() => {
            this.pollStatus().catch(error => this.handlePollError(error));
        }, POLL_INTERVAL_MS);
    }

    stopPolling() {
        if (this.pollHandle) {
            this.homey.clearInterval(this.pollHandle);
            this.pollHandle = null;
        }
    }

    scheduleReconnect() {
        if (this.reconnectHandle) return;
        this.reconnectHandle = this.homey.setTimeout(async () => {
            this.reconnectHandle = null;
            await this.initializeConnection();
        }, 15000);
    }

    clearReconnect() {
        if (this.reconnectHandle) {
            this.homey.clearTimeout(this.reconnectHandle);
            this.reconnectHandle = null;
        }
    }

    async handlePollError(error) {
        this.error('BLE polling failed', error);
        await this.setUnavailable(error.message);
        await this.disconnectPeripheral();
        this.scheduleReconnect();
    }

    async pollStatus() {
        const request = protocol.buildStatusRequest(this.messageSequence++);
        const response = await this.exchange(request);
        const status = protocol.parseStatusResponse(response.payload);
        const result = status && status.result ? status.result : status;
        if (!result || typeof result !== 'object') {
            throw new Error('Invalid status payload');
        }
        await this.updateCapabilities(result);
        if (!this.getAvailable()) await this.setAvailable();
    }

    async readDeviceInfo() {
        try {
            const request = protocol.buildDeviceInfoRequest();
            const response = await this.exchange(request);
            const info = protocol.parseDeviceInfoResponse(response.payload);
            const result = info && info.result ? info.result : info;
            if (!result || typeof result !== 'object') return;
            const updates = {};
            if (result.device && this.getSetting('model') !== result.device) updates.model = result.device;
            if (result.ver && this.getSetting('firmware') !== result.ver) updates.firmware = result.ver;
            if (result.mac && this.getSetting('mac') !== result.mac) updates.mac = result.mac;
            if (Object.keys(updates).length) {
                await this.setSettings(updates);
            }
        } catch (error) {
            this.error('Failed to read device info over BLE', error);
        }
    }

    async updateCapabilities(result) {
        const firmwareSetting = this.getSetting('firmware');
        const firmware = Number(firmwareSetting) || 0;

        if (!isNaN(result.bat_temp)) {
            let value = result.bat_temp;
            if (value > 100) value = value / ((firmware >= 154) ? 1.0 : 10.0);
            await this.setCapabilityValue('measure_temperature', value);
        }

        if (!isNaN(result.bat_capacity)) {
            await this.setCapabilityValue('meter_power', result.bat_capacity / ((firmware >= 154) ? 1000.0 : 100.0));
        }

        if (!isNaN(result.bat_soc)) {
            await this.setCapabilityValue('measure_battery', result.bat_soc);
        }

        if (!isNaN(result.bat_power)) {
            const state = result.bat_power > 0 ? 'charging' : (result.bat_power < 0 ? 'discharging' : 'idle');
            await this.setCapabilityValue('battery_charging_state', state);
            await this.setCapabilityValue('measure_power', result.bat_power / ((firmware >= 154) ? 1.0 : 10.0));
        }

        if (!isNaN(result.total_grid_input_energy)) {
            await this.setCapabilityValue('meter_power.imported', result.total_grid_input_energy / ((firmware >= 154) ? 10.0 : 100.0));
        }
        if (!isNaN(result.total_grid_output_energy)) {
            await this.setCapabilityValue('meter_power.exported', result.total_grid_output_energy / ((firmware >= 154) ? 10.0 : 100.0));
        }
        if (!isNaN(result.total_load_energy)) {
            await this.setCapabilityValue('meter_power.load', result.total_load_energy / ((firmware >= 154) ? 10.0 : 100.0));
        }

        if (!isNaN(result.ongrid_power)) {
            await this.setCapabilityValue('measure_power_ongrid', result.ongrid_power * -1);
        }
        if (!isNaN(result.offgrid_power)) {
            await this.setCapabilityValue('measure_power_offgrid', result.offgrid_power * -1);
        }
        if (!isNaN(result.pv_power)) {
            await this.setCapabilityValue('measure_power_pv', result.pv_power * -1);
        }
    }

    async exchange(requestBuffer) {
        const peripheral = await this.ensurePeripheral();
        const serviceUuid = SERVICE_UUID;
        const characteristicUuid = CHARACTERISTIC_UUID;
        if (this.getSetting('debug')) this.log('Sending BLE frame', requestBuffer.toString('hex'));
        await peripheral.write(serviceUuid, characteristicUuid, requestBuffer);
        const response = await peripheral.read(serviceUuid, characteristicUuid);
        if (this.getSetting('debug')) this.log('Received BLE frame', response.toString('hex'));
        return protocol.parseFrame(response);
    }

    async onDeleted() {
        this.stopPolling();
        this.clearReconnect();
        await this.disconnectPeripheral();
        if (this.getSetting('debug')) this.log('MarstekBleDevice deleted');
    }

    async onUninit() {
        this.stopPolling();
        this.clearReconnect();
        await this.disconnectPeripheral();
        if (this.getSetting('debug')) this.log('MarstekBleDevice uninitialized');
    }
};
