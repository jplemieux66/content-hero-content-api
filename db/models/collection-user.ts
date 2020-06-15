import mongoose from 'mongoose';

export interface CollectionUser extends mongoose.Document {
  collectionId: string;
  userEmail: string;
  createdAt: number;
  updatedAt: number;
}

const TagPermissionSchema = new mongoose.Schema({
  tagId: {
    type: String,
    required: true,
  },
  canDownload: {
    type: Boolean,
    required: true,
  },
  canEdit: {
    type: Boolean,
    required: true,
  },
  canDelete: {
    type: Boolean,
    required: true,
  },
});

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
    role: {
      type: String,
      enum: ['Admin', 'Standard', 'SelectedTagsOnly'],
      required: true,
    },
    tagPermissions: {
      type: [TagPermissionSchema],
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
