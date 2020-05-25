import mongoose from 'mongoose';

export const initDatabase = () => {
  mongoose.connect(
    process.env.IS_OFFLINE
      ? process.env.MONGODB_OFFLINE_CONNECTION_STRING
      : process.env.MONGODB_CONNECTION_STRING,
    {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
    },
  );
};
