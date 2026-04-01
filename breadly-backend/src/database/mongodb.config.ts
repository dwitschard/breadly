export const MONGODB_CONFIG = {
    CONNECTION_STRING() {
        return `${process.env.MONGODB_CONNECTION_STRING}`;
    },
    DB_NAME: 'breadly',
    COLLECTIONS: {
        RecipeCollection: 'recipe',
    },
};

export type DbCollectionType = keyof typeof MONGODB_CONFIG.COLLECTIONS;
