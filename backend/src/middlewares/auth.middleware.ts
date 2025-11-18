import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt.util';
import { sendError } from '../utils/response.util';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'UNAUTHORIZED', 'No token provided', 401);
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const payload = verifyAccessToken(token);

    // Get profile ID from header if available
    const profileId = req.headers['x-profile-id'] as string | undefined;

    req.user = {
      ...payload,
      profileId,
    };

    next();
  } catch (error) {
    sendError(res, 'UNAUTHORIZED', 'Invalid or expired token', 401);
  }
};
