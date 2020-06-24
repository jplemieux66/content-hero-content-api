import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';
import { APIGatewayProxyHandler } from 'aws-lambda';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

import { AuthMiddleware } from '../../../content-management/utils/auth-middleware';

const internalHandler: APIGatewayProxyHandler = async (event, _context) => {
  const { extension, type } = event.body as any;

  const id = uuidv4();
  const path = id + '.' + extension;
  const url = `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${path}`;

  const uploadOptions = {
    region: 'us-east-1',
    endpoint: `${process.env.S3_BUCKET}.s3-accelerate.amazonaws.com`,
    useAccelerateEndpoint: true,
  };

  const s3 = new AWS.S3(uploadOptions);

  const s3Params = {
    Bucket: process.env.S3_BUCKET,
    Key: path,
    ContentType: type,
    ContentDisposition: type.includes('image') ? 'attachment' : undefined,
    ACL: 'public-read',
    Expires: 14400,
  };

  const uploadURL = s3.getSignedUrl('putObject', s3Params);

  return {
    statusCode: 200,
    body: JSON.stringify({ uploadURL, s3ContentId: path, s3ContentURL: url }),
  };
};

export const handler = middy(internalHandler)
  .use(jsonBodyParser())
  .use(httpErrorHandler())
  .use(new AuthMiddleware())
  .use(cors());
