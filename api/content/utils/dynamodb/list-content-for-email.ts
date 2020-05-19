import * as AWS from 'aws-sdk';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const listContentForEmail = async (
  email: string,
): Promise<AWS.DynamoDB.ItemList> => {
  const params: AWS.DynamoDB.QueryInput = {
    TableName: process.env.CONTENT_DYNAMODB_TABLE,
    IndexName: 'userEmailIndex',
    ExpressionAttributeValues: {
      ':userEmail': email as AWS.DynamoDB.AttributeValue,
    },
    KeyConditionExpression: 'userEmail = :userEmail',
  };

  const result = await dynamoDb.query(params).promise();

  return result.Items;
};
