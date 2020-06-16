import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyHandler } from 'aws-lambda';

import { initDatabase } from '../../db/db';
import { CollectionUser } from '../../db/models/collection-user';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { getUserEmail } from '../../utils/get-user-email';
import { getCollectionUser } from '../../utils/get-collection-user';
import createHttpError from 'http-errors';

initDatabase();

const updateUserHandler: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;
  const collectionId = event.pathParameters.collectionId;
  const id = event.pathParameters.id;

  try {
    const body = event.body as any;
    const requestUserEmail = getUserEmail(event);
    const requestCollectionUser = await getCollectionUser(
      collectionId,
      requestUserEmail,
    );

    if (requestCollectionUser.role !== 'Admin') {
      throw createHttpError(401, `User Role doesn't allow user deletion`);
    }

    await CollectionUser.updateOne(
      {
        _id: id,
      },
      body,
    );

    const collectionUser = await CollectionUser.findById(id);

    if (!collectionUser) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'text/plain' },
        body: 'User not found',
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(collectionUser),
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

export const handler = middy(updateUserHandler)
  .use(jsonBodyParser())
  .use(httpErrorHandler())
  .use(new AuthMiddleware())
  .use(cors());
