import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyHandler } from 'aws-lambda';
import * as AWS from 'aws-sdk';
import createHttpError from 'http-errors';

import { initDatabase } from '../../db/db';
import { Content } from '../../db/models/content';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { getProjectUser } from '../../utils/get-project-user';
import { getUserEmail } from '../../utils/get-user-email';

const s3 = new AWS.S3();

const deleteHandler: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;
  await initDatabase();

  try {
    const projectId = event.pathParameters.projectId;
    const userEmail = getUserEmail(event);
    const projectUser = await getProjectUser(projectId, userEmail);

    const item = await Content.findOne({
      _id: event.pathParameters.id,
      projectId,
    });

    if (!item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'text/plain' },
        body: "Couldn't find the item to delete",
      };
    }

    if (projectUser.role === 'SelectedTagsOnly') {
      const tagPermissions = projectUser.tagPermissions.filter(
        (permission) =>
          item.tags.find((tagId) => tagId === permission.tagId) !== undefined,
      );
      const canDelete =
        tagPermissions.find((permission) => permission.canDelete) !== undefined;

      if (!canDelete) {
        throw createHttpError(401, `User can't delete this content`);
      }
    }

    await Content.deleteOne({
      _id: event.pathParameters.id,
      projectId,
    });

    try {
      await s3
        .deleteObjects({
          Bucket: process.env.S3_BUCKET,
          Delete: {
            Objects: [
              {
                Key: item.s3ContentId,
              },
              ...item.thumbnails.map((t) => ({ Key: t.key })),
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
