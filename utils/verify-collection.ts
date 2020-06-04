import createHttpError from 'http-errors';
import { CollectionUser } from '../db/models/collection-user';
import { Collection } from '../db/models/collection';

export const verifyCollection = async (collectionId, userEmail) => {
  const [collectionUser, collection] = await Promise.all([
    CollectionUser.findOne({
      collectionId: collectionId,
      userEmail,
    }),
    Collection.findOne({
      _id: collectionId,
      userEmail,
    }),
  ]);

  if (!collectionUser || !collection) {
    throw createHttpError(404, `Collection not found`);
  }
};
