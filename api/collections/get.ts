import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import { APIGatewayProxyHandler } from 'aws-lambda';

import { initDatabase } from '../../db/db';
import { Collection } from '../../db/models/collection';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { getUserEmail } from '../../utils/get-user-email';
import { getCollectionUser } from '../../utils/get-collection-user';

initDatabase();

const getHandler: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;
  const collectionId = event.pathParameters.collectionId;

  try {
    const userEmail = getUserEmail(event);
    await getCollectionUser(collectionId, userEmail);

    const collection = await Collection.findById(collectionId);

    return {
      statusCode: 200,
      body: JSON.stringify(collection),
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
