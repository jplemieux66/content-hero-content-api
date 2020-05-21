export const inputSchema = {
  type: 'object',
  properties: {
    body: {
      type: 'object',
      properties: {
        fileName: {
          type: 'string',
        },
        fileType: {
          type: 'string',
        },
        s3ContentId: {
          type: 'string',
        },
        s3ContentURL: {
          type: 'string',
        },
        s3ThumbnailURL: {
          type: 'string',
        },
        thumbnailWidth: {
          type: 'number',
        },
        thumbnailHeight: {
          type: 'number',
        },
      },
      required: [
        'fileName',
        'fileType',
        's3ContentId',
        's3ContentURL',
        's3ThumbnailURL',
        'thumbnailWidth',
        'thumbnailHeight',
      ],
    },
  },
};
