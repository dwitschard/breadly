import { ObjectId, Collection } from 'mongodb';
import { RecipeModel } from './recipe.model.js';
import {
  getAllRecipes,
  getRecipeById,
  saveRecipe,
  replaceRecipe,
  patchRecipe,
  deleteRecipe,
} from './recipe.service.js';
import { ApplicationDatabase } from '../../database/application-database.js';

describe('recipe.service', () => {
  let collection: Collection<RecipeModel>;

  beforeEach(async () => {
    collection = ApplicationDatabase.getCollections().RecipeCollection;
    await collection.deleteMany({});
  });

  describe('getAllRecipes', () => {
    it('returns empty array when no recipes exist', async () => {
      const result = await getAllRecipes();
      expect(result).toEqual([]);
    });

    it('returns all recipes mapped to API shape', async () => {
      await collection.insertMany([{ name: 'Recipe A' }, { name: 'Recipe B' }]);
      const result = await getAllRecipes();
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name', 'Recipe A');
      expect(result[1]).toHaveProperty('name', 'Recipe B');
    });
  });

  describe('getRecipeById', () => {
    it('returns the recipe when found', async () => {
      const { insertedId } = await collection.insertOne({ name: 'Found Me' });
      const result = await getRecipeById(insertedId.toHexString());
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Found Me');
      expect(result!.id).toBe(insertedId.toHexString());
    });

    it('returns null when not found', async () => {
      const result = await getRecipeById(new ObjectId().toHexString());
      expect(result).toBeNull();
    });

    it('throws for invalid ObjectId string', async () => {
      await expect(getRecipeById('not-an-id')).rejects.toThrow();
    });
  });

  describe('saveRecipe', () => {
    it('inserts a new recipe and returns it', async () => {
      const result = await saveRecipe({ name: 'New Recipe' });
      expect(result.name).toBe('New Recipe');
      expect(result.id).toBeDefined();

      const doc = await collection.findOne({ _id: new ObjectId(result.id) });
      expect(doc).not.toBeNull();
      expect(doc!.name).toBe('New Recipe');
    });
  });

  describe('replaceRecipe', () => {
    it('replaces an existing recipe', async () => {
      const { insertedId } = await collection.insertOne({ name: 'Original' });
      const result = await replaceRecipe(insertedId.toHexString(), { name: 'Replaced' });
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Replaced');
    });

    it('returns null for non-existing recipe', async () => {
      const result = await replaceRecipe(new ObjectId().toHexString(), { name: 'Ghost' });
      expect(result).toBeNull();
    });
  });

  describe('patchRecipe', () => {
    it('partially updates an existing recipe', async () => {
      const { insertedId } = await collection.insertOne({ name: 'Original' });
      const result = await patchRecipe(insertedId.toHexString(), { name: 'Patched' });
      expect(result).not.toBeNull();
      expect(result!.name).toBe('Patched');
    });

    it('returns null for non-existing recipe', async () => {
      const result = await patchRecipe(new ObjectId().toHexString(), { name: 'Ghost' });
      expect(result).toBeNull();
    });
  });

  describe('deleteRecipe', () => {
    it('deletes an existing recipe and returns true', async () => {
      const { insertedId } = await collection.insertOne({ name: 'Delete Me' });
      const result = await deleteRecipe(insertedId.toHexString());
      expect(result).toBe(true);

      const doc = await collection.findOne({ _id: insertedId });
      expect(doc).toBeNull();
    });

    it('returns false for non-existing recipe', async () => {
      const result = await deleteRecipe(new ObjectId().toHexString());
      expect(result).toBe(false);
    });
  });
});
