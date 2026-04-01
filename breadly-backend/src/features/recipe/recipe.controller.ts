import {Request, Response, Router} from 'express';
import {
    deleteRecipe,
    getAllRecipes,
    getRecipeById,
    patchRecipe,
    replaceRecipe,
    saveRecipe,
} from './recipe.service.js';
import { CreateRecipeDto, PatchRecipeDto, UpdateRecipeDto } from '../../app/generated/api/index.js';
import {validate} from '../../common/validation.middleware.js';
import {
    CreateRecipeDtoSchema,
    UpdateRecipeDtoSchema,
    PatchRecipeDtoSchema,
} from '../../common/validation-schemas.js';

const recipeController = Router();

recipeController.get('/', async (_: Request, res: Response) => {
    res.status(200).json(await getAllRecipes());
});

recipeController.post(
    '/',
    validate(CreateRecipeDtoSchema),
    async (req: Request<Record<string, never>, unknown, CreateRecipeDto>, res: Response) => {
        const created = await saveRecipe(req.body);
        res.status(201).json(created);
    },
);

recipeController.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
    const result = await getRecipeById(req.params.id);
    if (result) {
        res.status(200).json(result);
    } else {
        res.status(404).json({message: 'Recipe not found', statusCode: 404});
    }
});

recipeController.put(
    '/:id',
    validate(UpdateRecipeDtoSchema),
    async (req: Request<{ id: string }, unknown, UpdateRecipeDto>, res: Response) => {
        const result = await replaceRecipe(req.params.id, req.body);
        if (result) {
            res.status(200).json(result);
        } else {
            res.status(404).json({message: 'Recipe not found', statusCode: 404});
        }
    },
);

recipeController.patch(
    '/:id',
    validate(PatchRecipeDtoSchema),
    async (req: Request<{ id: string }, unknown, PatchRecipeDto>, res: Response) => {
        const result = await patchRecipe(req.params.id, req.body);
        if (result) {
            res.status(200).json(result);
        } else {
            res.status(404).json({message: 'Recipe not found', statusCode: 404});
        }
    },
);

recipeController.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
    const deleted = await deleteRecipe(req.params.id);
    if (deleted) {
        res.status(204).end();
    } else {
        res.status(404).json({message: 'Recipe not found', statusCode: 404});
    }
});

export {recipeController};
