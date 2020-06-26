import middy from '@middy/core';

import { disconnectDatabase, initDatabase } from '../db/db';

export class DbMiddleware {
  public before: middy.MiddlewareFunction<any, any> = async ({ event }) => {
    await initDatabase();
  };

  public after: middy.MiddlewareFunction<any, any> = async ({ event }) => {
    await disconnectDatabase();
  };
}
