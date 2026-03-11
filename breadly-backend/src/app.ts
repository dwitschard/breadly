import express from 'express';
import {globalErrorHandler} from './middleware/error.middleware.js';
import {technologyController} from './features/technology/technology.controller.js';
import {operationController} from './features/operation/operation.controller.js';
import {recipeController} from "./features/recipe/recipe.controller.js";

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

app.use('/', operationController);
app.use('/technologies', technologyController);
app.use('/recipe', recipeController);

app.use(globalErrorHandler);

export {app};
