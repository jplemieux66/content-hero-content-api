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
        width: {
          type: 'number',
        },
        height: {
          type: 'number',
        },
        duration: {
          type: 'string',
        },
        thumbnails: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key: {
                type: 'string',
              },
              url: {
                type: 'string',
              },
              width: {
                type: 'number',
              },
              height: {
                type: 'number',
              },
            },
          },
        },
      },
      required: [
        'fileName',
        'fileType',
        's3ContentId',
        's3ContentURL',
        'width',
        'height',
        'thumbnails',
      ],
    },
  },
};
