import supertest from 'supertest';
import { app } from '../../app.js';

const request = supertest(app);

describe('Recipe Controller — /api/recipes', () => {
  let createdId: string;

  function makeToken(payload: Record<string, unknown>): string {
    const encode = (obj: Record<string, unknown>) =>
      Buffer.from(JSON.stringify(obj))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    return `${encode({ alg: 'RS256' })}.${encode(payload)}.fakesig`;
  }

  const token = makeToken({
    sub: 'test-user',
    email: 'test@example.com',
    'cognito:groups': [],
  });

  const auth = { Authorization: `Bearer ${token}` };

  describe('POST /api/recipes', () => {
    it('creates a recipe and returns 201', async () => {
      const res = await request
        .post('/api/recipes')
        .set(auth)
        .send({ name: 'Test Recipe' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.name).toBe('Test Recipe');
      createdId = res.body._id;
    });

    it('returns 400 for missing name', async () => {
      const res = await request
        .post('/api/recipes')
        .set(auth)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('statusCode', 400);
    });

    it('returns 400 for empty name', async () => {
      const res = await request
        .post('/api/recipes')
        .set(auth)
        .send({ name: '' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    });

    it('returns 401 without auth header', async () => {
      const res = await request
        .post('/api/recipes')
        .send({ name: 'No Auth' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/recipes', () => {
    it('returns 200 with an array', async () => {
      const res = await request.get('/api/recipes').set(auth);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/recipes/:id', () => {
    it('returns 200 for existing recipe', async () => {
      const res = await request.get(`/api/recipes/${createdId}`).set(auth);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Test Recipe');
      expect(res.body._id).toBe(createdId);
    });

    it('returns 404 for non-existing recipe', async () => {
      const res = await request.get('/api/recipes/aaaaaaaaaaaaaaaaaaaaaaaa').set(auth);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'Recipe not found');
    });
  });

  describe('PUT /api/recipes/:id', () => {
    it('replaces a recipe and returns 200', async () => {
      const res = await request
        .put(`/api/recipes/${createdId}`)
        .set(auth)
        .send({ name: 'Replaced Recipe' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Replaced Recipe');
    });

    it('returns 400 for invalid body', async () => {
      const res = await request
        .put(`/api/recipes/${createdId}`)
        .set(auth)
        .send({});

      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existing recipe', async () => {
      const res = await request
        .put('/api/recipes/aaaaaaaaaaaaaaaaaaaaaaaa')
        .set(auth)
        .send({ name: 'Ghost' });

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/recipes/:id', () => {
    it('partially updates a recipe and returns 200', async () => {
      const res = await request
        .patch(`/api/recipes/${createdId}`)
        .set(auth)
        .send({ name: 'Patched Recipe' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Patched Recipe');
    });

    it('returns 400 for empty name', async () => {
      const res = await request
        .patch(`/api/recipes/${createdId}`)
        .set(auth)
        .send({ name: '' });

      expect(res.status).toBe(400);
    });

    it('returns 404 for non-existing recipe', async () => {
      const res = await request
        .patch('/api/recipes/aaaaaaaaaaaaaaaaaaaaaaaa')
        .set(auth)
        .send({ name: 'Ghost' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/recipes/:id', () => {
    it('deletes an existing recipe and returns 204', async () => {
      const res = await request.delete(`/api/recipes/${createdId}`).set(auth);

      expect(res.status).toBe(204);
    });

    it('returns 404 for non-existing recipe', async () => {
      const res = await request.delete('/api/recipes/aaaaaaaaaaaaaaaaaaaaaaaa').set(auth);

      expect(res.status).toBe(404);
    });
  });
});
