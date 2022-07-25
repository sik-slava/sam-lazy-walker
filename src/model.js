/* eslint-disable camelcase */
const DeviceType = Object.freeze({
  VEHICLE: 'vehicle',
  HANDHELD: 'handheld',
  of (raw) {
    if (!raw || typeof raw !== 'string' || !this[raw.toUpperCase()])
      throw new TypeError('Unable to parse device type');

    return this[raw.toUpperCase()];
  }
});

/**
 * @typedef {Object} DevicePayload
 * @property {('vehicle'|'handheld')} deviceType
 * @property {String} deviceId
 * @property {Date} timestamp

 * @property {Number} lat
 * @property {Number} lon
 *
 * @property {Object} coordinates
 * @property {Number} coordinates.lat
 * @property {Number} coordinates.lon
 */

/** @returns {DevicePayload} */
const parseRawPayload = ({
  device_type,
  device_id,
  timestamp_ms,
  latitude,
  longitude
}) => ({
  deviceType: DeviceType.of(device_type),
  deviceId: device_id,
  timestamp: new Date(timestamp_ms),
  lat: latitude,
  lon: longitude,
});

module.exports = {
  DeviceType,
  parseRawPayload,
};
