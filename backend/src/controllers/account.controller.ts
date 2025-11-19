import { Request, Response, NextFunction } from 'express';
import accountService from '../services/account.service';
import authService from '../services/auth.service';
import emailService from '../services/email.service';
import { sendSuccess } from '../utils/response.util';
import { getClientIp } from '../utils/network.util';
import { UnauthorizedError, BadRequestError } from '../utils/error.util';

export class AccountController {
  /**
   * Get current account info
   */
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const account = await accountService.getAccountWithProfiles(userId);

      sendSuccess(res, account, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update account info
   */
  async updateAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { email } = req.body;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const account = await accountService.updateAccount(userId, { email });

      sendSuccess(res, account, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update account password
   */
  async updatePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { newPassword } = req.body;
      const clientIp = getClientIp(req);

      if (!userId) {
        throw new Error('User not authenticated');
      }

      await accountService.updatePassword(userId, newPassword, clientIp);

      sendSuccess(res, { message: 'Password updated successfully in all Jellyfin profiles' }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change email with password verification
   */
  async changeEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { newEmail, currentPassword } = req.body;

      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }

      if (!newEmail || !currentPassword) {
        throw new BadRequestError('New email and current password are required');
      }

      // Verify current password
      const account = await accountService.getAccountWithProfiles(userId);
      const isPasswordValid = await authService.verifyPassword(account.email, currentPassword);

      if (!isPasswordValid) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      // Update email
      const oldEmail = account.email;
      await accountService.updateAccount(userId, { email: newEmail });

      // Send notification emails
      await emailService.sendEmailChangedNotification(oldEmail, newEmail);

      sendSuccess(res, { message: 'Email updated successfully' }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password with current password verification
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { currentPassword, newPassword } = req.body;
      const clientIp = getClientIp(req);

      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }

      if (!currentPassword || !newPassword) {
        throw new BadRequestError('Current password and new password are required');
      }

      if (newPassword.length < 6) {
        throw new BadRequestError('New password must be at least 6 characters long');
      }

      // Verify current password using auth service
      const account = await accountService.getAccountWithProfiles(userId);
      const isPasswordValid = await authService.verifyPassword(account.email, currentPassword);

      if (!isPasswordValid) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      // Update password
      await accountService.updatePassword(userId, newPassword, clientIp);

      // Send notification email
      await emailService.sendPasswordChangedEmail(account.email);

      sendSuccess(res, { message: 'Password changed successfully' }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get notification preferences
   */
  async getNotificationPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }

      const preferences = await accountService.getNotificationPreferences(userId);

      sendSuccess(res, preferences, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { newContent, accountUpdates, marketing } = req.body;

      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }

      const preferences = await accountService.updateNotificationPreferences(userId, {
        notifyNewContent: newContent,
        notifyAccountUpdates: accountUpdates,
        notifyMarketing: marketing,
      });

      sendSuccess(res, preferences, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new AccountController();
