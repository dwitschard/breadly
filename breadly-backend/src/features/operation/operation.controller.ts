import express, { Router } from 'express';
import { ApplicationError } from '../../domain/error.types';

const operationController = Router();

operationController.get('/application-error', () => {
  throw new ApplicationError('Custom Error!', 799);
});

operationController.get('/generic-error', () => {
  throw new Error('Something went terribly wrong!');
});

operationController.get(
  '/ping',
  (req: express.Request, res: express.Response): express.Response =>
    res.json('pong'),
);

export { operationController };
