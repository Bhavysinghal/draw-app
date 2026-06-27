import { Request, Response, NextFunction, RequestHandler } from "express";

// This wraps any async route so you don't need try/catch inside every route.
// If something throws an error, it automatically passes it to Express
// which will then send a clean error response.
export const asyncHandler =
  (fn: RequestHandler) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };