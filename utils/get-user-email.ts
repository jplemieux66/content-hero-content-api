import { APIGatewayProxyEvent } from 'aws-lambda';

export const getUserEmail = (event: APIGatewayProxyEvent): string => {
  if (!event['auth'] || !event['auth'].payload) {
    throw new Error('Event auth property is not set');
  }

  const namespace = process.env.AUTH0_NAMESPACE;
  const email = event['auth'].payload[namespace + '_email'];

  if (email === undefined) {
    throw new Error(`Couldn't find email in event auth info`);
  }

  return email;
};
