'use strict';

const HEADER = 0xAA;

const COMMANDS = Object.freeze({
    DEVICE_INFO: 0x10,
    STATUS: 0x20,
});

function calculateChecksum(buffer) {
    let sum = 0;
    for (const byte of buffer) {
        sum = (sum + byte) & 0xFF;
    }
    return sum;
}

function composeCommand(command, payload = Buffer.alloc(0)) {
    if (!Buffer.isBuffer(payload)) payload = Buffer.from(payload);
    const length = payload.length + 1; // include command byte
    const frame = Buffer.alloc(3 + payload.length + 1);
    frame[0] = HEADER;
    frame[1] = length;
    frame[2] = command;
    if (payload.length) payload.copy(frame, 3);
    frame[frame.length - 1] = calculateChecksum(frame.slice(1, frame.length - 1));
    return frame;
}

function parseFrame(buffer) {
    if (!Buffer.isBuffer(buffer)) {
        throw new Error('Response must be a Buffer');
    }
    if (buffer.length < 4) {
        throw new Error('Frame too short');
    }
    if (buffer[0] !== HEADER) {
        throw new Error('Invalid frame header');
    }
    const expectedLength = buffer[1];
    if (expectedLength + 3 !== buffer.length) {
        throw new Error('Length mismatch in frame');
    }
    const checksum = buffer[buffer.length - 1];
    const calculated = calculateChecksum(buffer.slice(1, buffer.length - 1));
    if (checksum !== calculated) {
        throw new Error('Checksum mismatch');
    }
    const command = buffer[2];
    const payload = buffer.slice(3, buffer.length - 1);
    return { command, payload };
}

function parseJsonPayload(payload) {
    const text = payload.toString('utf8').trim();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end >= start) {
        return JSON.parse(text.slice(start, end + 1));
    }
    if (!text) return {};
    throw new Error('Unexpected payload format');
}

function buildStatusRequest(sequence = 0) {
    const payload = Buffer.from([sequence & 0xFF]);
    return composeCommand(COMMANDS.STATUS, payload);
}

function parseStatusResponse(payload) {
    try {
        const data = parseJsonPayload(payload);
        if (data && typeof data === 'object') return data;
    } catch (error) {
        throw new Error(`Failed to parse status response: ${error.message}`);
    }
    return {};
}

function buildDeviceInfoRequest() {
    return composeCommand(COMMANDS.DEVICE_INFO);
}

function parseDeviceInfoResponse(payload) {
    try {
        const data = parseJsonPayload(payload);
        if (data && typeof data === 'object') return data;
    } catch (error) {
        throw new Error(`Failed to parse device info response: ${error.message}`);
    }
    return {};
}

module.exports = {
    COMMANDS,
    buildStatusRequest,
    buildDeviceInfoRequest,
    composeCommand,
    parseFrame,
    parseStatusResponse,
    parseDeviceInfoResponse,
};
