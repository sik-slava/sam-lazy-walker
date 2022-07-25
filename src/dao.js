const logger = require('./logger');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

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

/** @param {import('./model').DevicePayload} payload */
const storeDeviceLocation = async (payload, log = null) => {
  log ??= logger;
  const put = new PutCommand({
    TableName: TABLE_NAME,
    ReturnValues: 'NONE',
    Item: {
      pk: `${payload.deviceType}#${payload.deviceId}`,
      sk: `at#${payload.timestamp.getTime()}`,
      item_type: `gps#${payload.deviceType}`,
      coordinates: {
        lat: payload.lat,
        lon: payload.lon
      }
    }
  });

  return client.send(put)
    .then(res => {
      log.info('Done storing device location payload', { meta: res.$metadata });
      return { success: true };
    })
    .catch(e => {
      log.error(e, 'Failed to store device location payload');
      return { success: false };
    });
};

const getHandheldByVehicle = async (truckId, log = null) => {
  log ??= logger;
  const query = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: '#pk = :pk and begins_with(#sk, :sk)',
    ExpressionAttributeNames: {
      '#pk': 'pk',
      '#sk': 'sk',
    },
    ExpressionAttributeValues: {
      ':pk': `vehicle#${truckId}`,
      ':sk': 'handheld#'
    }
  });

  return client.send(query)
    .then(({ Items }) => {
      if (!Items?.length)
        throw new Error(`No handheld found by vehicle ${truckId}`);

      if (Items.length > 1)
        throw new Error('Unsupported - truck is linked to multiple handhelds');

      return { handheldId: Items[0].device_id };
    })
    .catch(e => {
      log.error(e, 'Failed to get handheld by vehicle');
      throw e;
    });
};

const findLastReportedLocation = async ({ deviceType, deviceId }, log = null) => {
  log ??= logger;
  const query = new QueryCommand({
    TableName: TABLE_NAME,
    ScanIndexForward: false,
    Limit: 1,
    KeyConditionExpression: '#pk = :pk and begins_with(#sk, :sk)',
    ExpressionAttributeNames: {
      '#pk': 'pk',
      '#sk': 'sk',
    },
    ExpressionAttributeValues: {
      ':pk': `${deviceType}#${deviceId}`,
      ':sk': 'at#'
    }
  });
  return client.send(query)
    .then(({ Items }) => {
      if (!Items?.length) {
        log.warn('Last reported location is not found', { deviceType, deviceId });
        return { success: false };
      }
      return {
        success: true,
        lat: Items[0].coordinates.lat,
        lon: Items[0].coordinates.lat,
      };
    })
    .catch(e => {
      log.error(e, 'Failed to get last reported location');
      return { success: false };
    });
};

module.exports = {
  storeDeviceLocation,
  getHandheldByVehicle,
  findLastReportedLocation,
};
