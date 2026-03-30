import { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Strips the `/preview/<slug>` path prefix from incoming requests so that all
 * downstream route handlers work without modification.
 *
 * The prefix is injected via the PREVIEW_PATH_PREFIX environment variable when
 * a Lambda is deployed as part of a preview environment. For dev and local
 * environments the variable is absent and this middleware is a no-op.
 *
 * Example: PREVIEW_PATH_PREFIX=/preview/feature-recipe-search
 *   /preview/feature-recipe-search/recipes  →  /recipes
 *   /preview/feature-recipe-search/         →  /
 */
export function previewPathMiddleware(): RequestHandler {
  const prefix = process.env['PREVIEW_PATH_PREFIX'] ?? '';

  if (!prefix) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.url.startsWith(prefix)) {
      req.url = req.url.slice(prefix.length) || '/';
    }
    next();
  };
}
