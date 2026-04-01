import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from './validation.middleware.js';

function createMockReqResNext(body: unknown) {
  const req = { body } as Request;
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  const next = jest.fn() as NextFunction;
  return { req, res, next };
}

const testSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive().optional(),
});

describe('validate middleware', () => {
  const middleware = validate(testSchema);

  it('calls next() when input is valid', () => {
    const { req, res, next } = createMockReqResNext({ name: 'Alice' });
    middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('sets req.body to the parsed value', () => {
    const { req, res, next } = createMockReqResNext({ name: 'Alice', extra: 'ignored' });
    middleware(req, res, next);
    expect(req.body).toEqual({ name: 'Alice' });
  });

  it('returns 400 with ErrorResponse shape for invalid input', () => {
    const { req, res, next } = createMockReqResNext({});
    middleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Validation failed'),
        statusCode: 400,
      }),
    );
  });

  it('includes Zod error details in the message', () => {
    const { req, res, next } = createMockReqResNext({ name: '' });
    middleware(req, res, next);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.message).toContain('name');
  });
});
