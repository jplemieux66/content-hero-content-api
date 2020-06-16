/**
 * Users Integration Tests
 *
 * @group integration
 */
import axios from 'axios';
import dotenv from 'dotenv';

import { disconnectDatabase, initDatabase } from '../../db/db';
import { Project } from '../../db/models/project';
import { ProjectUser } from '../../db/models/project-user';
import { Tag } from '../../db/models/tag';
import { getToken } from '../_auth/auth';

dotenv.config({ path: 'config/.env.test' });
jest.setTimeout(30000);

let user1Token: string;

beforeAll(async () => {
  await initDatabase();
  user1Token = await getToken(
    process.env.AUTH0_USER_1_EMAIL,
    process.env.AUTH0_USER_1_PASSWORD,
  );
});

afterAll(async () => {
  disconnectDatabase();
});

afterEach(async () => {
  await Project.deleteMany({});
  await ProjectUser.deleteMany({});
});

const getTestProject = () => ({
  name: 'Test',
});

describe('GET /projects/:id/users', () => {
  test('Should return users for project', async () => {
    // Arrange
    const data = getTestProject();
    const project = new Project({
      ...data,
    });
    await project.save();

    const unauthorizedProject = new Project({
      ...data,
    });
    await unauthorizedProject.save();

    const projectUser = new ProjectUser({
      projectId: project._id,
      userEmail: process.env.AUTH0_USER_1_EMAIL,
      role: 'Admin',
    });
    await projectUser.save();

    const projectUser2 = new ProjectUser({
      projectId: unauthorizedProject._id,
      userEmail: process.env.AUTH0_USER_2_EMAIL,
      role: 'Admin',
    });
    await projectUser2.save();

    // Act
    const res = await axios.get(
      process.env.API_URL + '/projects/' + project._id + '/users',
      {
        headers: {
          Authorization: `Bearer ${user1Token}`,
        },
      },
    );

    expect(res.status).toEqual(200);
    expect(res.data.length).toEqual(1);
  });

  test('Should fail if there is no token', async () => {
    // Arrange
    const data = getTestProject();
    const project = new Project({
      ...data,
    });
    await project.save();

    const unauthorizedProject = new Project({
      ...data,
    });
    await unauthorizedProject.save();

    const projectUser = new ProjectUser({
      projectId: project._id,
      userEmail: process.env.AUTH0_USER_1_EMAIL,
      role: 'Admin',
    });
    await projectUser.save();

    const projectUser2 = new ProjectUser({
      projectId: unauthorizedProject._id,
      userEmail: process.env.AUTH0_USER_2_EMAIL,
      role: 'Admin',
    });
    await projectUser2.save();

    // Act
    try {
      await axios.get(
        process.env.API_URL + '/projects/' + project._id + '/users',
      );
    } catch (e) {
      await expect(e.response.status).not.toBe(200);
      return;
    }

    throw new Error('Should have thrown error');
  });
});

describe('POST /projects/:id/users', () => {
  test('Should add user', async () => {
    // Arrange
    const data = getTestProject();
    const initialProject = new Project({
      ...data,
    });
    await initialProject.save();
    const projectUser = new ProjectUser({
      projectId: initialProject._id,
      userEmail: process.env.AUTH0_USER_1_EMAIL,
      role: 'Admin',
    });
    await projectUser.save();
    const newUserEmail = process.env.AUTH0_USER_2_EMAIL;

    // Act
    const res = await axios.post(
      process.env.API_URL + '/projects/' + initialProject._id + '/users',
      {
        userEmail: newUserEmail,
      },
      {
        headers: {
          Authorization: `Bearer ${user1Token}`,
        },
      },
    );

    // Assert
    expect(res.status).toEqual(200);
    expect(res.data.userEmail).toEqual(newUserEmail);
    const dbProjectUser = await ProjectUser.findOne({
      projectId: initialProject._id,
      userEmail: newUserEmail,
    });
    expect(dbProjectUser).not.toBeNull();
    expect(dbProjectUser).not.toBeUndefined();
  });

  test('Should not add user to unauthorized project', async () => {
    // Arrange
    const data = getTestProject();
    const initialProject = new Project({
      ...data,
    });
    await initialProject.save();
    const projectUser = new ProjectUser({
      projectId: initialProject._id,
      userEmail: process.env.AUTH0_USER_2_EMAIL,
      role: 'Admin',
    });
    await projectUser.save();
    const newUserEmail = process.env.AUTH0_USER_1_EMAIL;

    // Act
    try {
      await axios.post(
        process.env.API_URL + '/projects/' + initialProject._id + '/users',
        {
          userEmail: newUserEmail,
        },
        {
          headers: {
            Authorization: `Bearer ${user1Token}`,
          },
        },
      );
    } catch (e) {
      // Assert
      await expect(e.response.status).not.toBe(200);
      return;
    }

    throw new Error('Should have thrown error');
  });

  test('Should fail if there is no token', async () => {
    // Arrange
    const data = getTestProject();
    const initialProject = new Project({
      ...data,
    });
    await initialProject.save();
    const projectUser = new ProjectUser({
      projectId: initialProject._id,
      userEmail: process.env.AUTH0_USER_1_EMAIL,
      role: 'Admin',
    });
    await projectUser.save();
    const newUserEmail = process.env.AUTH0_USER_2_EMAIL;

    // Act
    try {
      await axios.post(
        process.env.API_URL + '/projects/' + initialProject._id + '/users',
        {
          userEmail: newUserEmail,
        },
      );
    } catch (e) {
      // Assert
      await expect(e.response.status).not.toBe(200);
      return;
    }

    throw new Error('Should have thrown error');
  });
});

describe('DELETE /projects/:id/users?userEmail=x', () => {
  test('Should delete user', async () => {
    // Arrange
    const data = getTestProject();
    const initialProject = new Project({
      ...data,
    });

    await initialProject.save();

    const projectUser = new ProjectUser({
      projectId: initialProject._id,
      userEmail: process.env.AUTH0_USER_1_EMAIL,
      role: 'Admin',
    });
    await projectUser.save();

    const projectUser2 = new ProjectUser({
      projectId: initialProject._id,
      userEmail: process.env.AUTH0_USER_2_EMAIL,
      role: 'Admin',
    });
    await projectUser2.save();

    // Act
    const res = await axios.delete(
      process.env.API_URL +
        '/projects/' +
        initialProject._id +
        '/users/' +
        projectUser2._id,
      {
        headers: {
          Authorization: `Bearer ${user1Token}`,
        },
      },
    );

    // Assert
    expect(res.status).toEqual(200);
    const dbProjectUser = await ProjectUser.findOne({
      projectId: initialProject._id,
      userEmail: process.env.AUTH0_USER_2_EMAIL,
    });
    expect(dbProjectUser).toBeNull();
  });

  test('Should not delete user in unauthorized project', async () => {
    // Arrange
    const data = getTestProject();
    const initialProject = new Project({
      ...data,
    });

    await initialProject.save();

    const projectUser2 = new ProjectUser({
      projectId: initialProject._id,
      userEmail: process.env.AUTH0_USER_2_EMAIL,
      role: 'Admin',
    });
    await projectUser2.save();

    // Act
    try {
      await axios.delete(
        process.env.API_URL +
          '/projects/' +
          initialProject._id +
          '/users/' +
          projectUser2._id,
        {
          headers: {
            Authorization: `Bearer ${user1Token}`,
          },
        },
      );
    } catch (e) {
      // Assert
      await expect(e.response.status).not.toBe(200);
      return;
    }

    throw new Error('Should have thrown error');
  });

  test('Should fail if there is no token', async () => {
    // Arrange
    const data = getTestProject();
    const initialProject = new Project({
      ...data,
    });

    await initialProject.save();

    const projectUser = new ProjectUser({
      projectId: initialProject._id,
      userEmail: process.env.AUTH0_USER_1_EMAIL,
      role: 'Admin',
    });
    await projectUser.save();

    const projectUser2 = new ProjectUser({
      projectId: initialProject._id,
      userEmail: process.env.AUTH0_USER_2_EMAIL,
      role: 'Admin',
    });
    await projectUser2.save();

    // Act
    try {
      await axios.delete(
        process.env.API_URL +
          '/projects/' +
          initialProject._id +
          '/users/' +
          projectUser2._id,
      );
    } catch (e) {
      // Assert
      await expect(e.response.status).not.toBe(200);
      return;
    }

    throw new Error('Should have thrown error');
  });
});

describe('PATCH /projects/:id/users', () => {
  test('Should update user', async () => {
    // Arrange
    const data = getTestProject();
    const initialProject = new Project({
      ...data,
    });

    await initialProject.save();

    const projectUser = new ProjectUser({
      projectId: initialProject._id,
      userEmail: process.env.AUTH0_USER_1_EMAIL,
      role: 'Admin',
    });
    await projectUser.save();

    const projectUser2 = new ProjectUser({
      projectId: initialProject._id,
      userEmail: process.env.AUTH0_USER_2_EMAIL,
      role: 'Admin',
    });
    await projectUser2.save();

    const tag = new Tag({
      name: 'Test',
      projectId: initialProject._id,
    });
    await tag.save();

    // Act
    const res = await axios.patch(
      process.env.API_URL +
        '/projects/' +
        initialProject._id +
        '/users/' +
        projectUser2._id,
      { tags: [tag._id] },
      {
        headers: {
          Authorization: `Bearer ${user1Token}`,
        },
      },
    );

    // Assert
    expect(res.status).toEqual(200);
    expect(res.data.tags[0]).toEqual(tag._id.toString());
  });

  test('Should not update user in unauthorized project', async () => {
    // Arrange
    const data = getTestProject();
    const initialProject = new Project({
      ...data,
    });

    await initialProject.save();

    const projectUser2 = new ProjectUser({
      projectId: initialProject._id,
      userEmail: process.env.AUTH0_USER_2_EMAIL,
      role: 'Admin',
    });
    await projectUser2.save();

    const tag = new Tag({
      name: 'Test',
      projectId: initialProject._id,
    });
    await tag.save();

    // Act
    try {
      await axios.patch(
        process.env.API_URL +
          '/projects/' +
          initialProject._id +
          '/users/' +
          projectUser2._id,
        { tags: [tag._id] },
        {
          headers: {
            Authorization: `Bearer ${user1Token}`,
          },
        },
      );
    } catch (e) {
      // Assert
      await expect(e.response.status).not.toBe(200);
      return;
    }

    throw new Error('Should have thrown error');
  });

  test('Should fail if there is no token', async () => {
    // Arrange
    const data = getTestProject();
    const initialProject = new Project({
      ...data,
    });

    await initialProject.save();

    const projectUser = new ProjectUser({
      projectId: initialProject._id,
      userEmail: process.env.AUTH0_USER_1_EMAIL,
      role: 'Admin',
    });
    await projectUser.save();

    const projectUser2 = new ProjectUser({
      projectId: initialProject._id,
      userEmail: process.env.AUTH0_USER_2_EMAIL,
      role: 'Admin',
    });
    await projectUser2.save();

    const tag = new Tag({
      name: 'Test',
      projectId: initialProject._id,
    });
    await tag.save();

    // Act
    try {
      await axios.patch(
        process.env.API_URL +
          '/projects/' +
          initialProject._id +
          '/users/' +
          projectUser2._id,
        { tags: [tag._id] },
      );
    } catch (e) {
      // Assert
      await expect(e.response.status).not.toBe(200);
      return;
    }

    throw new Error('Should have thrown error');
  });
});
