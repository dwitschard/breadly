import supertest from 'supertest';
import { app } from '../../app.js';

jest.mock('../../database/dynamodb.client.js', () => ({
  ...jest.requireActual('../../database/dynamodb.client.js'),
  pingDynamoDB: jest.fn().mockResolvedValue(true),
  getDynamoClient: jest.fn(),
  tableName: jest.fn().mockReturnValue('breadly-local'),
}));

const request = supertest(app);

describe('Operation Controller', () => {

  it('should respond with message in json format for application error', async () => {
    const response = await request.get('/api/application-error');

    expect(response.status).toEqual(450);
    expect(response.body).toEqual({ message: 'Custom Error - 450!', statusCode: 450 });
  });

  it('should respond with message in json format for client error', async () => {
    const response = await request.get('/api/client-error');

    expect(response.status).toEqual(400);
    expect(response.body).toEqual({ message: 'Custom Error- 400!', statusCode: 400 });
  });

  it('should respond with message in json format for generic error', async () => {
    const response = await request.get('/api/generic-error');

    expect(response.status).toEqual(500);
    expect(response.body).toEqual({ message: 'Something went terribly wrong!', statusCode: 500 });
  });

  it('should return health status', async () => {
    const response = await request.get('/api/health');

    expect(response.status).toEqual(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('checks.api.status', 'ok');
    expect(response.body).toHaveProperty('checks.mongodb');
    expect(response.body).toHaveProperty('checks.dynamodb');
  });

  it('should return version info', async () => {
    const response = await request.get('/api/version');

    expect(response.status).toEqual(200);
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('releaseUrl');
  });

});
