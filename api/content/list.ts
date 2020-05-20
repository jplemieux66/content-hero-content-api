import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import { APIGatewayProxyHandler } from 'aws-lambda';

import { AuthMiddleware } from '../../utils/auth-middleware';
import { getUserEmail } from '../../utils/get-user-email';
import { listContentForEmail } from './utils/dynamodb/list-content-for-email';

const list: APIGatewayProxyHandler = async (event, _context) => {
  try {
    const userEmail = getUserEmail(event);
    const content = await listContentForEmail(userEmail);

    return {
      statusCode: 200,
      body: JSON.stringify(content),
    };
  } catch (e) {
    console.error(e);
    return {
      statusCode: e.statusCode || 501,
      headers: { 'Content-Type': 'text/plain' },
      body: "Couldn't list the items.",
    };
  }
};

export const handler = middy(list)
  .use(httpErrorHandler())
  .use(new AuthMiddleware())
  .use(cors());
