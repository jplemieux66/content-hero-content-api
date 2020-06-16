/**
 * Tags Integration Tests
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
let project1Id: string;
let project2Id: string;

beforeAll(async () => {
  await initDatabase();
  user1Token = await getToken(
    process.env.AUTH0_USER_1_EMAIL,
    process.env.AUTH0_USER_1_PASSWORD,
  );

  const project = new Project({
    name: 'Test',
  });
  await project.save();
  project1Id = project._id.toString();

  const project2 = new Project({
    name: 'Test2',
  });
  await project2.save();
  project2Id = project2._id.toString();

  const projectUser = new ProjectUser({
    projectId: project1Id,
    userEmail: process.env.AUTH0_USER_1_EMAIL,
  });
  await projectUser.save();
});

afterAll(async () => {
  disconnectDatabase();
});

afterEach(async () => {
  await Tag.deleteMany({});
});

const getTestTag = () => ({
  name: 'Test',
});

describe('POST /tags', () => {
  test('Should create tag', async () => {
    // Arrange
    const data = {
      ...getTestTag(),
      projectId: project1Id,
    };

    // Act
    const res = await axios.post(
      `${process.env.API_URL}/projects/${project1Id}/tags`,
      data,
      {
        headers: { Authorization: `Bearer ${user1Token}` },
      },
    );
    const item = res.data;

    // Assert
    await expect(res.status).toBe(200);
    await expect(item.name).toEqual(data.name);
    await expect(item.projectId).toEqual(project1Id);
  });

  test('Should fail if there is no token', async () => {
    // Arrange
    const data = getTestTag();

    // Act
    try {
      await axios.post(
        `${process.env.API_URL}/projects/${project1Id}/tags`,
        data,
      );
    } catch (e) {
      await expect(e.response.status).not.toBe(200);
      return;
    }

    throw new Error('Should have thrown error');
  });
});

describe('UPDATE /tags/:id', () => {
  test('Should update tag', async () => {
    // Arrange
    const data = getTestTag();
    const initialItem = new Tag({
      ...data,
      projectId: project1Id,
    });
    await initialItem.save();
    const newName = 'UPDATED';

    // Act
    const res = await axios.patch(
      `${
        process.env.API_URL
      }/projects/${project1Id}/tags/${initialItem._id.toString()}`,
      { name: newName },
      {
        headers: {
          Authorization: `Bearer ${user1Token}`,
        },
      },
    );
    const item = res.data;

    // Assert
    await expect(res.status).toBe(200);
    await expect(item._id).toEqual(initialItem._id.toString());
    await expect(item.name).toEqual(newName);
  });

  test('Should return 404 if tag is associated with another project', async () => {
    // Arrange
    const data = getTestTag();
    const initialItem = new Tag({
      ...data,
      projectId: project2Id,
    });
    await initialItem.save();
    const newName = 'UPDATED';

    // Act
    try {
      await axios.patch(
        `${
          process.env.API_URL
        }/projects/${project1Id}/tags/${initialItem._id.toString()}`,
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
      await expect([404, 403]).toContain(e.response.status);
      return;
    }

    throw new Error('Should have thrown error');
  });

  test('Should fail if there is no token', async () => {
    // Arrange
    const data = getTestTag();
    const initialItem = new Tag({
      ...data,
      projectId: project1Id,
    });
    await initialItem.save();
    const newName = 'UPDATED';
    // Act
    try {
      await axios.patch(
        `${
          process.env.API_URL
        }/projects/${project1Id}/tags/${initialItem._id.toString()}`,
        {
          name: newName,
        },
      );
    } catch (e) {
      await expect(e.response.status).not.toBe(200);
      return;
    }

    throw new Error('Should have thrown error');
  });
});

describe('DELETE /tags/:id', () => {
  test('Should delete tag', async () => {
    // Arrange
    const data = getTestTag();
    const initialItem = new Tag({
      ...data,
      projectId: project1Id,
    });
    await initialItem.save();

    // Act
    const res = await axios.delete(
      `${
        process.env.API_URL
      }/projects/${project1Id}/tags/${initialItem._id.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${user1Token}`,
        },
      },
    );

    // Assert
    await expect(res.status).toBe(200);

    const nullItem = await Tag.findById(initialItem._id);
    await expect(nullItem).toBeNull();
  });

  test('Should return 404 if tag is associated with another project', async () => {
    // Arrange
    const data = getTestTag();
    const initialItem = new Tag({
      ...data,
      projectId: project2Id,
    });
    await initialItem.save();

    // Act
    try {
      await axios.delete(
        `${
          process.env.API_URL
        }/projects/${project2Id}/tags/${initialItem._id.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${user1Token}`,
          },
        },
      );
    } catch (e) {
      await expect(e.response.status).toEqual(404);
      return;
    }

    throw new Error('Should have thrown error');
  });

  test('Should fail if there is no token', async () => {
    // Arrange
    const data = getTestTag();
    const initialItem = new Tag({
      ...data,
      projectId: project1Id,
    });
    await initialItem.save();

    // Act
    try {
      await axios.delete(
        `${
          process.env.API_URL
        }/projects/${project2Id}/tags/${initialItem._id.toString()}`,
      );
    } catch (e) {
      await expect(e.response.status).not.toBe(200);
      return;
    }

    throw new Error('Should have thrown error');
  });
});

describe('GET /tags', () => {
  test('Should list tags only for user', async () => {
    // Arrange
    const data = getTestTag();
    const dataLength = 3;
    for (let i = 0; i < dataLength; i++) {
      const item = new Tag({
        ...data,
        projectId: project1Id,
      });
      await item.save();
    }
    const unauthorizedItem = new Tag({
      ...data,
      projectId: project2Id,
    });
    await unauthorizedItem.save();

    // Act
    const res = await axios.get(
      `${process.env.API_URL}/projects/${project1Id}/tags/`,
      {
        headers: {
          Authorization: `Bearer ${user1Token}`,
        },
      },
    );

    // Assert
    await expect(res.status).toBe(200);
    await expect(res.data.length).toEqual(dataLength);
  });

  test('Should fail if there is no token', async () => {
    // Arrange
    const data = getTestTag();
    const initialItem = new Tag({
      ...data,
      projectId: project1Id,
    });
    await initialItem.save();

    // Act
    try {
      await axios.get(`${process.env.API_URL}/projects/${project1Id}/tags/`);
    } catch (e) {
      await expect(e.response.status).not.toBe(200);
      return;
    }

    throw new Error('Should have thrown error');
  });
});

describe('GET /tags/:id', () => {
  test('Should get tag with id', async () => {
    // Arrange
    const data = getTestTag();
    const item = new Tag({
      ...data,
      projectId: project1Id,
    });
    await item.save();

    // Act
    const res = await axios.get(
      `${process.env.API_URL}/projects/${project1Id}/tags/${item._id}`,
      {
        headers: {
          Authorization: `Bearer ${user1Token}`,
        },
      },
    );

    // Assert
    await expect(res.status).toBe(200);
    await expect(res.data._id).toEqual(item._id.toString());
  });

  test('Should not get tag from other project', async () => {
    // Arrange
    const data = getTestTag();
    const item = new Tag({
      ...data,
      projectId: project2Id,
    });
    await item.save();

    // Act
    try {
      await axios.get(
        `${process.env.API_URL}/projects/${project2Id}/tags/${item._id}`,
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
    const data = getTestTag();
    const initialItem = new Tag({
      ...data,
      projectId: project1Id,
    });
    await initialItem.save();

    // Act
    try {
      await axios.get(
        `${process.env.API_URL}/projects/${project1Id}/tags/${initialItem._id}`,
      );
    } catch (e) {
      // Assert
      await expect(e.response.status).not.toBe(200);
      return;
    }

    throw new Error('Should have thrown error');
  });
});
