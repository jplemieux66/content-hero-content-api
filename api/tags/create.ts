import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyHandler } from 'aws-lambda';
import createHttpError from 'http-errors';

import { initDatabase } from '../../db/db';
import { Tag } from '../../db/models/tag';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { getProjectUser } from '../../utils/get-project-user';
import { getUserEmail } from '../../utils/get-user-email';

initDatabase();

const create: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;

  try {
    const body = event.body as any;
    const projectId = event.pathParameters.projectId;
    const userEmail = getUserEmail(event);
    const projectUser = await getProjectUser(projectId, userEmail);

    if (projectUser.role !== 'Admin' && projectUser.role !== 'Standard') {
      throw createHttpError(401, `User Role doesn't allow tag creation`);
    }

    const existingItem = await Tag.findOne({ name: body.name, projectId });

    if (existingItem) {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'text/plain' },
        body: 'There is already a tag with this name',
      };
    }

    const item = await new Tag({
      ...body,
      projectId,
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
