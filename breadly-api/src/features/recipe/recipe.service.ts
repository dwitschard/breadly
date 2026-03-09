import {ApplicationDatabase} from "../../database/application-database";
import {Recipe} from "./recipe.types";

export const getAllRecipes = async () => {
    return getTechnologyCollection().find({}).toArray();
};

export const saveRecipe = async (recipe: Recipe) => {
    return await getTechnologyCollection().insertOne(recipe);
};

const getTechnologyCollection = () =>
    ApplicationDatabase.getCollections().RecipeCollection;
