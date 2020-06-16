import '../projects/node_modules/source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyHandler } from 'aws-lambda';

import { initDatabase } from '../../db/db';
import { ProjectUser } from '../../db/models/project-user';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { getUserEmail } from '../../utils/get-user-email';
import { getProjectUser } from '../../utils/get-project-user';
import createHttpError from 'http-errors';
import { sendInvitationEmail } from '../../utils/send-invitation-email';
import { Project } from '../../db/models/project';

initDatabase();

const addUserHandler: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;
  const projectId = event.pathParameters.projectId;

  try {
    const requestUserEmail = getUserEmail(event);
    const requestProjectUser = await getProjectUser(
      projectId,
      requestUserEmail,
    );

    if (requestProjectUser.role !== 'Admin') {
      throw createHttpError(401, `User Role doesn't allow user creation`);
    }

    const body = event.body as any;

    const existingProjectUser = await ProjectUser.findOne({
      projectId,
      userEmail: body.userEmail,
    });

    if (existingProjectUser) {
      return {
        statusCode: 422,
        headers: { 'Content-Type': 'text/plain' },
        body: 'User already in project',
      };
    }

    const projectUser = new ProjectUser({
      projectId,
      ...body,
    });
    await projectUser.save();

    const project = await Project.findById(projectId);

    await sendInvitationEmail(project.name, requestUserEmail);

    return {
      statusCode: 200,
      body: JSON.stringify(projectUser),
    };
  } catch (e) {
    console.error(e);
    return {
      statusCode: e.statusCode || 501,
      headers: { 'Content-Type': 'text/plain' },
      body: e.message || "Couldn't create the item.",
    };
  }
};

export const handler = middy(addUserHandler)
  .use(jsonBodyParser())
  .use(httpErrorHandler())
  .use(new AuthMiddleware())
  .use(cors());
