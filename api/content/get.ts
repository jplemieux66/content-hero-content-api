import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import { APIGatewayProxyHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { GetItemInput, GetItemOutput } from 'aws-sdk/clients/dynamodb';

import { AuthMiddleware } from '../../utils/auth-middleware';
import { getUserEmail } from '../../utils/get-user-email';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const getHandler: APIGatewayProxyHandler = async (event, _context) => {
  const params: GetItemInput = {
    TableName: process.env.CONTENT_DYNAMODB_TABLE,
    Key: {
      id: event.pathParameters.id,
    } as any,
  };

  let result: GetItemOutput;
  try {
    result = await dynamoDb.get(params).promise();

    const userEmail = getUserEmail(event);
    if (result.Item.userEmail !== userEmail) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Unauthorized',
      };
    }
  } catch (e) {
    console.error(e);
    return {
      statusCode: e.statusCode || 501,
      headers: { 'Content-Type': 'text/plain' },
      body: "Couldn't update the item.",
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(result.Item),
  };
};

export const handler = middy(getHandler)
  .use(httpErrorHandler())
  .use(new AuthMiddleware())
  .use(cors());
