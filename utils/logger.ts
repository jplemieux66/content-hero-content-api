import Rollbar from 'rollbar';

const rollbar = new Rollbar({
  accessToken: 'b85b58f01d1c4d32bbfaab6d532aad92',
  captureUncaught: true,
  captureUnhandledRejections: true,
});

export enum LogLevel {
  Info = 'Info',
  Error = 'Error',
}

export const log = (obj: any, level: LogLevel) => {
  if (level === LogLevel.Info) {
    if (typeof obj === 'object') {
      console.log(JSON.stringify(obj));
    } else {
      console.log(obj);
    }

    if (process.env.ROLLBAR === 'TRUE') {
      rollbar.log(obj);
    }
  } else {
    if (typeof obj === 'object') {
      console.error(JSON.stringify(obj));
    } else {
      console.error(obj);
    }

    if (process.env.ROLLBAR === 'TRUE') {
      rollbar.error(obj);
    }
  }
};
