/**
 * Integration Tests
 *
 * @group integration
 */
import axios from 'axios';
import dotenv from 'dotenv';

import { Content } from '../../db/models/content';
import { initDatabase, disconnectDatabase } from '../../db/db';
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

describe('POST /content', () => {
  test('Should create content', async () => {
    // Arrange
    const data = {
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
      thumbnails: [
        {
          key: 'test',
          url: 'test',
          width: 100,
          height: 100,
        },
      ],
    };

    // Act
    try {
      const res = await axios.post(process.env.API_URL + '/content', data, {
        headers: { Authorization: `Bearer ${user1Token}` },
      });
      const item = res.data;

      // Assert
      expect(res.status).toBe(200);
      expect(item.name).toEqual(data.name);
      expect(item.userEmail).toEqual(process.env.AUTH0_USER_1_EMAIL);

      // Delete Record
      await Content.findOneAndDelete({ _id: item._id });
      return;
    } catch (e) {
      console.log(e);
    }
  });
});
