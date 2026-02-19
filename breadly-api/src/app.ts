import express from 'express';
import { globalErrorHandler } from './middleware/error.middleware';
import { technologyController } from './features/technology/technology.controller';
import { operationController } from './features/operation/operation.controller';

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

app.use('/', operationController);
app.use('/technologies', technologyController);

app.use(globalErrorHandler);

export { app };
