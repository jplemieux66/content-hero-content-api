import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import { APIGatewayProxyHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { ScanInput, ScanOutput } from 'aws-sdk/clients/dynamodb';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const list: APIGatewayProxyHandler = async (event, _context) => {
  const params: ScanInput = {
    TableName: process.env.CONTENT_DYNAMODB_TABLE,
  };

  let result: ScanOutput;
  try {
    result = await dynamoDb.scan(params).promise();
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
    body: JSON.stringify(result.Items),
  };
};

export const handler = middy(list).use(httpErrorHandler()).use(cors());
