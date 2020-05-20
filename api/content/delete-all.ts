import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { DeleteItemInput } from 'aws-sdk/clients/dynamodb';

import { AuthMiddleware } from '../../utils/auth-middleware';
import { listContentForEmail } from './utils/dynamodb/list-content-for-email';
import { getUserEmail } from '../../utils/get-user-email';

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const deleteAllHandler: APIGatewayProxyHandler = async (event, _context) => {
  try {
    const userEmail = getUserEmail(event);
    const content = await listContentForEmail(userEmail);

    const s3KeysToDelete: { Key: string }[] = [];
    const dynamoIdsToDelete = [];

    content.map((item) => {
      s3KeysToDelete.push({
        Key: item.s3ContentPath as string,
      });
      s3KeysToDelete.push({
        Key: item.s3ThumbnailPath as string,
      });
      dynamoIdsToDelete.push(item.id);
    });

    try {
      await s3
        .deleteObjects({
          Bucket: process.env.S3_BUCKET,
          Delete: {
            Objects: s3KeysToDelete,
          },
        })
        .promise();
    } catch (e) {
      console.error(`Couldn't delete some or all S3 Objects`);
    }

    await Promise.all(
      dynamoIdsToDelete.map((id) => {
        const params: DeleteItemInput = {
          TableName: process.env.CONTENT_DYNAMODB_TABLE,
          Key: { id },
        };

        return dynamoDb.delete(params).promise();
      }),
    );
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

export const handler = middy(deleteAllHandler)
  .use(jsonBodyParser())
  .use(httpErrorHandler())
  .use(new AuthMiddleware())
  .use(cors());
