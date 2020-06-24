import 'source-map-support/register';

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpErrorHandler from '@middy/http-error-handler';
import jsonBodyParser from '@middy/http-json-body-parser';

import { FileUpload } from '../../db/models/file-upload';
import { AuthMiddleware } from '../../utils/auth-middleware';
import { log, LogLevel } from '../../utils/logger';
import { processPhoto } from './services/process-photo';

const internalHandler = async (event, _context) => {
  const { s3ContentId, fileUploadId } = event.body as any;

  try {
    log('Processing Photo', LogLevel.Info);

    await FileUpload.updateOne(
      {
        id: fileUploadId,
      },
      {
        status: 'Processing',
      },
    );

    const res = await processPhoto(s3ContentId);

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
    log('Error while processing Photo', LogLevel.Info);
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
