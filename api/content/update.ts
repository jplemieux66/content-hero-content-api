import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import validator from '@middy/validator';
import { APIGatewayProxyHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import {
  GetItemInput,
  UpdateItemInput,
  UpdateItemOutput,
} from 'aws-sdk/clients/dynamodb';

import { AuthMiddleware } from '../../utils/auth-middleware';
import { getUserEmail } from '../../utils/get-user-email';
import { inputSchema } from './input-schema';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const update: APIGatewayProxyHandler = async (event, _context) => {
  let result: UpdateItemOutput;

  try {
    // Verify the user is authorized to update the item
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

    // Parse Body Values
    const body = event.body as any;

    const expressionAttributeValues = {};
    const updateExpressionStatements = [];
    Object.keys(inputSchema.properties.body.properties).map((key) => {
      expressionAttributeValues[`:${key}`] = body[key];
      updateExpressionStatements.push(`${key} = :${key}`);
    });

    // Set Updated At
    expressionAttributeValues[`:updatedAt`] = new Date().getTime();
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
  .use(new AuthMiddleware())
  .use(cors());
