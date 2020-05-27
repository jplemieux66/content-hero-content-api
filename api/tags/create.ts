import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyHandler } from 'aws-lambda';

import { initDatabase } from '../../db/db';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { getUserEmail } from '../../utils/get-user-email';
import { Tag } from './model/tag';

initDatabase();

const create: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;

  const body = event.body as any;
  const userEmail = getUserEmail(event);

  try {
    const existingItem = await Tag.findOne({ name: body.name, userEmail });

    if (existingItem) {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'text/plain' },
        body: 'There is already a tag with this name',
      };
    }

    const item = await new Tag({
      ...body,
      userEmail,
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
