import express from 'express';
import { pinoHttp } from 'pino-http';
import {operationController} from './features/operation/operation.controller.js';
import {globalErrorHandler} from './middleware/error.middleware.js';
import {recipeController} from './features/recipe/recipe.controller.js';
import {profileController} from './features/profile/profile.controller.js';
import {publicController} from './features/public/public.controller.js';
import {requireAuth} from './middleware/auth.middleware.js';
import {previewPathMiddleware} from './middleware/preview-path.middleware.js';
import {logger} from './common/logger.js';

const app = express();

app.use(express.json());

app.use(pinoHttp({ logger }));

app.use(previewPathMiddleware());

app.use('/api', operationController);
app.use('/api/public', publicController);
app.use('/api/recipes', requireAuth(), recipeController);
app.use('/api/profile', requireAuth(), profileController);

app.use(globalErrorHandler);

export {app};
