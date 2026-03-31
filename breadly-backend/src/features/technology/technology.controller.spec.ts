import supertest from 'supertest';
import { app } from '../../app.js';
import { ApplicationDatabase } from '../../database/application-database.js';

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

const authToken = makeToken({ sub: 'user-abc', 'cognito:groups': [] });
const authHeader = `Bearer ${authToken}`;

afterEach(async () => {
  const { TechnologyCollection } = ApplicationDatabase.getCollections();
  await TechnologyCollection.deleteMany({});
});

describe('GET /api/technologies', () => {
  it('returns 401 when no Authorization header is provided', async () => {
    const response = await request.get('/api/technologies');
    expect(response.status).toBe(401);
  });

  it('responds with 200', async () => {
    const response = await request.get('/api/technologies').set('Authorization', authHeader);

    expect(response.status).toEqual(200);
    expect(response.body).toEqual([]);
  });

  it('responds with one technology', async () => {
    const mockTechnology = { name: 'ArgoCD' };
    const { TechnologyCollection } = ApplicationDatabase.getCollections();
    await TechnologyCollection.insertOne(mockTechnology);

    const response = await request
      .get('/api/technologies')
      .set('Authorization', authHeader)
      .expect(200);

    expect(response.body).toBeDefined();
    expect(response.body[0].name).toBe(mockTechnology.name);
  });
});
