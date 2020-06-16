import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyHandler } from 'aws-lambda';

import { initDatabase } from '../../db/db';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { getUserEmail } from '../../utils/get-user-email';
import { Content } from '../../db/models/content';
import { getCollectionUser } from '../../utils/get-collection-user';
import createHttpError from 'http-errors';

initDatabase();

const create: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;

  try {
    const body = event.body as any;
    const collectionId = event.pathParameters.collectionId;
    const userEmail = getUserEmail(event);
    const collectionUser = await getCollectionUser(collectionId, userEmail);

    if (collectionUser.role !== 'Admin' && collectionUser.role !== 'Standard') {
      throw createHttpError(401, `User Role doesn't allow Content creation`);
    }

    const item = await new Content({
      ...body,
      collectionId,
    });
    await item.save();
    return {
      statusCode: 200,
      body: JSON.stringify(item),
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
