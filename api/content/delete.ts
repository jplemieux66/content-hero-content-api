import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { DeleteItemInput } from 'aws-sdk/clients/dynamodb';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const deleteHandler: APIGatewayProxyHandler = async (event, _context) => {
  const params: DeleteItemInput = {
    TableName: process.env.CONTENT_DYNAMODB_TABLE,
    Key: {
      id: event.pathParameters.id,
    } as any,
  };

  try {
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
  .use(cors());
