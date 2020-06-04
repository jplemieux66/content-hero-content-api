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

initDatabase();

const create: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;

  const body = event.body as any;
  const userEmail = getUserEmail(event);

  try {
    const collection = await new Collection({
      ...body,
    });
    await collection.save();

    const collectionUser = await new CollectionUser({
      collectionId: collection._id,
      userEmail,
    });
    collectionUser.save();

    return {
      statusCode: 200,
      body: JSON.stringify(collection),
    };
  } catch (e) {
    console.error(e.message || e);
    return {
      statusCode: e.statusCode || 501,
      headers: { 'Content-Type': 'text/plain' },
      body: e.message || "Couldn't create the item.",
    };
  }
};

export const handler = middy(create)
  .use(jsonBodyParser())
  .use(httpErrorHandler())
  .use(new AuthMiddleware())
  .use(cors());
