import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import validator from '@middy/validator';
import { APIGatewayProxyHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { UpdateItemInput, UpdateItemOutput } from 'aws-sdk/clients/dynamodb';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const update: APIGatewayProxyHandler = async (event, _context) => {
  const timestamp = new Date().getTime();
  const body = event.body as any;

  const params: UpdateItemInput = {
    TableName: process.env.CONTENT_DYNAMODB_TABLE,
    Key: {
      id: event.pathParameters.id,
    } as any,
    ExpressionAttributeValues: {
      ':fileName': body.fileName,
      ':fileType': body.fileType,
      ':s3ContentId': body.s3ContentId,
      ':userEmail': body.userEmail,
      ':updatedAt': timestamp as any,
    },
    UpdateExpression:
      'SET fileName = :fileName, fileType = :fileType, s3ContentId = :s3ContentId, userEmail = :userEmail, updatedAt = :updatedAt',
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

const inputSchema = {
  type: 'object',
  properties: {
    body: {
      type: 'object',
      properties: {
        fileName: {
          type: 'string',
        },
        fileType: {
          type: 'string',
        },
        s3ContentId: {
          type: 'string',
        },
        userEmail: {
          type: 'string',
        },
      },
    },
  },
};

export const handler = middy(update)
  .use(jsonBodyParser())
  .use(validator({ inputSchema }))
  .use(httpErrorHandler())
  .use(cors());
