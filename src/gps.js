const EARTH_RADIUS_METERS = 6371e3;

/**
 * @typedef {Object} GpsCoordinates
 * @property {Number} lat
 * @property {Number} lon
 */

/**
 *
 * @param {GpsCoordinates} left
 * @param {GpsCoordinates} right
 */
const getDistanceBetween = (left, right) => {
  const lat1 = left.lat * Math.PI / 180;
  const lat2 = right.lat * Math.PI / 180;
  const delta = {
    lat: (right.lat - left.lat) * Math.PI / 180,
    lon: right.lon - left.lon * Math.PI / 180
  };

  const a =
        Math.sin(delta.lat / 2) * Math.sin(delta.lat / 2) +
        Math.sin(delta.lon / 2) * Math.sin(delta.lon / 2) *
        Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
};

module.exports = { getDistanceBetween };
