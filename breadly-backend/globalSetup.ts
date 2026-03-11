import { MongoMemoryServer } from 'mongodb-memory-server';

declare global {
  // eslint-disable-next-line no-var
  var __MONGOINSTANCE: MongoMemoryServer | undefined;
}

export default async function globalSetup() {
  const instance = await MongoMemoryServer.create({
    instance: {
      dbName: 'breadly',
    },
  });

  global.__MONGOINSTANCE = instance;

  process.env.MONGO_URI = instance.getUri();
  process.env.DB_NAME = 'breadly';
}
