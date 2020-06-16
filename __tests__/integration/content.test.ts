/**
 * Content Integration Tests
 *
 * @group integration
 */
import axios from 'axios';
import dotenv from 'dotenv';

import { disconnectDatabase, initDatabase } from '../../db/db';
import { Project } from '../../db/models/project';
import { ProjectUser } from '../../db/models/project-user';
import { Content } from '../../db/models/content';
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
    role: 'Admin',
  });
  await projectUser.save();
});

afterAll(async () => {
  await Project.deleteMany({});
  await ProjectUser.deleteMany({});
  disconnectDatabase();
});

afterEach(async () => {
  await Content.deleteMany({});
});

const getTestContent = () => ({
  name: 'Test',
  description: 'Test',
  fileName: 'test.mp4',
  fileType: 'image/jpeg',
  fileSize: 3000000,
  s3ContentId: 'any',
  s3ContentURL: 'any',
  width: 100,
  height: 100,
  duration: 30,
  tags: [],
  thumbnails: [
    {
      key: 'test',
      url: 'test',
      width: 100,
      height: 100,
    },
  ],
});

describe('POST /content', () => {
  test('Should create content', async () => {
    // Arrange
    const data = getTestContent();

    // Act
    const res = await axios.post(
      `${process.env.API_URL}/projects/${project1Id}/content`,
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
    const data = getTestContent();

    // Act
    try {
      const res = await axios.post(
        `${process.env.API_URL}/projects/${project1Id}/content`,
        data,
      );

      // Assert
      await expect(res.status).not.toBe(200);
    } catch (e) {
      await expect(e.response.status).not.toBe(200);
      return;
    }

    throw new Error('Should have thrown error');
  });
});

describe('UPDATE /content/:id', () => {
  test('Should update content', async () => {
    // Arrange
    const data = getTestContent();
    const initialItem = new Content({
      ...data,
      projectId: project1Id,
    });
    await initialItem.save();
    const newName = 'UPDATED';

    // Act
    const res = await axios.patch(
      process.env.API_URL +
        '/projects/' +
        project1Id +
        '/content/' +
        initialItem._id.toString(),
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

  test('Should return 404 if content is associated with another project', async () => {
    // Arrange
    const data = getTestContent();
    const initialItem = new Content({
      ...data,
      projectId: project2Id,
    });
    await initialItem.save();
    const newName = 'UPDATED';

    // Act
    try {
      await axios.patch(
        `${process.env.API_URL}/projects/${project1Id}/content/${initialItem._id}`,
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
  });

  test('Should fail if there is no token', async () => {
    // Arrange
    const data = getTestContent();
    const initialItem = new Content({
      ...data,
      projectId: project1Id,
    });
    await initialItem.save();
    const newName = 'UPDATED';

    // Act
    try {
      await axios.patch(
        `${process.env.API_URL}/projects/${project1Id}/content/${initialItem._id}`,
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

describe('DELETE /content/:id', () => {
  test('Should delete content', async () => {
    // Arrange
    const data = getTestContent();
    const initialItem = new Content({
      ...data,
      projectId: project1Id,
    });
    await initialItem.save();

    // Act
    const res = await axios.delete(
      `${process.env.API_URL}/projects/${project1Id}/content/${initialItem._id}`,
      {
        headers: {
          Authorization: `Bearer ${user1Token}`,
        },
      },
    );

    // Assert
    await expect(res.status).toBe(200);

    const nullItem = await Content.findById(initialItem._id);
    await expect(nullItem).toBeNull();
  });

  test('Should return 404 if content is associated with an unauthorized project', async () => {
    // Arrange
    const data = getTestContent();
    const initialItem = new Content({
      ...data,
      projectId: project2Id,
    });
    await initialItem.save();

    // Act
    try {
      await axios.delete(
        `${process.env.API_URL}/projects/${project2Id}/content/${initialItem._id}`,
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
    const data = getTestContent();
    const initialItem = new Content({
      ...data,
      projectId: project1Id,
    });
    await initialItem.save();

    // Act
    try {
      await axios.delete(
        `${process.env.API_URL}/projects/${project1Id}/content/${initialItem._id}`,
      );
    } catch (e) {
      await expect(e.response.status).not.toBe(200);
      return;
    }

    throw new Error('Should have thrown error');
  });
});

describe('GET /content', () => {
  test('Should list content only for project', async () => {
    // Arrange
    const data = getTestContent();
    const dataLength = 3;
    for (let i = 0; i < dataLength; i++) {
      const item = new Content({
        ...data,
        projectId: project1Id,
      });
      await item.save();
    }
    const unauthorizedItem = new Content({
      ...data,
      projectId: project2Id,
    });
    await unauthorizedItem.save();

    // Act
    const res = await axios.get(
      `${process.env.API_URL}/projects/${project1Id}/content`,
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
    const data = getTestContent();
    const initialItem = new Content({
      ...data,
      projectId: project1Id,
    });
    await initialItem.save();

    // Act
    try {
      await axios.get(`${process.env.API_URL}/projects/${project1Id}/content`);
    } catch (e) {
      await expect(e.response.status).not.toBe(200);
      return;
    }

    throw new Error('Should have thrown error');
  });
});

describe('GET /content/:id', () => {
  test('Should get content with id', async () => {
    // Arrange
    const data = getTestContent();
    const item = new Content({
      ...data,
      projectId: project1Id,
    });
    await item.save();

    // Act
    const res = await axios.get(
      `${process.env.API_URL}/projects/${project1Id}/content/${item._id}`,
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

  test('Should not get content from unauthorized project', async () => {
    // Arrange
    const data = getTestContent();
    const item = new Content({
      ...data,
      projectId: project2Id,
    });
    await item.save();

    // Act
    try {
      await axios.get(
        `${process.env.API_URL}/projects/${project2Id}/content/${item._id}`,
        {
          headers: {
            Authorization: `Bearer ${user1Token}`,
          },
        },
      );
    } catch (e) {
      await expect([404, 403]).toContain(e.response.status);
    }
  });

  test('Should fail if there is no token', async () => {
    // Arrange
    const data = getTestContent();
    const initialItem = new Content({
      ...data,
      projectId: project1Id,
    });
    await initialItem.save();
    // Act
    try {
      await axios.get(
        `${process.env.API_URL}/projects/${project1Id}/content/${initialItem._id}`,
      );
    } catch (e) {
      // Assert
      await expect(e.response.status).not.toBe(200);
      return;
    }

    throw new Error('Should have thrown error');
  });
});
