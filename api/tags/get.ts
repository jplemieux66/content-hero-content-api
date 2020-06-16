import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import { APIGatewayProxyHandler } from 'aws-lambda';

import { initDatabase } from '../../db/db';
import { Tag } from '../../db/models/tag';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { getUserEmail } from '../../utils/get-user-email';
import { getCollectionUser } from '../../utils/get-collection-user';
import createHttpError from 'http-errors';

initDatabase();

const getHandler: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;

  try {
    const collectionId = event.pathParameters.collectionId;
    const userEmail = getUserEmail(event);
    const collectionUser = await getCollectionUser(collectionId, userEmail);

    if (collectionUser.role === 'SelectedTagsOnly') {
      const isAllowed =
        collectionUser.tagPermissions.find(
          (p) => p.tagId === event.pathParameters.id,
        ) !== undefined;
      if (!isAllowed) {
        throw createHttpError(401, `Unauthorized`);
      }
    }

    const tag = await Tag.findOne({
      _id: event.pathParameters.id,
      collectionId,
    });
    if (!tag) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'text/plain' },
        body: "Couldn't find the item",
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify(tag),
    };
  } catch (e) {
    console.error(e);
    return {
      statusCode: e.statusCode || 501,
      headers: { 'Content-Type': 'text/plain' },
      body: e.message || "Couldn't update the item.",
    };
  }
};

export const handler = middy(getHandler)
  .use(httpErrorHandler())
  .use(new AuthMiddleware())
  .use(cors());
