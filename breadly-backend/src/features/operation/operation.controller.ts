import express, { Router } from 'express';
import { ApplicationError } from '../../domain/error.types.js';
import { ApplicationDatabase } from '../../database/application-database.js';
import { getVersionInfo } from './version.reader.js';
import { HealthResponse } from '../../app/generated/api/index.js';
import { pingDynamoDB } from '../../database/dynamodb.client.js';

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
  const [mongoOk, dynamoOk] = await Promise.all([
    ApplicationDatabase.ping(),
    pingDynamoDB(),
  ]);

  const status = mongoOk && dynamoOk ? 'ok' : 'degraded';

  const response: HealthResponse = {
    status,
    checks: {
      api: { status: 'ok', responseTime: undefined },
      mongodb: { status: mongoOk ? 'ok' : 'degraded', responseTime: undefined },
      dynamodb: { status: dynamoOk ? 'ok' : 'degraded', responseTime: undefined },
    },
  };

  res.json(response);
});

operationController.get('/version', async (_req: express.Request, res: express.Response) => {
  const versionInfo = await getVersionInfo();
  res.json(versionInfo);
});

export { operationController };
