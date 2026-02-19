export const MONGODB_CONFIG = {
  CONNECTION_STRING: () =>
    `mongodb+srv://hslu-weblab:${process.env.DB_PASSWORD}@weblab-mongodb.1wenupb.mongodb.net/?retryWrites=true&w=majority&appName=weblab-mongodb`,
  DB_NAME: 'techradar',
  COLLECTIONS: {
    TechnologyCollection: 'technologies',
  },
};

export type DbCollectionType = keyof typeof MONGODB_CONFIG.COLLECTIONS;