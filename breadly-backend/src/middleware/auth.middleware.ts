import { NextFunction, Request, Response } from 'express';

export interface CognitoClaims {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  'cognito:groups'?: string[];
  [key: string]: unknown;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: CognitoClaims;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  const parts = token.split('.');

  if (parts.length !== 3) {
    res.status(401).json({ error: 'Invalid JWT format' });
    return;
  }

  try {
    const payload = parts[1];
    // Pad base64url to standard base64 before decoding
    const padded = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(
      payload.length + ((4 - (payload.length % 4)) % 4),
      '=',
    );
    const decoded = JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as CognitoClaims;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Failed to decode JWT payload' });
  }
}
