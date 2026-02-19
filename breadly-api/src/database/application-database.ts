import { Collection, Db, MongoClient } from 'mongodb';
import { DbCollectionType, MONGODB_CONFIG } from './mongodb.config';

export type DbCollections = {
  [K in DbCollectionType]: Collection;
};

export class ApplicationDatabase {
  private static db: Db | null = null;
  private static client: MongoClient | null = null;

  static async init(connectionString: string, dbName: string): Promise<void> {
    if (!ApplicationDatabase.db) {
      ApplicationDatabase.client = await MongoClient.connect(connectionString);
      ApplicationDatabase.db = ApplicationDatabase.client.db(dbName);
    }
  }

  static getCollections(): DbCollections {
    if (!ApplicationDatabase.db) {
      throw new Error('DB not initialized');
    }

    const collections : DbCollections = {} as DbCollections;

    for (const key in MONGODB_CONFIG.COLLECTIONS) {
      const collectionKey = key as DbCollectionType;
      const collectionString = MONGODB_CONFIG.COLLECTIONS[collectionKey];
      collections[collectionKey] =
        ApplicationDatabase.db.collection(collectionString);
    }

    return collections;
  }

  static async close(): Promise<void> {
    if (ApplicationDatabase.client) {
      await ApplicationDatabase.client.close();

      ApplicationDatabase.client = null;
      ApplicationDatabase.db = null;
    }
  }
}
