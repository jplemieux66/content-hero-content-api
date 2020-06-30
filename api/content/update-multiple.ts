import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyHandler } from 'aws-lambda';

import { Content } from '../../db/models/content';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { DbMiddleware } from '../../utils/db-middleware';
import { getProjectUser } from '../../utils/get-project-user';
import { getUserEmail } from '../../utils/get-user-email';

const updateMultiple: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;

  try {
    const body = (event.body as any) as {
      id: string;
      update: Partial<Content>;
    }[];
    const projectId = event.pathParameters.projectId;
    const userEmail = getUserEmail(event);
    const projectUser = await getProjectUser(projectId, userEmail);

    const errors: { id: string; status: number; error: string }[] = [];
    const ids = body.map((c) => c.id);

    let items = await Content.find({
      _id: {
        $in: ids,
      },
      projectId,
    });

    if (items.length !== body.length) {
      const notFound = ids.filter(
        (id) => items.find((i) => i._id === id) === undefined,
      );
      notFound.map((id) =>
        errors.push({
          id,
          status: 404,
          error: 'Not Found',
        }),
      );
    }

    let allowedItems = [...items];
    if (projectUser.role === 'SelectedTagsOnly') {
      items.map((item) => {
        const tagPermissions = projectUser.tagPermissions.filter(
          (permission) =>
            item.tags.find((tagId) => tagId === permission.tagId) !== undefined,
        );
        const canEdit =
          tagPermissions.find((permission) => permission.canEdit) !== undefined;

        if (!canEdit) {
          allowedItems = allowedItems.filter((i) => i._id !== i._id);
          errors.push({
            id: item._id,
            status: 401,
            error: `User can't edit this content`,
          });
        }
      });
    }

    const modifiedItems = [];
    for (let item of allowedItems) {
      try {
        await Content.updateOne(
          {
            _id: item._id,
            projectId,
          },
          body.find((i) => i.id === item._id.toString()).update,
        );
        item = await Content.findById(item._id);
        modifiedItems.push(item);
      } catch (e) {
        errors.push({
          id: item._id,
          status: e.statusCode || 501,
          error: `Couldn't update the item`,
        });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        items: modifiedItems,
        errors,
      }),
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

export const handler = middy(updateMultiple)
  .use(jsonBodyParser())
  .use(httpErrorHandler())
  .use(new AuthMiddleware())
  .use(new DbMiddleware())
  .use(cors());
