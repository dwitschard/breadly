import supertest from 'supertest';
import { app } from '../../app.js';
import { getSettings } from '../user-settings/user-settings.repository.js';

jest.mock('../user-settings/user-settings.repository.js', () => ({
  getSettings: jest.fn().mockResolvedValue({ language: 'de', theme: 'light' }),
  upsertSettings: jest.fn().mockImplementation(
    (_userId: unknown, patch: Record<string, string>) =>
      Promise.resolve({ language: patch['language'] ?? 'de', theme: patch['theme'] ?? 'light' }),
  ),
}));

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

  it('returns empty email when UserInfo fails', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
    } as Response);

    const token = makeToken(minimalClaims);
    const res = await request.get('/api/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('');
    expect(res.body.emailVerified).toBe(false);
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

  it('defaults emailVerified to false when absent from UserInfo', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ sub: 'user-abc' }),
    } as Response);

    const token = makeToken(minimalClaims);
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

  it('includes settings in profile response', async () => {
    const token = makeToken(minimalClaims);
    const res = await request.get('/api/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('settings');
    expect(res.body.settings).toEqual({ language: 'de', theme: 'light' });
  });

  it('syncs UserInfo email to DynamoDB on every profile load', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ sub: 'user-abc', email: 'synced@example.com', name: 'Bob' }),
    } as Response);

    const token = makeToken(minimalClaims);
    await request.get('/api/profile').set('Authorization', `Bearer ${token}`);

    expect(jest.mocked(getSettings)).toHaveBeenCalledWith('user-abc', 'synced@example.com');
  });
});

describe('GET /api/profile/settings', () => {
  const token = makeToken({ sub: 'test-user', 'cognito:groups': [] });
  const auth = { Authorization: `Bearer ${token}` };

  beforeEach(() => {
    process.env['COGNITO_USERINFO_URL'] = 'https://auth.example.com/oauth2/userInfo';
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ sub: 'test-user', email: 'test@example.com' }),
    } as Response);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns settings for authenticated user', async () => {
    const res = await request.get('/api/profile/settings').set(auth);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ language: 'de', theme: 'light' });
  });

  it('returns 401 without auth', async () => {
    const res = await request.get('/api/profile/settings');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/profile/settings', () => {
  const token = makeToken({ sub: 'test-user', 'cognito:groups': [] });
  const auth = { Authorization: `Bearer ${token}` };

  it('updates theme and returns updated settings', async () => {
    const res = await request.patch('/api/profile/settings').set(auth).send({ theme: 'dark' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('theme', 'dark');
    expect(res.body).toHaveProperty('language');
  });

  it('updates language only', async () => {
    const res = await request.patch('/api/profile/settings').send({ language: 'en' }).set(auth);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('language', 'en');
  });

  it('returns 400 for invalid theme', async () => {
    const res = await request.patch('/api/profile/settings').set(auth).send({ theme: 'rainbow' });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid language', async () => {
    const res = await request.patch('/api/profile/settings').set(auth).send({ language: 'fr' });
    expect(res.status).toBe(400);
  });

  it('returns 401 without auth', async () => {
    const res = await request.patch('/api/profile/settings').send({ theme: 'dark' });
    expect(res.status).toBe(401);
  });
});
