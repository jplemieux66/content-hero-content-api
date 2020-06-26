import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyHandler } from 'aws-lambda';
import createHttpError from 'http-errors';

import { initDatabase } from '../../db/db';
import { Content } from '../../db/models/content';
import { Project } from '../../db/models/project';
import { ProjectUser } from '../../db/models/project-user';
import { Tag } from '../../db/models/tag';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { DbMiddleware } from '../../utils/db-middleware';
import { getProjectUser } from '../../utils/get-project-user';
import { getUserEmail } from '../../utils/get-user-email';

const deleteHandler: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;
  const projectId = event.pathParameters.projectId;

  try {
    const userEmail = getUserEmail(event);
    const projectUser = await getProjectUser(projectId, userEmail);

    if (projectUser.role !== 'Admin') {
      throw createHttpError(401, `User Role doesn't allow Project deletion`);
    }

    await Promise.all([
      Project.deleteOne({
        _id: projectId,
      }),
      ProjectUser.deleteMany({
        projectId,
      }),
      Content.deleteMany({
        projectId,
      }),
      Tag.deleteMany({
        projectId,
      }),
    ]);
  } catch (e) {
    console.error(e);
    return {
      statusCode: e.statusCode || 501,
      headers: { 'Content-Type': 'text/plain' },
      body: e.message || "Couldn't delete the item.",
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({}),
  };
};

export const handler = middy(deleteHandler)
  .use(jsonBodyParser())
  .use(httpErrorHandler())
  .use(new AuthMiddleware())
  .use(new DbMiddleware())
  .use(cors());
