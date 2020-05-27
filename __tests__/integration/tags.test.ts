/**
 * Tags Integration Tests
 *
 * @group integration
 */
import axios from 'axios';
import dotenv from 'dotenv';

import { disconnectDatabase, initDatabase } from '../../db/db';
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
  await Tag.deleteMany({});
});

const getTestTag = () => ({
  name: 'Test',
});

describe('POST /tags', () => {
  test('Should create tag', async () => {
    // Arrange
    const data = getTestTag();

    // Act
    const res = await axios.post(process.env.API_URL + '/tags', data, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const item = res.data;

    // Assert
    await expect(res.status).toBe(200);
    await expect(item.name).toEqual(data.name);
    await expect(item.userEmail).toEqual(process.env.AUTH0_USER_1_EMAIL);
  });

  test('Should fail if there is no token', async () => {
    // Arrange
    const data = getTestTag();

    // Act
    try {
      await axios.post(process.env.API_URL + '/tags', data);
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
      userEmail: process.env.AUTH0_USER_1_EMAIL,
    });
    await initialItem.save();
    const newName = 'UPDATED';

    // Act
    const res = await axios.patch(
      process.env.API_URL + '/tags/' + initialItem._id,
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
    await expect(item._id).toEqual(initialItem._id);
    await expect(item.name).toEqual(newName);
  });

  test('Should return 404 if tag is associated with another user', async () => {
    // Arrange
    const data = getTestTag();
    const initialItem = new Tag({
      ...data,
      userEmail: process.env.AUTH0_USER_2_EMAIL,
    });
    await initialItem.save();
    const newName = 'UPDATED';

    // Act
    try {
      await axios.patch(
        process.env.API_URL + '/tags/' + initialItem._id,
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
      userEmail: process.env.AUTH0_USER_2_EMAIL,
    });
    await initialItem.save();
    const newName = 'UPDATED';
    // Act
    try {
      await axios.patch(
        process.env.API_URL + '/tags/' + initialItem._id,
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
      userEmail: process.env.AUTH0_USER_1_EMAIL,
    });
    await initialItem.save();

    // Act
    const res = await axios.delete(
      process.env.API_URL + '/tags/' + initialItem._id,
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

  test('Should return 404 if tag is associated with another user', async () => {
    // Arrange
    const data = getTestTag();
    const initialItem = new Tag({
      ...data,
      userEmail: process.env.AUTH0_USER_2_EMAIL,
    });
    await initialItem.save();

    // Act
    try {
      await axios.delete(process.env.API_URL + '/tags/' + initialItem._id, {
        headers: {
          Authorization: `Bearer ${user1Token}`,
        },
      });
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
      userEmail: process.env.AUTH0_USER_2_EMAIL,
    });
    await initialItem.save();

    // Act
    try {
      await axios.delete(process.env.API_URL + '/tags/' + initialItem._id, {
        headers: {
          Authorization: `Bearer ${user1Token}`,
        },
      });
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
        userEmail: process.env.AUTH0_USER_1_EMAIL,
      });
      await item.save();
    }
    const unauthorizedItem = new Tag({
      ...data,
      userEmail: process.env.AUTH0_USER_2_EMAIL,
    });
    await unauthorizedItem.save();

    // Act
    const res = await axios.get(process.env.API_URL + '/tags', {
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
    const data = getTestTag();
    const initialItem = new Tag({
      ...data,
      userEmail: process.env.AUTH0_USER_2_EMAIL,
    });
    await initialItem.save();

    // Act
    try {
      await axios.get(process.env.API_URL + '/tag');
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
      userEmail: process.env.AUTH0_USER_1_EMAIL,
    });
    await item.save();

    // Act
    const res = await axios.get(process.env.API_URL + '/tags/' + item._id, {
      headers: {
        Authorization: `Bearer ${user1Token}`,
      },
    });

    // Assert
    await expect(res.status).toBe(200);
    await expect(res.data._id).toEqual(item._id.toString());
  });

  test('Should not get tag from other user', async () => {
    // Arrange
    const data = getTestTag();
    const item = new Tag({
      ...data,
      userEmail: process.env.AUTH0_USER_2_EMAIL,
    });
    await item.save();

    // Act
    const res = await axios.get(process.env.API_URL + '/tags/' + item._id, {
      headers: {
        Authorization: `Bearer ${user1Token}`,
      },
    });

    // Assert
    await expect(res.status).toBe(404);
  });

  test('Should fail if there is no token', async () => {
    // Arrange
    const data = getTestTag();
    const initialItem = new Tag({
      ...data,
      userEmail: process.env.AUTH0_USER_2_EMAIL,
    });
    await initialItem.save();

    // Act
    try {
      await axios.get(process.env.API_URL + '/tags/' + initialItem._id);
    } catch (e) {
      // Assert
      await expect(e.response.status).not.toBe(200);
      return;
    }

    throw new Error('Should have thrown error');
  });
});
