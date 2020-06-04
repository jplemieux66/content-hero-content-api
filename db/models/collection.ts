import mongoose from 'mongoose';

export interface Collection extends mongoose.Document {
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

const CollectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true },
);

(global as any).Collection =
  (global as any).Collection || mongoose.model('Collection', CollectionSchema);

export const Collection = (global as any).Collection as mongoose.Model<
  Collection
>;
