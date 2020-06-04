import createHttpError from 'http-errors';

import { CollectionUser } from '../db/models/collection-user';

// TODO: Refactor in Middleware
// export const verifyCollection = async (collectionId, userEmail) => {
//   const [collectionUser, collection] = await Promise.all([
//     CollectionUser.findOne({
//       collectionId: collectionId,
//       userEmail,
//     }),
//     Collection.findOne({
//       _id: collectionId,
//     }),
//   ]);

//   if (!collectionUser || !collection) {
//     throw createHttpError(404, `Collection not found`);
//   }
// };

export const verifyCollection = async (collectionId, userEmail) => {
  const collectionUser = CollectionUser.findOne({
    collectionId: collectionId,
    userEmail,
  });

  if (!collectionUser) {
    throw createHttpError(404, `Collection not found`);
  }
};
