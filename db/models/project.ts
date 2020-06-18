import mongoose from 'mongoose';

export interface Project extends mongoose.Document {
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  userEmails?: string[];
}

const ProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    userEmails: {
      type: [String],
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

(global as any).Project =
  (global as any).Project || mongoose.model('Project', ProjectSchema);

export const Project = (global as any).Project as mongoose.Model<Project>;
