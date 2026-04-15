import supertest from 'supertest';
import { app } from '../../app.js';

const request = supertest(app);

describe('Public Controller — /api/public', () => {
  const originalIssuer = process.env['COGNITO_ISSUER'];
  const originalClientId = process.env['COGNITO_CLIENT_ID'];
  const originalEnvName = process.env['ENV_NAME'];

  afterEach(() => {
    if (originalIssuer !== undefined) {
      process.env['COGNITO_ISSUER'] = originalIssuer;
    } else {
      delete process.env['COGNITO_ISSUER'];
    }
    if (originalClientId !== undefined) {
      process.env['COGNITO_CLIENT_ID'] = originalClientId;
    } else {
      delete process.env['COGNITO_CLIENT_ID'];
    }
    if (originalEnvName !== undefined) {
      process.env['ENV_NAME'] = originalEnvName;
    } else {
      delete process.env['ENV_NAME'];
    }
  });

  it('returns 503 when env vars are missing', async () => {
    delete process.env['COGNITO_ISSUER'];
    delete process.env['COGNITO_CLIENT_ID'];

    const res = await request.get('/api/public/config');
    expect(res.status).toBe(503);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('statusCode', 503);
  });

  it('returns 200 with config when env vars are set', async () => {
    process.env['COGNITO_ISSUER'] = 'https://cognito.example.com';
    process.env['COGNITO_CLIENT_ID'] = 'test-client-id';

    const res = await request.get('/api/public/config');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      environment: expect.any(String),
      idp: {
        issuer: 'https://cognito.example.com',
        clientId: 'test-client-id',
      },
    });
  });

  it('returns the ENV_NAME value as environment', async () => {
    process.env['COGNITO_ISSUER'] = 'https://cognito.example.com';
    process.env['COGNITO_CLIENT_ID'] = 'test-client-id';
    process.env['ENV_NAME'] = 'preview-feature-x';

    const res = await request.get('/api/public/config');
    expect(res.status).toBe(200);
    expect(res.body.environment).toBe('preview-feature-x');
  });
});
