import mongoose from 'mongoose';

export interface CollectionUser extends mongoose.Document {
  collectionId: string;
  userEmail: string;
  createdAt: number;
  updatedAt: number;
}

const CollectionUserSchema = new mongoose.Schema(
  {
    collectionId: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

(global as any).CollectionUser =
  (global as any).CollectionUser ||
  mongoose.model('CollectionUser', CollectionUserSchema);

export const CollectionUser = (global as any).CollectionUser as mongoose.Model<
  CollectionUser
>;
