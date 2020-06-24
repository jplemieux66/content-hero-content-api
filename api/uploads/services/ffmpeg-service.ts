import 'source-map-support/register';

import ffmpeg, { FfprobeStream } from 'fluent-ffmpeg';

ffmpeg.setFfmpegPath('/opt/ffmpeg/ffmpeg');
ffmpeg.setFfprobePath('/opt/ffmpeg/ffprobe');

export const getVideoMetadata = (target: string): Promise<FfprobeStream> => {
  return new Promise((resolve, reject) => {
    ffmpeg(target).ffprobe((err, data) => {
      if (err) {
        return reject(err);
      }
      return resolve(data.streams.find((s) => s.width));
    });
  });
};

export const createThumbnailsFromVideo = (
  target: string,
  width: number,
  height: number,
  count: number,
) => {
  return new Promise((resolve, reject) => {
    ffmpeg(target)
      .on('end', function () {
        resolve();
      })
      .on('error', function (err) {
        console.log(__filename);
        reject(err);
      })
      .screenshots({
        count,
        folder: process.env.IS_OFFLINE
          ? '/Users/jean-philippelemieux/tmp/'
          : '/tmp/',
        filename: `thumbnail-%i.png`,
        size: `${width}x${height}`,
      });
  });
};
