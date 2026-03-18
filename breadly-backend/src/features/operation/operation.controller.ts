import express, { Router } from 'express';
import { ApplicationError } from '../../domain/error.types.js';
import { ApplicationDatabase } from '../../database/application-database.js';

const operationController = Router();

operationController.get('/client-error', () => {
  throw new ApplicationError('Custom Error- 400!', 400);
});

operationController.get('/application-error', () => {
  throw new ApplicationError('Custom Error - 450!', 450);
});

operationController.get('/generic-error', () => {
  throw new Error('Something went terribly wrong!');
});

operationController.get('/health', async (req: express.Request, res: express.Response) => {
  const dbOk = await ApplicationDatabase.ping();

  const status = dbOk ? 'ok' : 'degraded';

  res.json({
    status,
    checks: {
      api: {
        status: 'ok',
        message: 'Breadly API v1.0.0',
      },
      database: {
        status: dbOk ? 'ok' : 'error',
        message: dbOk ? 'Connected' : 'Unreachable',
      },
    },
  });
});

export { operationController };
