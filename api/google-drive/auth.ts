import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { google } from 'googleapis';

import { initDatabase } from '../../db/db';
import { Tokens, ITokens } from '../../db/models/tokens';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { getUserEmail } from '../../utils/get-user-email';

initDatabase();

const auth: APIGatewayProxyHandler = async (event, _context) => {
  _context.callbackWaitsForEmptyEventLoop = false;
  const { code, redirectURL } = event.body as any;
  const userEmail = getUserEmail(event);

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectURL,
    );
    const { tokens } = await oauth2Client.getToken(code);

    const existingTokens = await Tokens.findOne({ email: userEmail });
    if (existingTokens) {
      await Tokens.updateOne(
        { id: existingTokens._id },
        {
          tokens,
        },
      );
    } else {
      const doc: ITokens = {
        email: userEmail,
        googleTokens: tokens,
      };
      await new Tokens(doc).save();
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        accessToken: tokens.access_token,
      }),
    };
  } catch (e) {
    console.error(e.message || e);
    return {
      statusCode: e.statusCode || 501,
      headers: { 'Content-Type': 'text/plain' },
      body: e.message || "Couldn't create the item.",
    };
  }
};

export const handler = middy(auth)
  .use(jsonBodyParser())
  .use(httpErrorHandler())
  .use(new AuthMiddleware())
  .use(cors());
