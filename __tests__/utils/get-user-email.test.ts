import { getUserEmail } from '../../utils/get-user-email';

describe('Get User Email Tests', () => {
  test('Should return the email', () => {
    // Arrange
    const testEmail = 'test@example.com';
    const event = {
      auth: {
        payload: {},
      },
    };
    event.auth.payload[process.env.AUTH0_NAMESPACE + '_email'] = testEmail;

    // Act
    const email = getUserEmail(event as any);

    // Assert
    expect(email).toEqual(testEmail);
  });

  test('Should throw error if auth property is not set', () => {
    // Arrange
    const event = {};

    // Act
    try {
      getUserEmail(event as any);
    } catch (e) {
      // Assert
      expect(e).not.toBeUndefined();
      return;
    }

    throw new Error('Should have thrown error');
  });

  test('Should throw error if email was not found in event auth info', () => {
    // Arrange
    const event = {
      auth: {
        payload: {},
      },
    };

    // Act
    try {
      getUserEmail(event as any);
    } catch (e) {
      // Assert
      expect(e).not.toBeUndefined();
      return;
    }

    throw new Error('Should have thrown error');
  });
});
