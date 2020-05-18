import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import validator from '@middy/validator';
import { APIGatewayProxyHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { PutItemInput } from 'aws-sdk/clients/dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { inputSchema } from './input-schema';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const create: APIGatewayProxyHandler = async (event, _context) => {
  const timestamp = new Date().getTime();
  const body = event.body as any;

  const params: PutItemInput = {
    TableName: process.env.CONTENT_DYNAMODB_TABLE,
    Item: {
      id: uuidv4(),
      createdAt: timestamp,
      updatedAt: timestamp,
      ...body,
    },
  };

  try {
    await dynamoDb.put(params).promise();
  } catch (e) {
    console.error(e);
    return {
      statusCode: e.statusCode || 501,
      headers: { 'Content-Type': 'text/plain' },
      body: "Couldn't create the item.",
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(params.Item),
  };
};

export const handler = middy(create)
  .use(jsonBodyParser())
  .use(validator({ inputSchema }))
  .use(httpErrorHandler())
  .use(cors());
