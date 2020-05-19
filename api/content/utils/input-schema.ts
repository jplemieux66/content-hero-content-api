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
        s3ContentPath: {
          type: 'string',
        },
        s3ThumbnailPath: {
          type: 'string',
        },
      },
      required: [
        'fileName',
        'fileType',
        's3ContentId',
        's3ContentPath',
        's3ThumbnailPath',
      ],
    },
  },
};
