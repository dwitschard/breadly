import { NextFunction, Request, Response } from 'express';
import { ApplicationError } from '../domain/error.types';

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  nextFn: NextFunction,
) => {
  const statusCode = err instanceof ApplicationError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({ error: message });

  // Delegate Error to Default Express Error Handler in case not handled above
  nextFn(err);
};
