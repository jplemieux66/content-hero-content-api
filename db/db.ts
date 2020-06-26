import mongoose from 'mongoose';

import { log, LogLevel } from '../utils/logger';

let isConnected;

export const initDatabase = (): Promise<void> => {
  log('Connect to Database', LogLevel.Info);

  if (isConnected) {
    log('Re-using existing database connection', LogLevel.Info);
    return Promise.resolve();
  }

  log('Creating new database connection', LogLevel.Info);
  return mongoose
    .connect(
      process.env.IS_OFFLINE
        ? process.env.MONGODB_OFFLINE_CONNECTION_STRING
        : process.env.MONGODB_CONNECTION_STRING,
      {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
        poolSize: 10,
      },
    )
    .then((db) => {
      isConnected = db.connections[0].readyState;
    });
};

export const disconnectDatabase = () => {
  log('Disconnect from Database', LogLevel.Info);
  return mongoose.disconnect();
};
