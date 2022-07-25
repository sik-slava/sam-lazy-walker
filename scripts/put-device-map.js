const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const VEHICLE_FMT = 'VV:AA:AA:AA:0{0}';
const HANDHELD_FMT = 'HH:BB:BB:BB:0{0}';

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

const populate = async () => {
  const promises = Array(9).fill(0).map(async (_, i) => {
    const handheldMac = HANDHELD_FMT.replace('{0}', i + 1);
    const put = new PutCommand({
      TableName: 'lazy-walker-data',
      ReturnValues: 'NONE',
      Item: {
        pk: `vehicle#${VEHICLE_FMT.replace('{0}', i + 1)}`,
        sk: `handheld#${handheldMac}`,
        device_id: handheldMac,
      }
    });
    return client.send(put);
  });

  await Promise.all(promises)
    .then(_ => console.log('Done inserting sample mapping between devices'));
};

// eslint-disable-next-line no-unused-vars
const fetchMap = async (v) => {
  const query = new QueryCommand({
    TableName: 'lazy-walker-data',
    KeyConditionExpression: '#pk = :pk and begins_with(#sk, :sk)',
    ExpressionAttributeNames: {
      '#pk': 'pk',
      '#sk': 'sk',
    },
    ExpressionAttributeValues: {
      ':pk': `vehicle#${v}`,
      ':sk': 'handheld'
    }
  });

  const res = await client.send(query);
  console.log(res);
};

populate();
// fetchMap('VV:AA:AA:AA:04');
