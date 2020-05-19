import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import { APIGatewayProxyHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { QueryInput, ScanOutput } from 'aws-sdk/clients/dynamodb';

import { AuthMiddleware } from '../../utils/auth-middleware';
import { getUserEmail } from '../../utils/get-user-email';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const list: APIGatewayProxyHandler = async (event, _context) => {
  const userEmail = getUserEmail(event);

  const params: QueryInput = {
    TableName: process.env.CONTENT_DYNAMODB_TABLE,
    IndexName: 'userEmailIndex',
    ExpressionAttributeValues: {
      ':userEmail': userEmail,
    },
    KeyConditionExpression: 'userEmail = :userEmail',
  };

  let result: ScanOutput;
  try {
    result = await dynamoDb.query(params).promise();
  } catch (e) {
    console.error(e);
    return {
      statusCode: e.statusCode || 501,
      headers: { 'Content-Type': 'text/plain' },
      body: "Couldn't list the items.",
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(result.Items),
  };
};

export const handler = middy(list)
  .use(httpErrorHandler())
  .use(new AuthMiddleware())
  .use(cors());
