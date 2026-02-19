import { MongoMemoryServer } from 'mongodb-memory-server';
import { MONGODB_CONFIG } from './src/database/mongodb.config';

declare global {
  // eslint-disable-next-line no-var
  var __MONGOINSTANCE: MongoMemoryServer | undefined;
}

export default async function globalSetup() {
  const instance = await MongoMemoryServer.create({
    instance: {
      dbName: MONGODB_CONFIG.DB_NAME,
    },
  });

  global.__MONGOINSTANCE = instance;

  process.env.MONGO_URI = instance.getUri();
  process.env.DB_NAME = MONGODB_CONFIG.DB_NAME;
}
