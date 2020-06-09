/**
 * Users Integration Tests
 *
 * @group integration
 */
import axios from 'axios';
import dotenv from 'dotenv';

import { disconnectDatabase, initDatabase } from '../../db/db';
import { Collection } from '../../db/models/collection';
import { CollectionUser } from '../../db/models/collection-user';
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
  await Collection.deleteMany({});
  await CollectionUser.deleteMany({});
});

const getTestCollection = () => ({
  name: 'Test',
});

describe('GET /collections/:id/users', () => {
  test('Should return users for collection', async () => {
    // Arrange
    const data = getTestCollection();
    const collection = new Collection({
      ...data,
    });
    await collection.save();

    const unauthorizedCollection = new Collection({
      ...data,
    });
    await unauthorizedCollection.save();

    const collectionUser = new CollectionUser({
      collectionId: collection._id,
      userEmail: process.env.AUTH0_USER_1_EMAIL,
      tags: [],
    });
    await collectionUser.save();

    const collectionUser2 = new CollectionUser({
      collectionId: unauthorizedCollection._id,
      userEmail: process.env.AUTH0_USER_2_EMAIL,
      tags: [],
    });
    await collectionUser2.save();

    // Act
    const res = await axios.get(
      process.env.API_URL + '/collections/' + collection._id + '/users',
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
    const data = getTestCollection();
    const collection = new Collection({
      ...data,
    });
    await collection.save();

    const unauthorizedCollection = new Collection({
      ...data,
    });
    await unauthorizedCollection.save();

    const collectionUser = new CollectionUser({
      collectionId: collection._id,
      userEmail: process.env.AUTH0_USER_1_EMAIL,
      tags: [],
    });
    await collectionUser.save();

    const collectionUser2 = new CollectionUser({
      collectionId: unauthorizedCollection._id,
      userEmail: process.env.AUTH0_USER_2_EMAIL,
      tags: [],
    });
    await collectionUser2.save();

    // Act
    try {
      await axios.get(
        process.env.API_URL + '/collections/' + collection._id + '/users',
      );
    } catch (e) {
      await expect(e.response.status).not.toBe(200);
      return;
    }

    throw new Error('Should have thrown error');
  });
});

describe('POST /collections/:id/users', () => {
  test('Should add user', async () => {
    // Arrange
    const data = getTestCollection();
    const initialCollection = new Collection({
      ...data,
    });
    await initialCollection.save();
    const collectionUser = new CollectionUser({
      collectionId: initialCollection._id,
      userEmail: process.env.AUTH0_USER_1_EMAIL,
      tags: [],
    });
    await collectionUser.save();
    const newUserEmail = process.env.AUTH0_USER_2_EMAIL;

    // Act
    const res = await axios.post(
      process.env.API_URL + '/collections/' + initialCollection._id + '/users',
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
    const dbCollectionUser = await CollectionUser.findOne({
      collectionId: initialCollection._id,
      userEmail: newUserEmail,
    });
    expect(dbCollectionUser).not.toBeNull();
    expect(dbCollectionUser).not.toBeUndefined();
  });

  test('Should not add user to unauthorized collection', async () => {
    // Arrange
    const data = getTestCollection();
    const initialCollection = new Collection({
      ...data,
    });
    await initialCollection.save();
    const collectionUser = new CollectionUser({
      collectionId: initialCollection._id,
      userEmail: process.env.AUTH0_USER_2_EMAIL,
      tags: [],
    });
    await collectionUser.save();
    const newUserEmail = process.env.AUTH0_USER_1_EMAIL;

    // Act
    try {
      await axios.post(
        process.env.API_URL +
          '/collections/' +
          initialCollection._id +
          '/users',
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
    const data = getTestCollection();
    const initialCollection = new Collection({
      ...data,
    });
    await initialCollection.save();
    const collectionUser = new CollectionUser({
      collectionId: initialCollection._id,
      userEmail: process.env.AUTH0_USER_1_EMAIL,
      tags: [],
    });
    await collectionUser.save();
    const newUserEmail = process.env.AUTH0_USER_2_EMAIL;

    // Act
    try {
      await axios.post(
        process.env.API_URL +
          '/collections/' +
          initialCollection._id +
          '/users',
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

describe('DELETE /collections/:id/users?userEmail=x', () => {
  test('Should delete user', async () => {
    // Arrange
    const data = getTestCollection();
    const initialCollection = new Collection({
      ...data,
    });

    await initialCollection.save();

    const collectionUser = new CollectionUser({
      collectionId: initialCollection._id,
      userEmail: process.env.AUTH0_USER_1_EMAIL,
      tags: [],
    });
    await collectionUser.save();

    const collectionUser2 = new CollectionUser({
      collectionId: initialCollection._id,
      userEmail: process.env.AUTH0_USER_2_EMAIL,
      tags: [],
    });
    await collectionUser2.save();

    // Act
    const res = await axios.delete(
      process.env.API_URL +
        '/collections/' +
        initialCollection._id +
        '/users/' +
        collectionUser2._id,
      {
        headers: {
          Authorization: `Bearer ${user1Token}`,
        },
      },
    );

    // Assert
    expect(res.status).toEqual(200);
    const dbCollectionUser = await CollectionUser.findOne({
      collectionId: initialCollection._id,
      userEmail: process.env.AUTH0_USER_2_EMAIL,
    });
    expect(dbCollectionUser).toBeNull();
  });

  test('Should not delete user in unauthorized collection', async () => {
    // Arrange
    const data = getTestCollection();
    const initialCollection = new Collection({
      ...data,
    });

    await initialCollection.save();

    const collectionUser2 = new CollectionUser({
      collectionId: initialCollection._id,
      userEmail: process.env.AUTH0_USER_2_EMAIL,
      tags: [],
    });
    await collectionUser2.save();

    // Act
    try {
      await axios.delete(
        process.env.API_URL +
          '/collections/' +
          initialCollection._id +
          '/users/' +
          collectionUser2._id,
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
    const data = getTestCollection();
    const initialCollection = new Collection({
      ...data,
    });

    await initialCollection.save();

    const collectionUser = new CollectionUser({
      collectionId: initialCollection._id,
      userEmail: process.env.AUTH0_USER_1_EMAIL,
      tags: [],
    });
    await collectionUser.save();

    const collectionUser2 = new CollectionUser({
      collectionId: initialCollection._id,
      userEmail: process.env.AUTH0_USER_2_EMAIL,
      tags: [],
    });
    await collectionUser2.save();

    // Act
    try {
      await axios.delete(
        process.env.API_URL +
          '/collections/' +
          initialCollection._id +
          '/users/' +
          collectionUser2._id,
      );
    } catch (e) {
      // Assert
      await expect(e.response.status).not.toBe(200);
      return;
    }

    throw new Error('Should have thrown error');
  });
});

describe('PATCH /collections/:id/users', () => {
  test('Should update user', async () => {
    // Arrange
    const data = getTestCollection();
    const initialCollection = new Collection({
      ...data,
    });

    await initialCollection.save();

    const collectionUser = new CollectionUser({
      collectionId: initialCollection._id,
      userEmail: process.env.AUTH0_USER_1_EMAIL,
      tags: [],
    });
    await collectionUser.save();

    const collectionUser2 = new CollectionUser({
      collectionId: initialCollection._id,
      userEmail: process.env.AUTH0_USER_2_EMAIL,
      tags: [],
    });
    await collectionUser2.save();

    const tag = new Tag({
      name: 'Test',
      collectionId: initialCollection._id,
    });
    await tag.save();

    // Act
    const res = await axios.patch(
      process.env.API_URL +
        '/collections/' +
        initialCollection._id +
        '/users/' +
        collectionUser2._id,
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

  test('Should not update user in unauthorized collection', async () => {
    // Arrange
    const data = getTestCollection();
    const initialCollection = new Collection({
      ...data,
    });

    await initialCollection.save();

    const collectionUser2 = new CollectionUser({
      collectionId: initialCollection._id,
      userEmail: process.env.AUTH0_USER_2_EMAIL,
      tags: [],
    });
    await collectionUser2.save();

    const tag = new Tag({
      name: 'Test',
      collectionId: initialCollection._id,
    });
    await tag.save();

    // Act
    try {
      await axios.patch(
        process.env.API_URL +
          '/collections/' +
          initialCollection._id +
          '/users/' +
          collectionUser2._id,
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
    const data = getTestCollection();
    const initialCollection = new Collection({
      ...data,
    });

    await initialCollection.save();

    const collectionUser = new CollectionUser({
      collectionId: initialCollection._id,
      userEmail: process.env.AUTH0_USER_1_EMAIL,
      tags: [],
    });
    await collectionUser.save();

    const collectionUser2 = new CollectionUser({
      collectionId: initialCollection._id,
      userEmail: process.env.AUTH0_USER_2_EMAIL,
      tags: [],
    });
    await collectionUser2.save();

    const tag = new Tag({
      name: 'Test',
      collectionId: initialCollection._id,
    });
    await tag.save();

    // Act
    try {
      await axios.patch(
        process.env.API_URL +
          '/collections/' +
          initialCollection._id +
          '/users/' +
          collectionUser2._id,
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
