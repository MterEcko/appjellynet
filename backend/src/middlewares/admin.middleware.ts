import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.util';

export const adminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
    return;
  }

  if (!req.user.isAdmin) {
    sendError(res, 'FORBIDDEN', 'Admin access required', 403);
    return;
  }

  next();
};
