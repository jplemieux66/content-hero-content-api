import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import { APIGatewayProxyHandler } from 'aws-lambda';
import createHttpError from 'http-errors';

import { initDatabase } from '../../db/db';
import { Content } from '../../db/models/content';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { getProjectUser } from '../../utils/get-project-user';
import { getUserEmail } from '../../utils/get-user-email';

initDatabase();

const getHandler: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;

  try {
    const projectId = event.pathParameters.projectId;
    const userEmail = getUserEmail(event);
    const projectUser = await getProjectUser(projectId, userEmail);

    const content = await Content.findOne({
      _id: event.pathParameters.id,
      projectId,
    });
    if (!content) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'text/plain' },
        body: "Couldn't find the item to delete",
      };
    }

    if (projectUser.role === 'SelectedTagsOnly') {
      const tagPermissions = projectUser.tagPermissions.filter(
        (permission) =>
          content.tags.find((tagId) => tagId === permission.tagId) !==
          undefined,
      );

      if (!tagPermissions || tagPermissions.length < 1) {
        throw createHttpError(401, `User can't view this content`);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify(content),
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

export const handler = middy(getHandler)
  .use(httpErrorHandler())
  .use(new AuthMiddleware())
  .use(cors());
