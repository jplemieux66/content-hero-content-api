/**
 * Tests Auth Service for Automated Tests
 *
 * @group auth
 */
import { getToken } from './auth';
import dotenv from 'dotenv';

dotenv.config({ path: 'config/.env.test' });

describe('Auth', () => {
  test('Should return access token', async () => {
    const token = await getToken(
      process.env.AUTH0_USER_1_EMAIL,
      process.env.AUTH0_USER_1_PASSWORD,
    );
    expect(token).not.toBeUndefined();
  });

  test('Should throw error', async () => {
    try {
      await getToken('error@example.com', '');
    } catch (e) {
      expect(e).not.toBeUndefined();
      return;
    }

    throw new Error('Should have thrown error');
  });
});
