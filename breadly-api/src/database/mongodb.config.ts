export const MONGODB_CONFIG = {
    CONNECTION_STRING: () => {
        const connectionString = `mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_URI}/?retryWrites=true&w=majority&appName=breadly-api`;
        console.log(connectionString);
        return connectionString;
    },
    DB_NAME: 'breadly',
    COLLECTIONS: {
        RecipeCollection: 'recipe',
    },
};

export type DbCollectionType = keyof typeof MONGODB_CONFIG.COLLECTIONS;