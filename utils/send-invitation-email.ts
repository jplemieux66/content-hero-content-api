import AWS from 'aws-sdk';

export const sendInvitationEmail = (
  projectName: string,
  requestUserEmail: string,
): Promise<AWS.SES.SendEmailResponse> => {
  // Create sendEmail params
  const params = {
    Destination: {
      ToAddresses: ['phillemieux66@hotmail.com'],
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: `
            <p>${requestUserEmail} has invited to join the project '${projectName}'</p>
            <p>Sign in or sign up here to start collaborating: <a href="https://d2xo5t0dwooh2b.cloudfront.net">https://d2xo5t0dwooh2b.cloudfront.net</a></p>
          `,
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: `Content Star - You've been invited to join a project`,
      },
    },
    Source: 'jeanphilippelemieux66+contenthero@gmail.com',
  };

  return new AWS.SES({
    apiVersion: '2010-12-01',
  })
    .sendEmail(params)
    .promise();
};
