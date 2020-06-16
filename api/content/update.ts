import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyHandler } from 'aws-lambda';

import { initDatabase } from '../../db/db';
import { Content } from '../../db/models/content';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { getUserEmail } from '../../utils/get-user-email';
import { getCollectionUser } from '../../utils/get-collection-user';
import createHttpError from 'http-errors';

initDatabase();

const update: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;

  try {
    const body = event.body as any;
    const collectionId = event.pathParameters.collectionId;
    const userEmail = getUserEmail(event);
    const collectionUser = await getCollectionUser(collectionId, userEmail);

    let item = await Content.findOne({
      _id: event.pathParameters.id,
      collectionId,
    });

    if (!item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'text/plain' },
        body: "Couldn't find the item to delete",
      };
    }

    if (collectionUser.role === 'SelectedTagsOnly') {
      const tagPermissions = collectionUser.tagPermissions.filter(
        (permission) =>
          item.tags.find((tagId) => tagId === permission.tagId) !== undefined,
      );
      const canEdit =
        tagPermissions.find((permission) => permission.canEdit) !== undefined;

      if (!canEdit) {
        throw createHttpError(401, `User can't edit this content`);
      }
    }

    await Content.updateOne(
      {
        _id: event.pathParameters.id,
        collectionId,
      },
      body,
    );

    item = await Content.findById(item._id);

    return {
      statusCode: 200,
      body: JSON.stringify(item),
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
