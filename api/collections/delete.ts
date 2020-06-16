import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyHandler } from 'aws-lambda';

import { initDatabase } from '../../db/db';
import { Collection } from '../../db/models/collection';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { getUserEmail } from '../../utils/get-user-email';
import { CollectionUser } from '../../db/models/collection-user';
import { getCollectionUser } from '../../utils/get-collection-user';
import { Content } from '../../db/models/content';
import { Tag } from '../../db/models/tag';
import createHttpError from 'http-errors';

initDatabase();

const deleteHandler: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;
  const collectionId = event.pathParameters.collectionId;

  try {
    const userEmail = getUserEmail(event);
    const collectionUser = await getCollectionUser(collectionId, userEmail);

    if (collectionUser.role !== 'Admin') {
      throw createHttpError(401, `User Role doesn't allow Collection deletion`);
    }

    await Promise.all([
      Collection.deleteOne({
        _id: collectionId,
      }),
      CollectionUser.deleteMany({
        collectionId,
      }),
      Content.deleteMany({
        collectionId,
      }),
      Tag.deleteMany({
        collectionId,
      }),
    ]);
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
