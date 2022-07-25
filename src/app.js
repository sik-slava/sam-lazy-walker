const logger = require('./logger');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const EARTH_RADIUS = 6371e3;
const TABLE_NAME = process.env.TABLE_NAME;

const _ = new DynamoDBClient({
  region: process.env.AWS_REGION,
});
const client = DynamoDBDocumentClient.from(_, {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: false,
    convertClassInstanceToMap: true
  }
});
const DeviceType = Object.freeze({
  VEHICLE: 'vehicle',
  HANDHELD: 'handheld'
});

/**
 * @typedef {Object} GpsCoordinates
 * @property {Number} latitude
 * @property {Number} longitude
 */

/**
 *
 * @param {GpsCoordinates} left
 * @param {GpsCoordinates} right
 */
const getDistanceBetween = (left, right) => {
  const lat1 = left.latitude * Math.PI / 180;
  const lat2 = right.latitude * Math.PI / 180;
  const delta = {
    lat: (right.latitude - left.latitude) * Math.PI / 180,
    lon: right.longitude - left.longitude * Math.PI / 180,
  };

  const a =
    Math.sin(delta.lat / 2) * Math.sin(delta.lat / 2) +
    Math.sin(delta.lon / 2) * Math.sin(delta.lon / 2) *
    Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS * c;
};

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
module.exports.handler = async (event, context) => {
  const log = logger.for(context);
  log.info('Received IOT message', { event });

  const put = new PutCommand({
    TableName: TABLE_NAME,
    ReturnValues: 'NONE',
    Item: {
      pk: `${event.device_type}#${event.device_id}`,
      sk: `at#${event.timestamp_ms}`,
      item_type: `gps#${event.device_type}`,
      payload: {
        latitude: event.latitude,
        longitude: event.longitude
      }
    }
  });

  await client.send(put)
    .then(res => log.info('Payload has been stored in db', res.$metadata))
    .catch(e => {
      log.error(e, 'Failed to store event payload in db');
      throw e;
    });

  // check is performed when vehicle announces its location
  if (event.device_type !== DeviceType.VEHICLE) { return }

  // get handheld by truck
  let query = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: '#pk = :pk and begins_with(#sk, :sk)',
    ExpressionAttributeNames: {
      '#pk': 'pk',
      '#sk': 'sk',
    },
    ExpressionAttributeValues: {
      ':pk': `${DeviceType.VEHICLE}#${event.device_id}`,
      ':sk': `${DeviceType.HANDHELD}#`
    }
  });

  const { Items, $metadata } = await client.send(query);
  if (Items?.length !== 1) {
    log.error(null, 'Invalid mapping between vehicle and handheld', $metadata);
    throw new Error('Unable to get device by truck');
  }

  // get latest reported position of handheld
  query = new QueryCommand({
    TableName: TABLE_NAME,
    ScanIndexForward: false,
    Limit: 1,
    KeyConditionExpression: '#pk = :pk and begins_with(#sk, :sk)',
    ExpressionAttributeNames: {
      '#pk': 'pk',
      '#sk': 'sk',
    },
    ExpressionAttributeValues: {
      ':pk': `${DeviceType.VEHICLE}#${Items[0].device_id}`,
      ':sk': 'at#'
    }
  });

  const payloadResponse = await client.send(query);
  log.info('Got response from payload query', payloadResponse.$metadata);

  if (!payloadResponse.Items?.length) {
    log.warn('No location data found handheld', { handheld: event.device_id });
    return;
  }

  const distance = getDistanceBetween(
    { latitude: event.latitude, longitude: event.latitude },
    payloadResponse.Items[0].payload
  );

  if (distance >= 50) { log.info('GOT IT - DISTANCE IS MORE THAN 50m') }
};
