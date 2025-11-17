import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { AppError } from '../utils/error.util';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      const result = await authService.refreshToken(refreshToken);

      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        return sendError(res, 'UNAUTHORIZED', 'User not authenticated', 401);
      }

      await authService.changePassword(userId, currentPassword, newPassword);

      sendSuccess(res, { message: 'Password changed successfully' }, 200);
    } catch (error) {
      next(error);
    }
  }

  async requestPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      await authService.requestPasswordReset(email);

      sendSuccess(res, { message: 'If the email exists, a password reset link has been sent' }, 200);
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, newPassword } = req.body;

      await authService.resetPassword(token, newPassword);

      sendSuccess(res, { message: 'Password reset successfully' }, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
