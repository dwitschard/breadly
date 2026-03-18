import supertest from 'supertest';
import { app } from '../../app.js';
import { ApplicationDatabase } from '../../database/application-database.js';

const request = supertest(app);

afterEach(async () => {
  const { TechnologyCollection } = ApplicationDatabase.getCollections();
  await TechnologyCollection.deleteMany({});
});

describe('GET /technologies', () => {
  it('responds with 200', async () => {
    const response = await request.get('/technologies');

    expect(response.status).toEqual(200);
    expect(response.body).toEqual([]);
  });

  it('responds with one technology', async () => {
    const mockTechnology = { name: 'ArgoCD' };
    const { TechnologyCollection } = ApplicationDatabase.getCollections();
    await TechnologyCollection.insertOne(mockTechnology);

    const response = await request.get('/technologies').expect(200);

    expect(response.body).toBeDefined();
    expect(response.body[0].name).toBe(mockTechnology.name);
  });
});
