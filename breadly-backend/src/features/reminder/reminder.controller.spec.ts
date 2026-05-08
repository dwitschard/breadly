import supertest from 'supertest';
import { app } from '../../app.js';

jest.mock('../profile/profile.service.js', () => ({
  fetchUserInfo: jest.fn().mockResolvedValue({ email: 'test@example.com' }),
}));

jest.mock('./reminder.service.js', () => ({
  createReminder: jest.fn().mockResolvedValue({
    id: 'local-reminder-test-user-abc123',
    recipeId: 'recipe-456',
    scheduledAt: '2027-01-01T09:00:00.000Z',
    title: 'Bake bread',
  }),
  listReminders: jest.fn().mockResolvedValue({
    items: [{ id: 'local-reminder-test-user-abc123', recipeId: 'recipe-456', scheduledAt: '2027-01-01T09:00:00.000Z' }],
    nextToken: undefined,
  }),
  cancelReminder: jest.fn().mockResolvedValue(undefined),
  sendReminderEmail: jest.fn().mockResolvedValue(undefined),
  processBatchReminders: jest.fn().mockResolvedValue(undefined),
}));

const request = supertest(app);

describe('Reminder Controller', () => {
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
    'cognito:groups': [],
  });

  const auth = { Authorization: `Bearer ${token}` };

  describe('POST /api/reminders', () => {
    it('creates a reminder and returns 201', async () => {
      const res = await request
        .post('/api/reminders')
        .set(auth)
        .send({
          recipeId: 'recipe-456',
          scheduledAt: '2027-01-01T10:00:00+01:00',
          title: 'Bake bread',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.recipeId).toBe('recipe-456');
    });

    it('returns 400 for missing recipeId', async () => {
      const res = await request
        .post('/api/reminders')
        .set(auth)
        .send({ scheduledAt: '2027-01-01T10:00:00Z' });

      expect(res.status).toBe(400);
    });

    it('returns 401 without auth header', async () => {
      const res = await request
        .post('/api/reminders')
        .send({ recipeId: 'recipe-456', scheduledAt: '2027-01-01T10:00:00Z' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/reminders', () => {
    it('returns 200 with reminder list', async () => {
      const res = await request.get('/api/reminders').set(auth);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
      expect(Array.isArray(res.body.items)).toBe(true);
    });
  });

  describe('DELETE /api/reminders/:id', () => {
    it('returns 204 on successful deletion', async () => {
      const res = await request
        .delete('/api/reminders/local-reminder-test-user-abc123')
        .set(auth);

      expect(res.status).toBe(204);
    });
  });

  describe('POST /api/internal/reminders/send', () => {
    it('sends a reminder email and returns 200', async () => {
      const res = await request
        .post('/api/internal/reminders/send')
        .send({
          recipientEmail: 'user@example.com',
          recipeId: 'recipe-123',
          recipeName: 'Sourdough Bread',
        });

      expect(res.status).toBe(200);
    });

    it('returns 400 for missing recipientEmail', async () => {
      const res = await request
        .post('/api/internal/reminders/send')
        .send({ recipeId: 'recipe-123', recipeName: 'Bread' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/internal/reminders/batch', () => {
    it('processes batch reminders and returns 200', async () => {
      const res = await request
        .post('/api/internal/reminders/batch')
        .send({
          type: 'greeting',
          userIds: ['user1@example.com'],
        });

      expect(res.status).toBe(200);
    });

    it('returns 400 for missing type', async () => {
      const res = await request
        .post('/api/internal/reminders/batch')
        .send({ userIds: ['user1@example.com'] });

      expect(res.status).toBe(400);
    });
  });
});
