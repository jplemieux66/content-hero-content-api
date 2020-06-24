import 'source-map-support/register';

import AWS from 'aws-sdk';
import { createReadStream } from 'fs';

import { log, LogLevel } from '../../../utils/logger';
import { calculateWidthAndHeight } from '../utils/calculate-max-width-and-height';
import { Thumbnail } from '../utils/shared-models';
import { createThumbnailsFromVideo, getVideoMetadata } from './ffmpeg-service';

const numberOfThumbnails = 3;
const allowedTypes = ['mov', 'mpg', 'mpeg', 'mp4', 'wmv', 'avi', 'webm'];

export interface ProcessVideoResponse {
  width: number;
  height: number;
  duration: string;
  thumbnails: Thumbnail[];
}
export const processVideo = async (
  id: string,
  path: string,
): Promise<ProcessVideoResponse> => {
  log('Start video processing', LogLevel.Info);

  const s3 = new AWS.S3();
  const s3Params = {
    Bucket: process.env.S3_BUCKET,
    Key: id,
  };
  const target = s3.getSignedUrl('getObject', s3Params);

  const fileType = path.split('.').pop().toLowerCase();

  if (allowedTypes.indexOf(fileType) === -1) {
    throw new Error(`Filetype: ${fileType} is not an allowed type`);
  }

  log('Get Video Metadata', LogLevel.Info);
  const metadata = await getVideoMetadata(target);
  const width = metadata.width;
  const height = metadata.height;
  const {
    width: thumbnailWidth,
    height: thumbnailHeight,
  } = calculateWidthAndHeight({
    width,
    height,
  });

  log('Create Thumbnails', LogLevel.Info);
  await createThumbnailsFromVideo(
    target,
    thumbnailWidth,
    thumbnailHeight,
    numberOfThumbnails,
  );

  log('Successfully Created Thumbnails', LogLevel.Info);
  const thumbnailKeys: string[] = [];
  for (let i = 1; i < numberOfThumbnails; i++) {
    const tempPath = process.env.IS_OFFLINE
      ? '/Users/jean-philippelemieux/tmp/'
      : '/tmp/';
    const key = await uploadToS3(
      `${tempPath}thumbnail-${i}.png`,
      `${id}_thumbnail-${i}.png`,
    );
    thumbnailKeys.push(key);
  }

  log('Successfully Uploaded Thumbnails', LogLevel.Info);

  const res = {
    width,
    height,
    duration: metadata.duration,
    thumbnails: thumbnailKeys.map((t) => ({
      key: t,
      url: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${t}`,
      width: thumbnailWidth,
      height: thumbnailHeight,
    })),
  };

  log('Response:', LogLevel.Info);
  log(res, LogLevel.Info);

  return res;
};

const uploadToS3 = async (
  localPath: string,
  s3Path: string,
): Promise<string> => {
  const uploadOptions = {
    region: 'us-east-1',
    endpoint: `${process.env.S3_BUCKET}.s3-accelerate.amazonaws.com`,
    useAccelerateEndpoint: true,
  };
  const s3 = new AWS.S3(uploadOptions);

  let tmpFile = createReadStream(localPath);

  var params: AWS.S3.PutObjectRequest = {
    Bucket: process.env.S3_BUCKET,
    Key: s3Path,
    Body: tmpFile,
    ContentType: `image/png`,
    ACL: 'public-read',
  };

  const res = await s3.upload(params).promise();
  return res.Key;
};
