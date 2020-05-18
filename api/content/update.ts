import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import validator from '@middy/validator';
import { APIGatewayProxyHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { UpdateItemInput, UpdateItemOutput } from 'aws-sdk/clients/dynamodb';
import { inputSchema } from './input-schema';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const update: APIGatewayProxyHandler = async (event, _context) => {
  const timestamp = new Date().getTime();

  // Parse Body Values
  const body = event.body as any;

  const expressionAttributeValues = {};
  const updateExpressionStatements = [];
  Object.keys(inputSchema.properties.body.properties).map((key) => {
    expressionAttributeValues[`:${key}`] = body[key];
    updateExpressionStatements.push(`${key} = :${key}`);
  });

  // Set Updated At
  expressionAttributeValues[`:updatedAt`] = timestamp;
  updateExpressionStatements.push(`updatedAt = :updatedAt`);

  // Prepare params for DynamoDb operation
  const params: UpdateItemInput = {
    TableName: process.env.CONTENT_DYNAMODB_TABLE,
    Key: {
      id: event.pathParameters.id,
    } as any,
    ExpressionAttributeValues: expressionAttributeValues,
    UpdateExpression: `SET ${updateExpressionStatements.join(', ')}`,
    ReturnValues: 'ALL_NEW',
  };

  let result: UpdateItemOutput;
  try {
    result = await dynamoDb.update(params).promise();
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
    body: JSON.stringify(result.Attributes),
  };
};

export const handler = middy(update)
  .use(jsonBodyParser())
  .use(validator({ inputSchema }))
  .use(httpErrorHandler())
  .use(cors());
