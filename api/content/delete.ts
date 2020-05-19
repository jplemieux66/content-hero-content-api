import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { DeleteItemInput, GetItemInput } from 'aws-sdk/clients/dynamodb';

import { getUserEmail } from '../../utils/get-user-email';
import { AuthMiddleware } from '../../utils/auth-middleware';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const deleteHandler: APIGatewayProxyHandler = async (event, _context) => {
  try {
    const getParams: GetItemInput = {
      TableName: process.env.CONTENT_DYNAMODB_TABLE,
      Key: {
        id: event.pathParameters.id,
      } as any,
    };

    const res = await dynamoDb.get(getParams).promise();

    const userEmail = getUserEmail(event);
    if (res.Item.userEmail !== userEmail) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Unauthorized',
      };
    }

    const params: DeleteItemInput = {
      TableName: process.env.CONTENT_DYNAMODB_TABLE,
      Key: {
        id: event.pathParameters.id,
      } as any,
    };

    dynamoDb.delete(params).promise();
  } catch (e) {
    console.error(e);
    return {
      statusCode: e.statusCode || 501,
      headers: { 'Content-Type': 'text/plain' },
      body: "Couldn't delete the item.",
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({}),
  };
};

export const handler = middy(deleteHandler)
  .use(jsonBodyParser())
  .use(httpErrorHandler())
  .use(new AuthMiddleware())
  .use(cors());
