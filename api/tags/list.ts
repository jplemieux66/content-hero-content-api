import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import { APIGatewayProxyHandler } from 'aws-lambda';

import { initDatabase } from '../../db/db';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { getUserEmail } from '../../utils/get-user-email';
import { Tag } from '../../db/models/tag';
import { getProjectUser } from '../../utils/get-project-user';

initDatabase();

const list: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;

  try {
    const projectId = event.pathParameters.projectId;
    const userEmail = getUserEmail(event);
    const projectUser = await getProjectUser(projectId, userEmail);

    let content;

    if (projectUser.role === 'SelectedTagsOnly') {
      const tagsId = projectUser.tagPermissions.map((t) => t.tagId);
      content = await Tag.find({
        projectId,
        _id: {
          $in: tagsId,
        },
      });
    } else {
      content = await Tag.find({
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
