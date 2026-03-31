import supertest from 'supertest';
import { app } from '../app.js';

const request = supertest(app);

describe('Preview path middleware (integration via app)', () => {
  it('routes /api/health correctly without a preview prefix in the URL', async () => {
    const response = await request.get('/api/health');

    // /api/health is always registered; should not 404
    expect(response.status).not.toBe(404);
  });

  it('returns 404 for an unrecognised path unrelated to preview', async () => {
    const response = await request.get('/preview/feature-foo/api/health');

    // Without PREVIEW_PATH_PREFIX set, /preview/feature-foo/api/health is not routed
    expect(response.status).toBe(404);
  });
});
