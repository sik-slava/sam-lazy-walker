const logger = require('./logger');
const gps = require('./gps');
const dao = require('./dao');
const { DeviceType, parseRawPayload } = require('./model');

module.exports.handler = async (event, context) => {
  const log = logger.for({ payload: event });
  log.info('Received IOT payload');

  const payload = parseRawPayload(event);

  if (!(await dao.storeDeviceLocation(payload, log)).success)
    return;

  // logic is performed when vehicle announces its location
  if (payload.deviceType !== DeviceType.VEHICLE) {
    log.info('Short circuiting payload processing - it comes from handheld');
    return;
  }

  // get handheld by truck
  const { handheldId } = await dao.getHandheldByVehicle(payload.deviceId, log);
  if (!handheldId)
    return;

  // get latest reported position of handheld
  const handheldCoordinates = await dao.findLastReportedLocation(
    { deviceType: 'handheld', deviceId: handheldId }, log
  );

  const distance = gps.getDistanceBetween(
    payload,
    handheldCoordinates,
  );

  log.info('Done calculating distance between devices', { distance });

  if (distance >= 50) log.info('GOT IT - DISTANCE IS MORE THAN 50m');
};
