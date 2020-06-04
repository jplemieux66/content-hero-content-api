import createHttpError from 'http-errors';

import { CollectionUser } from '../db/models/collection-user';

// TODO: Refactor in Middleware

export const verifyCollection = async (collectionId, userEmail) => {
  const collectionUser = await CollectionUser.findOne({
    collectionId: collectionId,
    userEmail,
  });

  if (!collectionUser) {
    throw createHttpError(404, `Collection not found`);
  }
};
