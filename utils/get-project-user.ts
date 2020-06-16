import createHttpError from 'http-errors';

import { ProjectUser } from '../db/models/project-user';

// TODO: Refactor in Middleware

export const getProjectUser = async (
  projectId: string,
  userEmail: string,
): Promise<ProjectUser> => {
  const projectUser = await ProjectUser.findOne({
    projectId,
    userEmail,
  });

  if (!projectUser) {
    throw createHttpError(404, `Project not found`);
  }

  return projectUser;
};
