import supertest from 'supertest';
import { app } from '../../app.js';

const request = supertest(app);

describe('Operation Controller', () => {

  it('should respond with message in json format for application error', async () => {
    const response = await request.get('/application-error');

    expect(response.status).toEqual(799);
    expect(response.body).toEqual({ error: 'Custom Error!' });
  });

  it('should respond with message in json format for generic error', async () => {
    const response = await request.get('/generic-error');

    expect(response.status).toEqual(500);
    expect(response.body).toEqual({ error: 'Something went terribly wrong!' });
  });

});
