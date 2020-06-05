import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import { APIGatewayProxyHandler } from 'aws-lambda';

import { initDatabase } from '../../db/db';
import { CollectionUser } from '../../db/models/collection-user';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { getUserEmail } from '../../utils/get-user-email';
import { Collection } from '../../db/models/collection';

initDatabase();

const list: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;

  try {
    const userEmail = getUserEmail(event);
    const myCollectionUsers = await CollectionUser.find({ userEmail });
    const collectionsId = myCollectionUsers.map((cu) => cu.collectionId);

    const myCollections = await Collection.find({
      _id: {
        $in: collectionsId,
      },
    });
    const allCollectionUsers = await CollectionUser.find({
      collectionId: {
        $in: collectionsId,
      },
    });

    myCollections.map((c) => {
      const userEmails = allCollectionUsers
        .filter((u) => u.collectionId === c._id)
        .map((u) => u.userEmail);
      c.userEmails = userEmails;
    });

    return {
      statusCode: 200,
      body: JSON.stringify(myCollections),
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
