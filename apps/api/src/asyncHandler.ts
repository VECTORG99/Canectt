import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wrapper para handlers async de Express. Express 4 no atrapa promesas
 * rechazadas automáticamente; este wrapper las pasa a next().
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
