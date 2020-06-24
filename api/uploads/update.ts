import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyHandler } from 'aws-lambda';

import { initDatabase } from '../../db/db';
import { FileUpload } from '../../db/models/file-upload';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { getProjectUser } from '../../utils/get-project-user';
import { getUserEmail } from '../../utils/get-user-email';

initDatabase();

const update: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;

  try {
    const body = event.body as any;
    const projectId = event.pathParameters.projectId;
    const userEmail = getUserEmail(event);
    await getProjectUser(projectId, userEmail);

    let item = await FileUpload.findOneAndUpdate(
      {
        id: event.pathParameters.id,
        projectId,
        userEmail,
      },
      body,
    );

    if (!item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'text/plain' },
        body: "Couldn't find the item to update",
      };
    }

    item = await FileUpload.findById(item._id);

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
