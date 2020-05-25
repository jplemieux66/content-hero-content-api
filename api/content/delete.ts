import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';

import { initDatabase } from '../../db/db';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { getUserEmail } from '../../utils/get-user-email';
import { Content } from './model/content';

initDatabase();
const s3 = new AWS.S3();

const deleteHandler: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;

  try {
    const userEmail = getUserEmail(event);
    const item = await Content.findOneAndDelete(
      {
        _id: event.pathParameters.id,
        userEmail,
      },
      event.body as any,
    );

    if (!item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'text/plain' },
        body: "Couldn't find the item to delete",
      };
    }

    try {
      await s3
        .deleteObjects({
          Bucket: process.env.S3_BUCKET,
          Delete: {
            Objects: [
              {
                Key: (item as any).s3ContentId,
              },
              (item as any).thumbnails.map((t) => ({ Key: t.key })),
            ],
          },
        })
        .promise();
    } catch (e) {
      console.error(`Couldn't delete some or all S3 Objects`);
    }
  } catch (e) {
    console.error(e);
    return {
      statusCode: e.statusCode || 501,
      headers: { 'Content-Type': 'text/plain' },
      body: e.message || "Couldn't delete the item.",
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
