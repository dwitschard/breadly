import supertest from 'supertest';
import { app } from '../../app.js';

const request = supertest(app);

/** Build a fake JWT whose payload is the given object. */
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

describe('GET /profile', () => {
  it('returns 401 when no Authorization header is provided', async () => {
    const res = await request.get('/profile');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 401 for a malformed token (not 3 segments)', async () => {
    const res = await request.get('/profile').set('Authorization', 'Bearer bad.token');
    expect(res.status).toBe(401);
  });

  it('returns the whitelisted profile fields for a valid token', async () => {
    const token = makeToken(minimalClaims);
    const res = await request.get('/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      sub: 'user-abc',
      email: 'bob@example.com',
      emailVerified: true,
      roles: [],
    });
  });

  it('maps cognito:groups to roles', async () => {
    const token = makeToken({ ...minimalClaims, 'cognito:groups': ['admin', 'editor'] });
    const res = await request.get('/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.roles).toEqual(['admin', 'editor']);
  });

  it('includes optional fields when present in claims', async () => {
    const token = makeToken({
      ...minimalClaims,
      name: 'Bob Builder',
      given_name: 'Bob',
      family_name: 'Builder',
      picture: 'https://example.com/pic.jpg',
    });
    const res = await request.get('/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      name: 'Bob Builder',
      givenName: 'Bob',
      familyName: 'Builder',
      picture: 'https://example.com/pic.jpg',
    });
  });

  it('omits optional fields when absent from claims', async () => {
    const token = makeToken(minimalClaims);
    const res = await request.get('/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('name');
    expect(res.body).not.toHaveProperty('givenName');
    expect(res.body).not.toHaveProperty('familyName');
    expect(res.body).not.toHaveProperty('picture');
  });

  it('defaults emailVerified to false when claim is absent', async () => {
    const { email_verified: _, ...withoutVerified } = minimalClaims;
    const token = makeToken(withoutVerified);
    const res = await request.get('/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.emailVerified).toBe(false);
  });

  it('defaults roles to [] when cognito:groups is absent', async () => {
    const { 'cognito:groups': _, ...withoutGroups } = minimalClaims;
    const token = makeToken(withoutGroups);
    const res = await request.get('/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.roles).toEqual([]);
  });
});
