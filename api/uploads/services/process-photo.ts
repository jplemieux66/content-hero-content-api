import 'source-map-support/register';

import AWS from 'aws-sdk';
import sharp from 'sharp';

import { log, LogLevel } from '../../../utils/logger';
import { Thumbnail } from '../utils/shared-models';
import { MAX_WIDTH } from '../utils/calculate-max-width-and-height';

export interface ProcessPhotoResponse {
  width: number;
  height: number;
  thumbnails: Thumbnail[];
}
export const processPhoto = async (
  id: string,
): Promise<ProcessPhotoResponse> => {
  log('Processing Photo', LogLevel.Info);

  const s3 = new AWS.S3();

  const getParams = {
    Bucket: process.env.S3_BUCKET,
    Key: id,
  };

  const s3Object = await s3.getObject(getParams).promise();

  log('Creating Thumbnail', LogLevel.Info);
  const image = s3Object.Body as Buffer;

  const originalImageBuffer = await sharp(image).rotate().toBuffer();
  const originalImageMetadata = await sharp(originalImageBuffer).metadata();

  const resizedImage = await sharp(image)
    .rotate()
    .resize(MAX_WIDTH)
    .toFormat('png')
    .toBuffer();

  const resizedImageMetadata = await sharp(resizedImage).metadata();

  const thumbnailPath = id + '_thumbnail1.png';

  log('Uploading Thumbnail', LogLevel.Info);

  const putParams = {
    Bucket: process.env.S3_BUCKET,
    Key: thumbnailPath,
    Body: resizedImage,
    ACL: 'public-read',
  };

  await s3.putObject(putParams).promise();

  log('Uploaded Thumbnails', LogLevel.Info);

  const res = {
    width: originalImageMetadata.width,
    height: originalImageMetadata.height,
    thumbnails: [
      {
        key: thumbnailPath,
        url: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${thumbnailPath}`,
        width: resizedImageMetadata.width,
        height: resizedImageMetadata.height,
      },
    ],
  };

  log(res, LogLevel.Info);

  return res;
};
