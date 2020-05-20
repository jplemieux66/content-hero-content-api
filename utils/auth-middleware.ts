import createHttpError from 'http-errors';
import { APIGatewayProxyEvent } from 'aws-lambda';
import middy from '@middy/core';
import jwt, { NotBeforeError, TokenExpiredError } from 'jsonwebtoken';

export class AuthMiddleware {
  public before: middy.MiddlewareFunction<any, any> = async ({ event }) => {
    const token = this.getTokenFromAuthHeader(event);

    try {
      jwt.verify(token, process.env.AUTH0_CLIENT_PUBLIC_KEY, {
        algorithms: ['RS256'],
      });
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        throw createHttpError(
          401,
          `Token expired at ${new Date(err.expiredAt).toUTCString()}`,
        );
      }

      if (err instanceof NotBeforeError) {
        throw createHttpError(401, `Token not valid before ${err.date}`);
      }

      throw createHttpError(401, 'Invalid token');
    }

    const payload = jwt.decode(token);
    event.auth = { payload: payload as any, token };
  };

  private getTokenFromAuthHeader(
    event: APIGatewayProxyEvent,
  ): string | undefined {
    if (!event.headers.Authorization) {
      throw createHttpError(
        401,
        'No valid bearer token was set in the authorization header',
      );
    }

    const authHeader = event.headers.Authorization;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw createHttpError(
        401,
        `Format should be "Authorization: Bearer [token]", received "Authorization: ${authHeader}" instead`,
      );
    }

    return parts[1];
  }
}
