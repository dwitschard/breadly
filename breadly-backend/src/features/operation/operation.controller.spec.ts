import supertest from 'supertest';
import { app } from '../../app.js';

const request = supertest(app);

describe('Operation Controller', () => {

  it('should respond with message in json format for application error', async () => {
    const response = await request.get('/api/application-error');

    expect(response.status).toEqual(450);
    expect(response.body).toEqual({ error: 'Custom Error - 450!' });
  });

  it('should respond with message in json format for client error', async () => {
    const response = await request.get('/api/client-error');

    expect(response.status).toEqual(400);
    expect(response.body).toEqual({ error: 'Custom Error- 400!' });
  });

  it('should respond with message in json format for generic error', async () => {
    const response = await request.get('/api/generic-error');

    expect(response.status).toEqual(500);
    expect(response.body).toEqual({ error: 'Something went terribly wrong!' });
  });

});
