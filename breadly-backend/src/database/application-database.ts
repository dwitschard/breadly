import { Collection, Db, MongoClient } from 'mongodb';
import { DbCollectionType, MONGODB_CONFIG } from './mongodb.config.js';
import { RecipeModel } from '../features/recipe/recipe.model.js';
import { TechnologyDocument } from '../features/technology/technology.document.js';

export type DbCollections = {
  RecipeCollection: Collection<RecipeModel>;
  TechnologyCollection: Collection<TechnologyDocument>;
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
    const db = ApplicationDatabase.db;
    if (!db) {
      throw new Error('DB not initialized');
    }

    return {
      RecipeCollection: db.collection<RecipeModel>(MONGODB_CONFIG.COLLECTIONS.RecipeCollection),
      TechnologyCollection: db.collection<TechnologyDocument>(MONGODB_CONFIG.COLLECTIONS.TechnologyCollection),
    };
  }

  static async ping(): Promise<boolean> {
    try {
      const db = ApplicationDatabase.db;
      if (!db) return false;
      await db.command({ ping: 1 });
      return true;
    } catch {
      return false;
    }
  }

  static async close(): Promise<void> {
    if (ApplicationDatabase.client) {
      await ApplicationDatabase.client.close();

      ApplicationDatabase.client = null;
      ApplicationDatabase.db = null;
    }
  }
}

// Ensure DbCollections covers every key in DbCollectionType (compile-time check)
 
export type AssertAllCollectionsCovered = DbCollections extends Record<DbCollectionType, Collection> ? true : never;
