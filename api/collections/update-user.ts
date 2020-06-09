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
import { verifyCollection } from '../../utils/verify-collection';

initDatabase();

const updateUserHandler: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;
  const collectionId = event.pathParameters.collectionId;

  try {
    const requestUserEmail = getUserEmail(event);

    await verifyCollection(collectionId, requestUserEmail);

    const userEmail = event.queryStringParameters.userEmail;
    const { tags } = event.body as any;

    let collectionUser = await CollectionUser.findOneAndUpdate(
      {
        collectionId,
        userEmail,
      },
      {
        tags,
      },
    );

    if (!collectionUser) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'text/plain' },
        body: 'User not found',
      };
    }

    collectionUser = await CollectionUser.findById(collectionUser._id);

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
