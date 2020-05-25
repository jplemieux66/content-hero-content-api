import mongoose from 'mongoose';

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
    userEmail: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

(global as any).Content =
  (global as any).Content || mongoose.model('Content', ContentSchema);

export const Content = (global as any).Content;
