import mongoose, { Schema } from 'mongoose';

export interface FileUpload extends mongoose.Document {
  id: string;
  status: 'Uploading' | 'Processing' | 'Complete' | 'Error';
  processingResponse?: any;
  error?: string;
}

const FileUploadSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Uploading', 'Processing', 'Complete', 'Error'],
      default: 'Uploading',
    },
    userEmail: {
      type: String,
      required: true,
    },
    processingResponse: {
      type: Object,
    },
    error: {
      type: Schema.Types.Mixed,
    },
    projectId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

(global as any).FileUpload =
  (global as any).FileUpload || mongoose.model('FileUpload', FileUploadSchema);

export const FileUpload = (global as any).FileUpload as mongoose.Model<
  FileUpload
>;
