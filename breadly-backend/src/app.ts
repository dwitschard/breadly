import express from 'express';
import {operationController} from './features/operation/operation.controller.js';
import {globalErrorHandler} from "./middleware/error.middleware.js";

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

app.use('/', operationController);
// app.use('/technologies', technologyController);
// app.use('/recipe', recipeController);

app.use(globalErrorHandler);

export {app};
