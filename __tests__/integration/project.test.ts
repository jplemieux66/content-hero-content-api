/**
 * Project Integration Tests
 *
 * @group integration
 */
import axios from 'axios';
import dotenv from 'dotenv';

import { disconnectDatabase, initDatabase } from '../../db/db';
import { Project } from '../../db/models/project';
import { ProjectUser } from '../../db/models/project-user';
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

describe('POST /project', () => {
  test('Should create project', async () => {
    // Arrange
    const data = getTestProject();
    // Act
    const res = await axios.post(process.env.API_URL + '/projects', data, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    // Assert
    await expect(res.status).toBe(200);
    await expect(res.data.name).toEqual(data.name);
  });
  test('Should fail if there is no token', async () => {
    // Arrange
    const data = getTestProject();
    // Act
    try {
      const res = await axios.post(process.env.API_URL + '/projects', data);
      // Assert
      await expect(res.status).not.toBe(200);
    } catch (e) {
      await expect(e.response.status).not.toBe(200);
      return;
    }
    throw new Error('Should have thrown error');
  });
});

describe('UPDATE /projects/:id', () => {
  test('Should update project', async () => {
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
    const newName = 'UPDATED';

    // Act
    const res = await axios.patch(
      process.env.API_URL + '/projects/' + initialProject._id,
      { name: newName },
      {
        headers: {
          Authorization: `Bearer ${user1Token}`,
        },
      },
    );

    // Assert
    await expect(res.status).toBe(200);
    await expect(res.data._id).toEqual(initialProject._id.toString());
    await expect(res.data.name).toEqual(newName);
  });

  test('Should fail if there is no token', async () => {
    // Arrange
    const data = getTestProject();
    const initialItem = new Project({
      ...data,
    });
    await initialItem.save();
    const newName = 'UPDATED';
    // Act
    try {
      await axios.patch(process.env.API_URL + '/content/' + initialItem._id, {
        name: newName,
      });
    } catch (e) {
      await expect(e.response.status).not.toBe(200);
      return;
    }

    throw new Error('Should have thrown error');
  });

  test('Should return error if the project does not exist', async () => {
    // Arrange
    const data = getTestProject();
    const initialItem = new Project({
      ...data,
    });
    await initialItem.save();
    const newName = 'UPDATED';

    // Act
    try {
      await axios.patch(process.env.API_URL + '/content/FAKEID', {
        name: newName,
      });
    } catch (e) {
      await expect(e.response.status).not.toBe(200);
      return;
    }

    throw new Error('Should have thrown error');
  });

  test('Should return error if the user is not in the project', async () => {
    // Arrange
    const data = getTestProject();
    const initialProject = new Project({
      ...data,
    });
    await initialProject.save();
    const newName = 'UPDATED';

    // Act
    try {
      await axios.patch(
        process.env.API_URL + '/projects/' + initialProject._id.toString(),
        {
          name: newName,
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
});

describe('DELETE /projects/:id', () => {
  test('Should delete project', async () => {
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
      process.env.API_URL + '/projects/' + initialProject._id.toString(),
      {
        headers: {
          Authorization: `Bearer ${user1Token}`,
        },
      },
    );

    // Assert
    await expect(res.status).toBe(200);

    const foundProject = await Project.findById(initialProject._id);
    await expect(foundProject).toBeNull();

    const foundProjectUsers = await ProjectUser.find({
      projectId: initialProject._id,
    });
    await expect(foundProjectUsers.length).toEqual(0);
  });

  test('Should fail if there is no token', async () => {
    // Arrange
    const data = getTestProject();
    const initialItem = new Project({
      ...data,
    });
    await initialItem.save();

    // Act
    try {
      await axios.delete(process.env.API_URL + '/content/' + initialItem._id);
    } catch (e) {
      await expect(e.response.status).not.toBe(200);
      return;
    }

    throw new Error('Should have thrown error');
  });

  test('Should return error if the project does not exist', async () => {
    // Arrange
    const data = getTestProject();
    const initialItem = new Project({
      ...data,
    });
    await initialItem.save();

    // Act
    try {
      await axios.delete(process.env.API_URL + '/content/FAKEID');
    } catch (e) {
      await expect(e.response.status).not.toBe(200);
      return;
    }

    throw new Error('Should have thrown error');
  });

  test('Should return error if the user is not in the project', async () => {
    // Arrange
    const data = getTestProject();
    const initialProject = new Project({
      ...data,
    });
    await initialProject.save();

    // Act
    try {
      await axios.delete(
        process.env.API_URL + '/projects/' + initialProject._id.toString(),
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
});

describe('GET /projects', () => {
  test('Should list projects only for user', async () => {
    // Arrange
    const data = getTestProject();
    const dataLength = 3;
    for (let i = 0; i < dataLength; i++) {
      const project = new Project({
        ...data,
      });
      await project.save();
      const projectUser = new ProjectUser({
        projectId: project._id,
        userEmail: process.env.AUTH0_USER_1_EMAIL,
        role: 'Admin',
      });
      await projectUser.save();
    }

    const unauthorizedProject = new Project({
      ...data,
    });
    await unauthorizedProject.save();
    const unauthorizedProjectUser = new ProjectUser({
      projectId: unauthorizedProject._id,
      userEmail: process.env.AUTH0_USER_2_EMAIL,
      role: 'Admin',
    });
    await unauthorizedProjectUser.save();

    // Act
    const res = await axios.get(process.env.API_URL + '/projects', {
      headers: {
        Authorization: `Bearer ${user1Token}`,
      },
    });

    // Assert
    await expect(res.status).toBe(200);
    await expect(res.data.length).toEqual(dataLength);
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

    // Act
    try {
      await axios.get(process.env.API_URL + '/projects');
    } catch (e) {
      await expect(e.response.status).not.toBe(200);
      return;
    }

    throw new Error('Should have thrown error');
  });
});

describe('GET /projects/:id', () => {
  test('Should get project with id', async () => {
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

    // Act
    const res = await axios.get(
      process.env.API_URL + '/projects/' + initialProject._id.toString(),
      {
        headers: {
          Authorization: `Bearer ${user1Token}`,
        },
      },
    );

    // Assert
    await expect(res.status).toBe(200);
    await expect(res.data._id).toEqual(initialProject._id.toString());
  });

  test('Should not get unauthorized project', async () => {
    // Arrange
    const data = getTestProject();
    const unauthorizedProject = new Project({
      ...data,
    });
    await unauthorizedProject.save();
    const projectUser = new ProjectUser({
      projectId: unauthorizedProject._id,
      userEmail: process.env.AUTH0_USER_2_EMAIL,
      role: 'Admin',
    });
    await projectUser.save();

    // Act
    try {
      await axios.get(
        process.env.API_URL + '/content/' + unauthorizedProject._id,
        {
          headers: {
            Authorization: `Bearer ${user1Token}`,
          },
        },
      );
    } catch (e) {
      await expect(e.response.status).toBe(404);
    }
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

    // Act
    try {
      await axios.get(process.env.API_URL + '/projects/' + initialProject._id);
    } catch (e) {
      await expect(e.response.status).not.toBe(200);
      return;
    }

    throw new Error('Should have thrown error');
  });
});
