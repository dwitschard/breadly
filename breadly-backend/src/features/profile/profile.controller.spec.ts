import supertest from 'supertest';
import { app } from '../../app.js';

const request = supertest(app);

function makeToken(payload: Record<string, unknown>): string {
  const encode = (obj: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  return `${encode({ alg: 'RS256' })}.${encode(payload)}.fakesig`;
}

const minimalClaims = {
  sub: 'user-abc',
  email: 'bob@example.com',
  email_verified: true,
  'cognito:groups': [],
};

const userInfoResponse = {
  sub: 'user-abc',
  email: 'bob@example.com',
  email_verified: 'true',
};

describe('GET /api/profile', () => {
  const originalCognitoUserinfoUrl = process.env['COGNITO_USERINFO_URL'];

  beforeEach(() => {
    process.env['COGNITO_USERINFO_URL'] = 'https://auth.example.com/oauth2/userInfo';
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => userInfoResponse,
    } as Response);
  });

  afterEach(() => {
    if (originalCognitoUserinfoUrl !== undefined) {
      process.env['COGNITO_USERINFO_URL'] = originalCognitoUserinfoUrl;
    } else {
      delete process.env['COGNITO_USERINFO_URL'];
    }
    jest.restoreAllMocks();
  });

  it('returns 401 when no Authorization header is provided', async () => {
    const res = await request.get('/api/profile');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('returns 401 for a malformed token (not 3 segments)', async () => {
    const res = await request.get('/api/profile').set('Authorization', 'Bearer bad.token');
    expect(res.status).toBe(401);
  });

  it('returns profile with email from UserInfo endpoint', async () => {
    const token = makeToken({ sub: 'user-abc', 'cognito:groups': [] });
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        sub: 'user-abc',
        email: 'real@example.com',
        email_verified: 'true',
        name: 'Bob Builder',
      }),
    } as Response);

    const res = await request.get('/api/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('real@example.com');
    expect(res.body.emailVerified).toBe(true);
    expect(res.body.name).toBe('Bob Builder');
  });

  it('falls back to JWT claims when UserInfo fails', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
    } as Response);

    const token = makeToken(minimalClaims);
    const res = await request.get('/api/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('bob@example.com');
    expect(res.body.emailVerified).toBe(true);
  });

  it('calls Cognito UserInfo with the access token', async () => {
    const token = makeToken(minimalClaims);
    await request.get('/api/profile').set('Authorization', `Bearer ${token}`);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://auth.example.com/oauth2/userInfo',
      { headers: { Authorization: `Bearer ${token}` } },
    );
  });

  it('maps cognito:groups to roles', async () => {
    const token = makeToken({ ...minimalClaims, 'cognito:groups': ['admin', 'editor'] });
    const res = await request.get('/api/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.roles).toEqual(['admin', 'editor']);
  });

  it('includes optional fields when present in UserInfo', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        ...userInfoResponse,
        name: 'Bob Builder',
        given_name: 'Bob',
        family_name: 'Builder',
        picture: 'https://example.com/pic.jpg',
      }),
    } as Response);

    const token = makeToken(minimalClaims);
    const res = await request.get('/api/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      name: 'Bob Builder',
      givenName: 'Bob',
      familyName: 'Builder',
      picture: 'https://example.com/pic.jpg',
    });
  });

  it('omits optional fields when absent from both UserInfo and claims', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ sub: 'user-abc', email: 'bob@example.com', email_verified: 'true' }),
    } as Response);

    const token = makeToken(minimalClaims);
    const res = await request.get('/api/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('name');
    expect(res.body).not.toHaveProperty('givenName');
    expect(res.body).not.toHaveProperty('familyName');
    expect(res.body).not.toHaveProperty('picture');
  });

  it('defaults emailVerified to false when absent from both', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ sub: 'user-abc' }),
    } as Response);

    const withoutVerified = Object.fromEntries(
      Object.entries(minimalClaims).filter(([k]) => k !== 'email_verified'),
    );
    const token = makeToken(withoutVerified);
    const res = await request.get('/api/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.emailVerified).toBe(false);
  });

  it('defaults roles to [] when cognito:groups is absent', async () => {
    const withoutGroups = Object.fromEntries(
      Object.entries(minimalClaims).filter(([k]) => k !== 'cognito:groups'),
    );
    const token = makeToken(withoutGroups);
    const res = await request.get('/api/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.roles).toEqual([]);
  });
});
