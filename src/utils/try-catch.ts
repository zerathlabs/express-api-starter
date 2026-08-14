import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Express async handler wrapper utility.
 * Wraps asynchronous Express route handlers to automatically catch rejected promises
 * and pass errors to Express global error middleware via next(err).
 */
export const tryCatch = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown,
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Alias export for PascalCase usage.
 */
export const TryCatch = tryCatch;
