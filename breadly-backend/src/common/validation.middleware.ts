import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, type ZodIssue } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const error = result.error as ZodError;
      const message = error.issues
        .map((e: ZodIssue) => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      res.status(400).json({ message: `Validation failed: ${message}`, statusCode: 400 });
      return;
    }
    req.body = result.data;
    next();
  };
}
