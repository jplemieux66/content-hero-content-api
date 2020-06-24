import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';

import { FileUpload } from '../../db/models/file-upload';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { log, LogLevel } from '../../utils/logger';
import { processVideo } from './services/process-video';

const internalHandler = async (event, _context) => {
  log('Process Video Request Received', LogLevel.Info);
  log('Stage: ' + process.env.STAGE, LogLevel.Info);

  const { s3ContentId, s3ContentURL, fileUploadId } = event.body as any;
  const urlParts = s3ContentURL.split('/');
  const path = urlParts[urlParts.length - 1];

  log('Request parsed', LogLevel.Info);

  try {
    await FileUpload.updateOne(
      {
        id: fileUploadId,
      },
      {
        status: 'Processing',
      },
    );

    const res = await processVideo(s3ContentId, path);

    log('Video successfully processed', LogLevel.Info);
    log(res, LogLevel.Info);

    await FileUpload.updateOne(
      {
        id: fileUploadId,
      },
      {
        status: 'Complete',
        processingResponse: res,
      },
    );
  } catch (e) {
    log('Error while processing video', LogLevel.Info);
    log(e, LogLevel.Error);

    await FileUpload.updateOne(
      {
        id: fileUploadId,
      },
      {
        status: 'Error',
        error: e,
      },
    );
  }
};

export const handler = middy(internalHandler)
  .use(httpErrorHandler())
  .use(new AuthMiddleware())
  .use(cors());
