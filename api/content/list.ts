import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import { APIGatewayProxyHandler } from 'aws-lambda';

import { initDatabase } from '../../db/db';
import { Content } from '../../db/models/content';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { getUserEmail } from '../../utils/get-user-email';
import { getCollectionUser } from '../../utils/get-collection-user';
import createHttpError from 'http-errors';

initDatabase();

const list: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;

  try {
    const collectionId = event.pathParameters.collectionId;
    const userEmail = getUserEmail(event);
    const collectionUser = await getCollectionUser(collectionId, userEmail);

    let content;
    if (collectionUser.role === 'SelectedTagsOnly') {
      const allowedTagsId = collectionUser.tagPermissions.map((p) => p.tagId);
      content = await Content.find({
        collectionId,
        tags: {
          $in: allowedTagsId,
        },
      });
    } else {
      content = await Content.find({
        collectionId,
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify(content),
    };
  } catch (e) {
    console.error(e);
    return {
      statusCode: e.statusCode || 501,
      headers: { 'Content-Type': 'text/plain' },
      body: e.message || "Couldn't list the items.",
    };
  }
};

export const handler = middy(list)
  .use(httpErrorHandler())
  .use(new AuthMiddleware())
  .use(cors());
