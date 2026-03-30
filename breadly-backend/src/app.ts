import express from 'express';
import {operationController} from './features/operation/operation.controller.js';
import {globalErrorHandler} from "./middleware/error.middleware.js";
import {technologyController} from "./features/technology/technology.controller.js";
import {recipeController} from "./features/recipe/recipe.controller.js";
import {profileController} from "./features/profile/profile.controller.js";
import {publicController} from "./features/public/public.controller.js";
import {requireAuth} from "./middleware/auth.middleware.js";
import {previewPathMiddleware} from "./middleware/preview-path.middleware.js";

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Strip /preview/<slug> prefix when running as a preview Lambda.
// Must be registered before all route handlers so they receive clean paths.
app.use(previewPathMiddleware());

app.use('/', operationController);
app.use('/public', publicController);
app.use('/technologies', requireAuth(), technologyController);
app.use('/recipe', requireAuth(), recipeController);
app.use('/profile', requireAuth(), profileController);

app.use(globalErrorHandler);

export {app};
