import { AuthMiddleware } from '../../utils/auth-middleware';
import jwt, { TokenExpiredError, NotBeforeError } from 'jsonwebtoken';

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  decode: jest.fn(),
}));
const mockedJwt = (jwt as any) as { verify: jest.Mock; decode: jest.Mock };
const next = jest.fn().mockImplementation(() => {});

describe('Auth Middleware', () => {
  test('Should set auth properties on event', async () => {
    // Arrange
    const event = {
      headers: {
        Authorization: 'Bearer token',
      },
    };
    const auth = new AuthMiddleware();
    mockedJwt.verify.mockImplementation(() => {});
    mockedJwt.decode.mockImplementation(() => ({}));

    // Act
    await auth.before({ event: event as any } as any, next);

    // Assert
    expect(event['auth']).toMatchObject({
      payload: {},
      token: 'token',
    });
    expect(next).toHaveBeenCalled();
  });

  test('Should throw error if Authorization header is not set', async () => {
    // Arrange
    const event = {};
    const auth = new AuthMiddleware();

    // Act
    try {
      await auth.before({ event: event as any } as any, next);
    } catch (e) {
      // Assert
      expect(e).not.toBeUndefined();
      return;
    }

    throw new Error('Expected error to be thrown');
  });

  test('Should throw error if Authorization header is not in the right format', async () => {
    // Arrange
    const event = {
      headers: {
        Authorization: 'token',
      },
    };
    const auth = new AuthMiddleware();

    // Act
    try {
      await auth.before({ event: event as any } as any, next);
    } catch (e) {
      expect(e).not.toBeUndefined();
      return;
    }

    throw new Error('Expected error to be thrown');
  });

  test('Should throw error if token is expired', async () => {
    // Arrange
    const event = {
      headers: {
        Authorization: 'Bearer token',
      },
    };
    const auth = new AuthMiddleware();
    mockedJwt.verify.mockImplementation(() => {
      throw new TokenExpiredError('Expired', new Date());
    });

    // Act
    try {
      await auth.before(
        {
          event: event as any,
        } as any,
        next,
      );
    } catch (e) {
      expect(e).not.toBeUndefined();
      return;
    }

    throw new Error('Expected error to be thrown');
  });

  test('Should throw error if token is not valid before X', async () => {
    // Arrange
    const event = {
      headers: {
        Authorization: 'Bearer token',
      },
    };
    const auth = new AuthMiddleware();
    mockedJwt.verify.mockImplementation(() => {
      throw new NotBeforeError('', new Date());
    });

    // Act
    try {
      await auth.before(
        {
          event: event as any,
        } as any,
        next,
      );
    } catch (e) {
      expect(e).not.toBeUndefined();
      return;
    }

    throw new Error('Expected error to be thrown');
  });
});
