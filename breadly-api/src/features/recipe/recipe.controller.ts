import {Request, Response, Router} from "express";
import {getAllTechnologies} from "../technology/technology.service";
import {saveRecipe} from "./recipe.service";
import {Recipe} from "./recipe.types";

const recipeController = Router();

recipeController.get('/', async (_: Request, res: Response) =>
    res.status(200).json(await getAllTechnologies()),
);

recipeController.post('/', async (req: Request, res: Response) => {
    const persistedRecipe = await saveRecipe(req.body as Recipe);

    res.status(200).json(persistedRecipe);
});


export {recipeController}