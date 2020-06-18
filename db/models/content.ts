import mongoose from 'mongoose';

export interface ContentThumbnail {
  key: string;
  url: string;
  width: number;
  height: number;
}

const ContentThumbnailSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  width: {
    type: Number,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
});

export interface Content extends mongoose.Document {
  name: string;
  description: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  s3ContentId: string;
  s3ContentURL: string;
  width: number;
  height: number;
  duration: string;
  thumbnails: ContentThumbnail[];
  tags: string[];
  projectId: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

const ContentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    s3ContentId: {
      type: String,
      required: true,
    },
    s3ContentURL: {
      type: String,
      required: true,
    },
    width: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    duration: {
      type: String,
    },
    thumbnails: {
      type: [ContentThumbnailSchema],
      required: true,
    },
    tags: {
      type: [String],
      required: true,
    },
    projectId: {
      type: String,
      required: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

(global as any).Content =
  (global as any).Content || mongoose.model('Content', ContentSchema);

export const Content = (global as any).Content as mongoose.Model<Content>;
