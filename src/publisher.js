const logger = require('./logger');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const client = new SNSClient({ region: process.env.AWS_REGION });

const notifyLongDistance = async (left, right) => {
  const publish = new PublishCommand({
    TopicArn: process.env.ALARM_TOPIC_ARN,
    Message: JSON.stringify({ location: { left, right } }),
    MessageAttributes: {
      type: {
        DataType: 'String',
        StringValue: 'lazy_walker'
      }
    }
  });

  return client.send(publish)
    .then(res => logger.info(
      'Long distance detected - notification sent', { msgId: res.MessageId }
    ))
    .catch(e => logger.error(e, 'Failed to publish to SNS topic'));
};

module.exports = { notifyLongDistance };
