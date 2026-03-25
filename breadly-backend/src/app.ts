import express from 'express';
import {operationController} from './features/operation/operation.controller.js';
import {globalErrorHandler} from "./middleware/error.middleware.js";
import {technologyController} from "./features/technology/technology.controller.js";
import {recipeController} from "./features/recipe/recipe.controller.js";
import {profileController} from "./features/profile/profile.controller.js";
import {requireAuth} from "./middleware/auth.middleware.js";

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

app.use('/', operationController);
app.use('/technologies', technologyController);
app.use('/recipe', recipeController);
app.use('/profile', requireAuth, profileController);

app.use(globalErrorHandler);

export {app};
