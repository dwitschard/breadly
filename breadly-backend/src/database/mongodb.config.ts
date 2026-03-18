export const MONGODB_CONFIG = {
    CONNECTION_STRING() {
        return `${process.env.DB_CONNECTION_STRING}`;
    },
    DB_NAME: 'breadly',
    COLLECTIONS: {
        RecipeCollection: 'recipe',
        TechnologyCollection: 'technology',
    },
};

export type DbCollectionType = keyof typeof MONGODB_CONFIG.COLLECTIONS;
