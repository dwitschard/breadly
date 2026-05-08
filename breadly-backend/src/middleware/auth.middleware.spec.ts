import { Request, Response, NextFunction } from 'express';
import { requireAuth, CognitoClaims } from './auth.middleware.js';

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

interface FakeRes {
  statusCode: number | null;
  body: unknown;
  status(code: number): this;
  json(body: unknown): this;
}

interface FakeNext {
  called: boolean;
  (): void;
}

function makeReqRes(authHeader?: string): {
  req: Partial<Request>;
  res: FakeRes;
  next: FakeNext;
} {
  const req: Partial<Request> = { headers: {} };
  if (authHeader !== undefined) {
    req.headers = { authorization: authHeader };
  }
  const res: FakeRes = {
    statusCode: null,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
  const next: FakeNext = Object.assign(
    function () {
      next.called = true;
    },
    { called: false },
  );
  return { req, res, next };
}

describe('requireAuth middleware', () => {
  it('returns 401 when Authorization header is absent', () => {
    const { req, res, next } = makeReqRes();
    requireAuth()(req as Request, res as unknown as Response, next as unknown as NextFunction);
    expect(res.statusCode).toBe(401);
    expect(next.called).toBe(false);
  });

  it('returns 401 when Authorization header does not start with "Bearer "', () => {
    const { req, res, next } = makeReqRes('Basic abc');
    requireAuth()(req as Request, res as unknown as Response, next as unknown as NextFunction);
    expect(res.statusCode).toBe(401);
    expect(next.called).toBe(false);
  });

  it('returns 401 for a token with fewer than 3 segments', () => {
    const { req, res, next } = makeReqRes('Bearer header.payload');
    requireAuth()(req as Request, res as unknown as Response, next as unknown as NextFunction);
    expect(res.statusCode).toBe(401);
    expect(next.called).toBe(false);
  });

  it('returns 401 when the payload segment is not valid JSON', () => {
    const badPayload = Buffer.from('not-json').toString('base64url');
    const { req, res, next } = makeReqRes(`Bearer header.${badPayload}.sig`);
    requireAuth()(req as Request, res as unknown as Response, next as unknown as NextFunction);
    expect(res.statusCode).toBe(401);
    expect(next.called).toBe(false);
  });

  it('decodes a valid JWT, attaches claims to req.user, and calls next()', () => {
    const claims: CognitoClaims = {
      sub: 'user-123',
      name: 'Alice',
      'cognito:groups': ['ADMIN'],
    };
    const token = makeToken(claims);
    const { req, res, next } = makeReqRes(`Bearer ${token}`);

    requireAuth()(req as Request, res as unknown as Response, next as unknown as NextFunction);

    expect(next.called).toBe(true);
    expect((req as Request).user).toMatchObject({
      sub: 'user-123',
      name: 'Alice',
      'cognito:groups': ['ADMIN'],
    });
  });

  it('attaches the raw access token to req.accessToken', () => {
    const claims: CognitoClaims = { sub: 'user-123' };
    const token = makeToken(claims);
    const { req, res, next } = makeReqRes(`Bearer ${token}`);

    requireAuth()(req as Request, res as unknown as Response, next as unknown as NextFunction);

    expect(next.called).toBe(true);
    expect((req as Request).accessToken).toBe(token);
  });

  it('handles base64url padding correctly (payload length not divisible by 4)', () => {
    // 'sub' value chosen so payload length % 4 != 0 to exercise the padding branch
    const claims: CognitoClaims = { sub: 'u1' };
    const token = makeToken(claims);
    const { req, res, next } = makeReqRes(`Bearer ${token}`);

    requireAuth()(req as Request, res as unknown as Response, next as unknown as NextFunction);

    expect(next.called).toBe(true);
    expect((req as Request).user?.sub).toBe('u1');
  });

  it('calls next() when no roles are required and token is valid', () => {
    const claims: CognitoClaims = { sub: 'user-1', 'cognito:groups': ['USER'] };
    const token = makeToken(claims);
    const { req, res, next } = makeReqRes(`Bearer ${token}`);

    requireAuth()(req as Request, res as unknown as Response, next as unknown as NextFunction);

    expect(next.called).toBe(true);
    expect(res.statusCode).toBeNull();
  });

  it('calls next() when user has one of the required roles', () => {
    const claims: CognitoClaims = { sub: 'user-2', 'cognito:groups': ['ADMIN', 'USER'] };
    const token = makeToken(claims);
    const { req, res, next } = makeReqRes(`Bearer ${token}`);

    requireAuth(['ADMIN'])(req as Request, res as unknown as Response, next as unknown as NextFunction);

    expect(next.called).toBe(true);
    expect(res.statusCode).toBeNull();
  });

  it('returns 403 when user lacks all required roles', () => {
    const claims: CognitoClaims = { sub: 'user-3', 'cognito:groups': ['USER'] };
    const token = makeToken(claims);
    const { req, res, next } = makeReqRes(`Bearer ${token}`);

    requireAuth(['ADMIN'])(req as Request, res as unknown as Response, next as unknown as NextFunction);

    expect(next.called).toBe(false);
    expect(res.statusCode).toBe(403);
  });

  it('returns 403 when user has no groups at all', () => {
    const claims: CognitoClaims = { sub: 'user-4' };
    const token = makeToken(claims);
    const { req, res, next } = makeReqRes(`Bearer ${token}`);

    requireAuth(['ADMIN'])(req as Request, res as unknown as Response, next as unknown as NextFunction);

    expect(next.called).toBe(false);
    expect(res.statusCode).toBe(403);
  });
});
