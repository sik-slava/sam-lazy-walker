import logger from './logger';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
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
export async function handler(event, context) {
  const log = logger.for(context);
  log.info('Received IOT message', { event });

  const cmd = new PutCommand({
    TableName: TABLE_NAME,
    ReturnValues: 'NONE',
    Item: {
      pk: `${event.device_type}#${event.device_id}`,
      sk: `at#${event.timestamp_at}`,
      item_type: `gpc#${event.device_type}`,
      payload: {
        lat: event.latitude,
        lon: event.longitude
      }
    }
  });

  await client.send(cmd)
    .then(res => log.info('Payload has been stored into db', res.$metadata))
    .catch(e => log.error(e, 'Failed to store event payload in db - eating it'));
}
