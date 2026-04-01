import { NextFunction, Request, Response } from 'express';
import { ApplicationError } from '../domain/error.types.js';

export const globalErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _nextFn: NextFunction,
) => {
  const statusCode = err instanceof ApplicationError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({ message, statusCode });
};
