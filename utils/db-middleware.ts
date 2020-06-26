import middy from '@middy/core';

import { initDatabase } from '../db/db';

export class DbMiddleware {
  public before: middy.MiddlewareFunction<any, any> = async ({ event }) => {
    await initDatabase();
  };
}
