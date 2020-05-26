import dotenv from 'dotenv';
import axios from 'axios';
import qs from 'querystring';

dotenv.config({ path: 'config/.env.test' });

export const getToken = async (
  email: string,
  password: string,
): Promise<string> => {
  const data = {
    grant_type: 'password',
    username: email,
    password: password,
    audience: process.env.AUTH0_AUDIENCE,
    scope: 'openid email profile',
    client_id: process.env.AUTH0_CLIENT_ID,
    client_secret: process.env.AUTH0_CLIENT_SECRET,
  };

  const config = {
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
  };

  const auth0res = await axios.post(
    'https://content-hero-jp.auth0.com/oauth/token',
    qs.stringify(data),
    config,
  );
  return auth0res.data.access_token;
};
