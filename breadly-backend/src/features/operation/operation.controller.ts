import express, { Router } from 'express';
import { ApplicationError } from '../../domain/error.types.js';
import { ApplicationDatabase } from '../../database/application-database.js';
import { HealthResponse, HealthResponseStatusEnum, HealthCheckStatusEnum } from '../../app/generated/api/index.js';

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

operationController.get('/health', async (_req: express.Request, res: express.Response) => {
  const dbOk = await ApplicationDatabase.ping();

  const status = dbOk ? HealthResponseStatusEnum.Ok : HealthResponseStatusEnum.Degraded;

  const response: HealthResponse = {
    status,
    checks: {
      api: {
        status: HealthCheckStatusEnum.Ok,
        responseTime: undefined,
      },
      database: {
        status: dbOk ? HealthCheckStatusEnum.Ok : HealthCheckStatusEnum.Degraded,
        responseTime: undefined,
      },
    },
  };

  res.json(response);
});

export { operationController };
