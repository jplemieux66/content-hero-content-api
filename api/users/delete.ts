import '../projects/node_modules/source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import { APIGatewayProxyHandler } from 'aws-lambda';
import createHttpError from 'http-errors';

import { initDatabase } from '../../db/db';
import { ProjectUser } from '../../db/models/project-user';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { getProjectUser } from '../../utils/get-project-user';
import { getUserEmail } from '../../utils/get-user-email';

initDatabase();

const removeUserHandler: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;
  const projectId = event.pathParameters.projectId;
  const id = event.pathParameters.id;

  try {
    const requestUserEmail = getUserEmail(event);

    const projectUser = await getProjectUser(projectId, requestUserEmail);

    if (projectUser.role !== 'Admin') {
      throw createHttpError(401, `User Role doesn't allow user deletion`);
    }

    const item = await ProjectUser.findByIdAndDelete(id);

    if (!item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'text/plain' },
        body: "Couldn't find the user in this project.",
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({}),
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

export const handler = middy(removeUserHandler)
  .use(httpErrorHandler())
  .use(new AuthMiddleware())
  .use(cors());
