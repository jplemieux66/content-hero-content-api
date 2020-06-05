import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyHandler } from 'aws-lambda';

import { initDatabase } from '../../db/db';
import { Tag } from '../../db/models/tag';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { getUserEmail } from '../../utils/get-user-email';
import { verifyCollection } from '../../utils/verify-collection';

initDatabase();

const create: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;

  try {
    const body = event.body as any;
    const collectionId = event.pathParameters.collectionId;
    const userEmail = getUserEmail(event);
    await verifyCollection(collectionId, userEmail);

    const existingItem = await Tag.findOne({ name: body.name, collectionId });

    if (existingItem) {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'text/plain' },
        body: 'There is already a tag with this name',
      };
    }

    const item = await new Tag({
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
