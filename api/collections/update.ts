import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyHandler } from 'aws-lambda';
import createHttpError from 'http-errors';

import { initDatabase } from '../../db/db';
import { Collection } from '../../db/models/collection';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { getCollectionUser } from '../../utils/get-collection-user';
import { getUserEmail } from '../../utils/get-user-email';

initDatabase();

const update: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;
  const collectionId = event.pathParameters.collectionId;

  try {
    const body = event.body as any;
    const userEmail = getUserEmail(event);
    const collectionUser = await getCollectionUser(collectionId, userEmail);

    if (collectionUser.role !== 'Admin') {
      throw createHttpError(401, `User Role doesn't allow Collection updates`);
    }

    await Collection.updateOne(
      {
        _id: collectionId,
      },
      body,
    );

    const newCollection = await Collection.findById(collectionId);

    return {
      statusCode: 200,
      body: JSON.stringify(newCollection),
    };
  } catch (e) {
    console.error(e);
    return {
      statusCode: e.statusCode || 501,
      headers: { 'Content-Type': 'text/plain' },
      body: "Couldn't update the item.",
    };
  }
};

export const handler = middy(update)
  .use(jsonBodyParser())
  .use(httpErrorHandler())
  .use(new AuthMiddleware())
  .use(cors());
