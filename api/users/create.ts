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

const addUserHandler: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;
  const collectionId = event.pathParameters.collectionId;

  try {
    const requestUserEmail = getUserEmail(event);
    const requestCollectionUser = await getCollectionUser(
      collectionId,
      requestUserEmail,
    );

    if (requestCollectionUser.role !== 'Admin') {
      throw createHttpError(401, `User Role doesn't allow user creation`);
    }

    const body = event.body as any;

    const existingCollectionUser = await CollectionUser.findOne({
      collectionId,
      userEmail: body.userEmail,
    });

    if (existingCollectionUser) {
      return {
        statusCode: 422,
        headers: { 'Content-Type': 'text/plain' },
        body: 'User already in collection',
      };
    }

    const collectionUser = new CollectionUser({
      collectionId,
      ...body,
    });
    await collectionUser.save();

    return {
      statusCode: 200,
      body: JSON.stringify(collectionUser),
    };
  } catch (e) {
    console.error(e);
    return {
      statusCode: e.statusCode || 501,
      headers: { 'Content-Type': 'text/plain' },
      body: e.message || "Couldn't create the item.",
    };
  }
};

export const handler = middy(addUserHandler)
  .use(jsonBodyParser())
  .use(httpErrorHandler())
  .use(new AuthMiddleware())
  .use(cors());
