import mongoose from 'mongoose';

export interface Tag extends mongoose.Document {
  _id: string;
  name: string;
  description: string;
  createdBy: string;
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
    projectId: {
      type: String,
      required: true,
    },
    createdBy: {
      type: String,
    },
  },
  { timestamps: true },
);

(global as any).Tag = (global as any).Tag || mongoose.model('Tag', TagSchema);

export const Tag = (global as any).Tag as mongoose.Model<Tag>;
