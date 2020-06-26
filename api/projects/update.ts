import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyHandler } from 'aws-lambda';
import createHttpError from 'http-errors';

import { initDatabase } from '../../db/db';
import { Project } from '../../db/models/project';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { getProjectUser } from '../../utils/get-project-user';
import { getUserEmail } from '../../utils/get-user-email';

const update: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;
  await initDatabase();

  const projectId = event.pathParameters.projectId;

  try {
    const body = event.body as any;
    const userEmail = getUserEmail(event);
    const projectUser = await getProjectUser(projectId, userEmail);

    if (projectUser.role !== 'Admin') {
      throw createHttpError(401, `User Role doesn't allow Project updates`);
    }

    await Project.updateOne(
      {
        _id: projectId,
      },
      body,
    );

    const newProject = await Project.findById(projectId);

    return {
      statusCode: 200,
      body: JSON.stringify(newProject),
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
