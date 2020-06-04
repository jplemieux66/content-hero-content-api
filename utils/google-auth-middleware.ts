import 'source-map-support/register';

import middy from '@middy/core';
import { google } from 'googleapis';
import createHttpError from 'http-errors';

import { ITokens, Tokens } from '../db/models/tokens';
import { getUserEmail } from './get-user-email';

export class GoogleAuthMiddleware {
  public before: middy.MiddlewareFunction<any, any> = async ({ event }) => {
    const userEmail = getUserEmail(event);
    const tokens: ITokens = await Tokens.findOne({ email: userEmail });
    if (!tokens) {
      throw createHttpError(401, `No google token found for user email`);
    }

    if (tokens.googleTokens.expiry_date - new Date().valueOf() < 0) {
      throw createHttpError(401, `Google Token expired`);
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    oauth2Client.setCredentials(tokens.googleTokens);

    event.googleOAuth2Client = oauth2Client;
  };
}
