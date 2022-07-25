import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

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

const promises = Array(9).fill(0).map(async (_, i) => {
    const handheldMac = HANDHELD_FMT.replace('{0}', i + 1)
    const put = new PutCommand({
        TableName: TABLE_NAME,
        ReturnValues: 'NONE',
        Item: {
            pk: `vehicle#${VEHICLE_FMT.replace('{0}', i + 1)}`,
            sk: `handheld#${handheldMac}`,
            mac_address: handheldMac,
        }
    });
    return client.send(put);
})

await Promise.all(promises)
    .then(_ => console.log('Done inserting sample mapping between devices'));