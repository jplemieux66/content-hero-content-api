/**
 * Collection Integration Tests
 *
 * @group integration
 */
import axios from 'axios';
import dotenv from 'dotenv';

import { disconnectDatabase, initDatabase } from '../../db/db';
import { Collection } from '../../db/models/collection';
import { CollectionUser } from '../../db/models/collection-user';
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

describe('POST /collection', () => {
  test('Should create collection', async () => {
    // Arrange
    const data = getTestCollection();
    // Act
    const res = await axios.post(process.env.API_URL + '/collections', data, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    // Assert
    await expect(res.status).toBe(200);
    await expect(res.data.name).toEqual(data.name);
  });
  test('Should fail if there is no token', async () => {
    // Arrange
    const data = getTestCollection();
    // Act
    try {
      const res = await axios.post(process.env.API_URL + '/collections', data);
      // Assert
      await expect(res.status).not.toBe(200);
    } catch (e) {
      await expect(e.response.status).not.toBe(200);
      return;
    }
    throw new Error('Should have thrown error');
  });
});

describe('UPDATE /collections/:id', () => {
  test('Should update collection', async () => {
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
    const newName = 'UPDATED';

    // Act
    const res = await axios.patch(
      process.env.API_URL + '/collections/' + initialCollection._id,
      { name: newName },
      {
        headers: {
          Authorization: `Bearer ${user1Token}`,
        },
      },
    );

    // Assert
    await expect(res.status).toBe(200);
    await expect(res.data._id).toEqual(initialCollection._id.toString());
    await expect(res.data.name).toEqual(newName);
  });

  test('Should fail if there is no token', async () => {
    // Arrange
    const data = getTestCollection();
    const initialItem = new Collection({
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

  test('Should return error if the collection does not exist', async () => {
    // Arrange
    const data = getTestCollection();
    const initialItem = new Collection({
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

  test('Should return error if the user is not in the collection', async () => {
    // Arrange
    const data = getTestCollection();
    const initialCollection = new Collection({
      ...data,
    });
    await initialCollection.save();
    const newName = 'UPDATED';

    // Act
    try {
      await axios.patch(
        process.env.API_URL +
          '/collections/' +
          initialCollection._id.toString(),
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

describe('DELETE /collections/:id', () => {
  test('Should delete collection', async () => {
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
      process.env.API_URL + '/collections/' + initialCollection._id.toString(),
      {
        headers: {
          Authorization: `Bearer ${user1Token}`,
        },
      },
    );

    // Assert
    await expect(res.status).toBe(200);

    const foundCollection = await Collection.findById(initialCollection._id);
    await expect(foundCollection).toBeNull();

    const foundCollectionUsers = await CollectionUser.find({
      collectionId: initialCollection._id,
    });
    await expect(foundCollectionUsers.length).toEqual(0);
  });

  test('Should fail if there is no token', async () => {
    // Arrange
    const data = getTestCollection();
    const initialItem = new Collection({
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

  test('Should return error if the collection does not exist', async () => {
    // Arrange
    const data = getTestCollection();
    const initialItem = new Collection({
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

  test('Should return error if the user is not in the collection', async () => {
    // Arrange
    const data = getTestCollection();
    const initialCollection = new Collection({
      ...data,
    });
    await initialCollection.save();

    // Act
    try {
      await axios.delete(
        process.env.API_URL +
          '/collections/' +
          initialCollection._id.toString(),
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

describe('GET /collections', () => {
  test('Should list collections only for user', async () => {
    // Arrange
    const data = getTestCollection();
    const dataLength = 3;
    for (let i = 0; i < dataLength; i++) {
      const collection = new Collection({
        ...data,
      });
      await collection.save();
      const collectionUser = new CollectionUser({
        collectionId: collection._id,
        userEmail: process.env.AUTH0_USER_1_EMAIL,
        tags: [],
      });
      await collectionUser.save();
    }

    const unauthorizedCollection = new Collection({
      ...data,
    });
    await unauthorizedCollection.save();
    const unauthorizedCollectionUser = new CollectionUser({
      collectionId: unauthorizedCollection._id,
      userEmail: process.env.AUTH0_USER_2_EMAIL,
      tags: [],
    });
    await unauthorizedCollectionUser.save();

    // Act
    const res = await axios.get(process.env.API_URL + '/collections', {
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

    // Act
    try {
      await axios.get(process.env.API_URL + '/collections');
    } catch (e) {
      await expect(e.response.status).not.toBe(200);
      return;
    }

    throw new Error('Should have thrown error');
  });
});

describe('GET /collections/:id', () => {
  test('Should get collection with id', async () => {
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

    // Act
    const res = await axios.get(
      process.env.API_URL + '/collections/' + initialCollection._id.toString(),
      {
        headers: {
          Authorization: `Bearer ${user1Token}`,
        },
      },
    );

    // Assert
    await expect(res.status).toBe(200);
    await expect(res.data._id).toEqual(initialCollection._id.toString());
  });

  test('Should not get unauthorized collection', async () => {
    // Arrange
    const data = getTestCollection();
    const unauthorizedCollection = new Collection({
      ...data,
    });
    await unauthorizedCollection.save();
    const collectionUser = new CollectionUser({
      collectionId: unauthorizedCollection._id,
      userEmail: process.env.AUTH0_USER_2_EMAIL,
      tags: [],
    });
    await collectionUser.save();

    // Act
    try {
      await axios.get(
        process.env.API_URL + '/content/' + unauthorizedCollection._id,
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

    // Act
    try {
      await axios.get(
        process.env.API_URL + '/collections/' + initialCollection._id,
      );
    } catch (e) {
      await expect(e.response.status).not.toBe(200);
      return;
    }

    throw new Error('Should have thrown error');
  });
});
