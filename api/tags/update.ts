import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyHandler } from 'aws-lambda';
import createHttpError from 'http-errors';

import { initDatabase } from '../../db/db';
import { Tag } from '../../db/models/tag';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { getCollectionUser } from '../../utils/get-collection-user';
import { getUserEmail } from '../../utils/get-user-email';

initDatabase();

const update: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;

  try {
    const body = event.body as any;
    const collectionId = event.pathParameters.collectionId;
    const userEmail = getUserEmail(event);
    const collectionUser = await getCollectionUser(collectionId, userEmail);

    if (collectionUser.role !== 'Admin' && collectionUser.role !== 'Standard') {
      throw createHttpError(401, `User Role doesn't allow tag editing`);
    }

    let item = await Tag.findOneAndUpdate(
      {
        _id: event.pathParameters.id,
        collectionId,
      },
      body,
    );

    if (!item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'text/plain' },
        body: "Couldn't find the item to delete",
      };
    }

    item = await Tag.findById(item._id);

    return {
      statusCode: 200,
      body: JSON.stringify(item),
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
