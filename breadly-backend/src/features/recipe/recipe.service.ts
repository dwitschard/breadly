import { ObjectId, UpdateFilter, WithId } from 'mongodb';
import { ApplicationDatabase } from '../../database/application-database';
import { RecipeDocument } from './recipe.document';
import { CreateRecipeDto, PatchRecipeDto, Recipe, UpdateRecipeDto } from './recipe.types';

const toRecipe = (doc: WithId<RecipeDocument>): Recipe => ({
  _id: doc._id.toHexString(),
  name: doc.name,
});

export const getAllRecipes = async (): Promise<Recipe[]> => {
  const docs = await getRecipeCollection().find({}).toArray();
  return docs.map(toRecipe);
};

export const getRecipeById = async (id: string): Promise<Recipe | null> => {
  const doc = await getRecipeCollection().findOne({ _id: new ObjectId(id) });
  return doc ? toRecipe(doc) : null;
};

export const saveRecipe = async (dto: CreateRecipeDto): Promise<Recipe> => {
  const result = await getRecipeCollection().insertOne({ name: dto.name });
  return { _id: result.insertedId.toHexString(), name: dto.name };
};

export const replaceRecipe = async (id: string, dto: UpdateRecipeDto): Promise<Recipe | null> => {
  const doc = await getRecipeCollection().findOneAndReplace(
    { _id: new ObjectId(id) },
    { name: dto.name },
    { returnDocument: 'after' },
  );
  return doc ? toRecipe(doc) : null;
};

export const patchRecipe = async (id: string, dto: PatchRecipeDto): Promise<Recipe | null> => {
  const update: UpdateFilter<RecipeDocument> = { $set: {} };

  if (dto.name !== undefined) {
    update.$set = { name: dto.name };
  }

  const doc = await getRecipeCollection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    update,
    { returnDocument: 'after' },
  );
  return doc ? toRecipe(doc) : null;
};

export const deleteRecipe = async (id: string): Promise<boolean> => {
  const result = await getRecipeCollection().deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
};

const getRecipeCollection = () => ApplicationDatabase.getCollections().RecipeCollection;
