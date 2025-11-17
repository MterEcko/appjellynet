import { Request, Response, NextFunction } from 'express';
import accountService from '../services/account.service';
import { sendSuccess } from '../utils/response.util';
import { getClientIp } from '../utils/network.util';

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
}

export default new AccountController();
