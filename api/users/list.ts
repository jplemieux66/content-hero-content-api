import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import { APIGatewayProxyHandler } from 'aws-lambda';

import { initDatabase } from '../../db/db';
import { ProjectUser } from '../../db/models/project-user';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { DbMiddleware } from '../../utils/db-middleware';
import { getProjectUser } from '../../utils/get-project-user';
import { getUserEmail } from '../../utils/get-user-email';

const list: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;
  try {
    const projectId = event.pathParameters.projectId;
    const userEmail = getUserEmail(event);
    await getProjectUser(projectId, userEmail);

    const projectUsers = await ProjectUser.find({
      projectId: projectId,
    });

    return {
      statusCode: 200,
      body: JSON.stringify(projectUsers),
    };
  } catch (e) {
    console.error(e);
    return {
      statusCode: e.statusCode || 501,
      headers: { 'Content-Type': 'text/plain' },
      body: e.message || "Couldn't list the items.",
    };
  }
};

export const handler = middy(list)
  .use(httpErrorHandler())
  .use(new AuthMiddleware())
  .use(new DbMiddleware())
  .use(cors());
