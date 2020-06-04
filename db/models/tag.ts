import mongoose from 'mongoose';

export interface Tag extends mongoose.Document {
  _id: string;
  name: string;
  description: string;
}

const TagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    collectionId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

(global as any).Tag = (global as any).Tag || mongoose.model('Tag', TagSchema);

export const Tag = (global as any).Tag as mongoose.Model<Tag>;
