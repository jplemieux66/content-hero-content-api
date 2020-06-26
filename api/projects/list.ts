import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import { APIGatewayProxyHandler } from 'aws-lambda';

import { initDatabase } from '../../db/db';
import { ProjectUser } from '../../db/models/project-user';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { getUserEmail } from '../../utils/get-user-email';
import { Project } from '../../db/models/project';

const list: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;
  await initDatabase();

  try {
    const userEmail = getUserEmail(event);
    const myProjectUsers = await ProjectUser.find({ userEmail });
    const projectsId = myProjectUsers.map((cu) => cu.projectId);

    const myProjects = await Project.find({
      _id: {
        $in: projectsId,
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify(myProjects),
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
