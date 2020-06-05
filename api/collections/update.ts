import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyHandler } from 'aws-lambda';

import { initDatabase } from '../../db/db';
import { Collection } from '../../db/models/collection';
import { CollectionUser } from '../../db/models/collection-user';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { getUserEmail } from '../../utils/get-user-email';
import { verifyCollection } from '../../utils/verify-collection';

initDatabase();

const update: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;
  const collectionId = event.pathParameters.collectionId;

  try {
    const body = event.body as any;
    const userEmail = getUserEmail(event);

    await verifyCollection(collectionId, userEmail);

    await Collection.updateOne(
      {
        _id: collectionId,
      },
      body,
    );

    const newCollection = await Collection.findById(collectionId);
    const collectionUsers = await CollectionUser.find({
      collectionId: collectionId,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        ...newCollection,
        userEmails: collectionUsers.map((u) => u.userEmail),
      }),
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
