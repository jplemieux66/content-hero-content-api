import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';

import { initDatabase } from '../db/db';
import { AuthMiddleware } from '../utils/auth-middleware';
import { getUserEmail } from '../utils/get-user-email';
import { Content } from '../db/models/content';
import { Tag } from '../db/models/tag';

const s3 = new AWS.S3();

const deleteAllHandler: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;
  await initDatabase();

  try {
    const userEmail = getUserEmail(event);
    const content = await Content.find({
      userEmail,
    });

    const s3KeysToDelete: { Key: string }[] = [];

    content.map((item) => {
      s3KeysToDelete.push({
        Key: item.s3ContentId,
      });
      item.thumbnails.map((t) => {
        s3KeysToDelete.push({
          Key: t.key,
        });
      });
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

    await Content.deleteMany({ userEmail });
    await Tag.deleteMany({ userEmail });

    return {
      statusCode: 200,
      body: JSON.stringify({}),
    };
  } catch (e) {
    console.error(e);
    return {
      statusCode: e.statusCode || 501,
      headers: { 'Content-Type': 'text/plain' },
      body: "Couldn't delete the item.",
    };
  }
};

export const handler = middy(deleteAllHandler)
  .use(jsonBodyParser())
  .use(httpErrorHandler())
  .use(new AuthMiddleware())
  .use(cors());
