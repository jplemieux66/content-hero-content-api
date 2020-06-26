import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import { APIGatewayProxyHandler } from 'aws-lambda';

import { initDatabase } from '../../db/db';
import { Content } from '../../db/models/content';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { getProjectUser } from '../../utils/get-project-user';
import { getUserEmail } from '../../utils/get-user-email';

const list: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;
  await initDatabase();

  try {
    const projectId = event.pathParameters.projectId;
    const userEmail = getUserEmail(event);
    const projectUser = await getProjectUser(projectId, userEmail);

    let content;
    if (projectUser.role === 'SelectedTagsOnly') {
      const allowedTagsId = projectUser.tagPermissions.map((p) => p.tagId);
      content = await Content.find({
        projectId,
        tags: {
          $in: allowedTagsId,
        },
      });
    } else {
      content = await Content.find({
        projectId,
      });
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
      body: e.message || "Couldn't list the items.",
    };
  }
};

export const handler = middy(list)
  .use(httpErrorHandler())
  .use(new AuthMiddleware())
  .use(cors());
