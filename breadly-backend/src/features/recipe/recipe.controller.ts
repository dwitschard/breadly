import {Request, Response, Router} from 'express';
import {
    deleteRecipe,
    getAllRecipes,
    getRecipeById,
    patchRecipe,
    replaceRecipe,
    saveRecipe,
} from './recipe.service.js';
import {CreateRecipeDto, UpdateRecipeDto, PatchRecipeDto} from "../../app/generated/api/index.js";

const recipeController = Router();

// GET /recipe — list all recipes
recipeController.get('/', async (_: Request, res: Response) => {
    res.status(200).json(await getAllRecipes());
});

// POST /recipe — create a recipe
recipeController.post(
    '/',
    async (req: Request<Record<string, never>, unknown, CreateRecipeDto>, res: Response) => {
        const created = await saveRecipe(req.body);
        res.status(201).json(created);
    },
);

// GET /recipe/:id — get a recipe by ID
recipeController.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
    const result = await getRecipeById(req.params.id);
    if (result) {
        res.status(200).json(result);
    } else {
        res.status(404).json({message: 'Recipe not found'});
    }
});

// PUT /recipe/:id — fully replace a recipe
recipeController.put(
    '/:id',
    async (req: Request<{ id: string }, unknown, UpdateRecipeDto>, res: Response) => {
        const result = await replaceRecipe(req.params.id, req.body);
        if (result) {
            res.status(200).json(result);
        } else {
            res.status(404).json({message: 'Recipe not found'});
        }
    },
);

// PATCH /recipe/:id — partially update a recipe
recipeController.patch(
    '/:id',
    async (req: Request<{ id: string }, unknown, PatchRecipeDto>, res: Response) => {
        const result = await patchRecipe(req.params.id, req.body);
        if (result) {
            res.status(200).json(result);
        } else {
            res.status(404).json({message: 'Recipe not found'});
        }
    },
);

// DELETE /recipe/:id — delete a recipe
recipeController.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
    const deleted = await deleteRecipe(req.params.id);
    if (deleted) {
        res.status(204).end();
    } else {
        res.status(404).json({message: 'Recipe not found'});
    }
});

export {recipeController};
