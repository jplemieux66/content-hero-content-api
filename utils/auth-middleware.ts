import debugFactory, { IDebugger } from 'debug';
import createHttpError from 'http-errors';
import { APIGatewayProxyEvent } from 'aws-lambda';
import middy from '@middy/core';
import jwt, { NotBeforeError, TokenExpiredError } from 'jsonwebtoken';

export class AuthMiddleware {
  private readonly logger: IDebugger;

  constructor() {
    this.logger = debugFactory('auth-middleware');
    this.logger(`Setting up AuthMiddleware`);
  }

  public before: middy.MiddlewareFunction<any, any> = async ({ event }) => {
    const token = this.getTokenFromAuthHeader(event);

    if (token === undefined) {
      return;
    }

    this.logger('Verifying authorization token');

    try {
      jwt.verify(token, process.env.AUTH0_CLIENT_PUBLIC_KEY, {
        algorithms: ['RS256'],
      });
      this.logger('Token verified');
    } catch (err) {
      this.logger('Token could not be verified');

      if (err instanceof TokenExpiredError) {
        this.logger(
          `Token expired at ${new Date(err.expiredAt).toUTCString()}`,
        );
        throw createHttpError(
          401,
          `Token expired at ${new Date(err.expiredAt).toUTCString()}`,
          {
            expiredAt: err.expiredAt,
            type: 'TokenExpiredError',
          },
        );
      }

      if (err instanceof NotBeforeError) {
        this.logger(`Token not valid before ${err.date}`);
        throw createHttpError(401, `Token not valid before ${err.date}`, {
          date: err.date,
          type: 'NotBeforeError',
        });
      }

      throw createHttpError(401, 'Invalid token', {
        type: 'InvalidToken',
      });
    }

    const payload = jwt.decode(token);
    event.auth = { payload: payload as any, token };
  };

  private getTokenFromAuthHeader(
    event: APIGatewayProxyEvent,
  ): string | undefined {
    this.logger('Checking whether event contains authorization header');

    if (!event.headers.Authorization) {
      throw createHttpError(
        401,
        'No valid bearer token was set in the authorization header',
        {
          type: 'AuthenticationRequired',
        },
      );
    }

    const authHeader = event.headers.Authorization;
    this.logger('Checking whether authorization header is formed correctly');
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      this.logger(
        `Authorization header malformed, it was "${authHeader}" but should be of format "Bearer token"`,
      );
      throw createHttpError(
        401,
        `Format should be "Authorization: Bearer [token]", received "Authorization: ${authHeader}" instead`,
        {
          type: 'WrongAuthFormat',
        },
      );
    }
    this.logger('Authorization header formed correctly');

    return parts[1];
  }
}
