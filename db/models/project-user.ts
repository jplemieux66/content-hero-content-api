import mongoose from 'mongoose';

export interface TagPermission {
  tagId: string;
  canDownload: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface ProjectUser extends mongoose.Document {
  projectId: string;
  userEmail: string;
  role: 'Admin' | 'Standard' | 'SelectedTagsOnly';
  tagPermissions?: TagPermission[];
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

const ProjectUserSchema = new mongoose.Schema(
  {
    projectId: {
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

(global as any).ProjectUser =
  (global as any).ProjectUser ||
  mongoose.model('ProjectUser', ProjectUserSchema);

export const ProjectUser = (global as any).ProjectUser as mongoose.Model<
  ProjectUser
>;
