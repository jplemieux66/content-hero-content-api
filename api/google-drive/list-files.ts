import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { google } from 'googleapis';

import { initDatabase } from '../../db/db';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { GoogleAuthMiddleware } from '../../utils/google-auth-middleware';

initDatabase();

const listFiles: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;

  try {
    const drive = google.drive({
      version: 'v3',
      auth: (event as any).googleOAuth2Client,
    });
    const files = await drive.files.list({ pageSize: 10 });

    return {
      statusCode: 200,
      body: JSON.stringify(files.data.files),
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

export const handler = middy(listFiles)
  .use(jsonBodyParser())
  .use(httpErrorHandler())
  .use(new AuthMiddleware())
  .use(new GoogleAuthMiddleware())
  .use(cors());
