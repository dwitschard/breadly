import { Request, Response, NextFunction } from 'express';
import { previewPathMiddleware } from './preview-path.middleware.js';

function makeReq(url: string): Partial<Request> {
  return { url };
}

function makeNext(): NextFunction & { called: boolean } {
  const fn: NextFunction & { called: boolean } = Object.assign(
    function () {
      fn.called = true;
    },
    { called: false },
  ) as NextFunction & { called: boolean };
  return fn;
}

describe('previewPathMiddleware', () => {
  const originalEnv = process.env['PREVIEW_PATH_PREFIX'];

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env['PREVIEW_PATH_PREFIX'];
    } else {
      process.env['PREVIEW_PATH_PREFIX'] = originalEnv;
    }
  });

  describe('when PREVIEW_PATH_PREFIX is not set', () => {
    beforeEach(() => {
      delete process.env['PREVIEW_PATH_PREFIX'];
    });

    it('passes requests through unchanged', () => {
      const middleware = previewPathMiddleware();
      const req = makeReq('/recipes');
      const next = makeNext();

      middleware(req as Request, {} as Response, next);

      expect(req.url).toBe('/recipes');
      expect(next.called).toBe(true);
    });

    it('passes preview-path requests through unchanged (no-op without prefix config)', () => {
      const middleware = previewPathMiddleware();
      const req = makeReq('/preview/feature-foo/recipes');
      const next = makeNext();

      middleware(req as Request, {} as Response, next);

      expect(req.url).toBe('/preview/feature-foo/recipes');
      expect(next.called).toBe(true);
    });
  });

  describe('when PREVIEW_PATH_PREFIX is set', () => {
    beforeEach(() => {
      process.env['PREVIEW_PATH_PREFIX'] = '/preview/feature-recipe-search';
    });

    it('strips the preview prefix from a resource path', () => {
      const middleware = previewPathMiddleware();
      const req = makeReq('/preview/feature-recipe-search/recipes');
      const next = makeNext();

      middleware(req as Request, {} as Response, next);

      expect(req.url).toBe('/recipes');
      expect(next.called).toBe(true);
    });

    it('strips the preview prefix from a nested resource path', () => {
      const middleware = previewPathMiddleware();
      const req = makeReq('/preview/feature-recipe-search/recipes/abc-123');
      const next = makeNext();

      middleware(req as Request, {} as Response, next);

      expect(req.url).toBe('/recipes/abc-123');
      expect(next.called).toBe(true);
    });

    it('rewrites the root preview path to /', () => {
      const middleware = previewPathMiddleware();
      const req = makeReq('/preview/feature-recipe-search/');
      const next = makeNext();

      middleware(req as Request, {} as Response, next);

      expect(req.url).toBe('/');
      expect(next.called).toBe(true);
    });

    it('does not modify paths that do not match the configured prefix', () => {
      const middleware = previewPathMiddleware();
      const req = makeReq('/preview/other-branch/recipes');
      const next = makeNext();

      middleware(req as Request, {} as Response, next);

      expect(req.url).toBe('/preview/other-branch/recipes');
      expect(next.called).toBe(true);
    });

    it('does not modify paths without any preview prefix', () => {
      const middleware = previewPathMiddleware();
      const req = makeReq('/health');
      const next = makeNext();

      middleware(req as Request, {} as Response, next);

      expect(req.url).toBe('/health');
      expect(next.called).toBe(true);
    });

    it('always calls next()', () => {
      const middleware = previewPathMiddleware();
      const req = makeReq('/preview/feature-recipe-search/public/config');
      const next = makeNext();

      middleware(req as Request, {} as Response, next);

      expect(next.called).toBe(true);
    });
  });
});
