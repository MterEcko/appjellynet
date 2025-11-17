import { Request, Response, NextFunction } from 'express';
import adminService from '../services/admin.service';
import planService from '../services/plan.service';
import { sendSuccess } from '../utils/response.util';
import { getClientIp } from '../utils/network.util';
import { Plan } from '@prisma/client';

export class AdminController {
  /**
   * Get all accounts with pagination
   */
  async getAllAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await adminService.getAllAccounts(page, limit);

      sendSuccess(res, result.accounts, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get account by ID
   */
  async getAccountById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const account = await adminService.getAccountById(id);

      sendSuccess(res, account, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new account
   */
  async createAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientIp = getClientIp(req);

      const account = await adminService.createAccount(req.body, clientIp);

      sendSuccess(res, { id: account.id, email: account.email }, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Suspend account
   */
  async suspendAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user?.userId;

      if (!adminId) {
        throw new Error('Admin not authenticated');
      }

      await adminService.suspendAccount(id, reason, adminId);

      sendSuccess(res, { message: 'Account suspended successfully' }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reactivate account
   */
  async reactivateAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user?.userId;

      if (!adminId) {
        throw new Error('Admin not authenticated');
      }

      await adminService.reactivateAccount(id, adminId);

      sendSuccess(res, { message: 'Account reactivated successfully' }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update account plan
   */
  async updateAccountPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { plan } = req.body;
      const adminId = req.user?.userId;

      if (!adminId) {
        throw new Error('Admin not authenticated');
      }

      const account = await adminService.updateAccountPlan(id, plan as Plan, adminId);

      sendSuccess(res, account, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get dashboard stats
   */
  async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await adminService.getDashboardStats();

      sendSuccess(res, stats, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await adminService.getAuditLogs(page, limit);

      sendSuccess(res, result.logs, 200, result.pagination);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all available plans
   */
  async getAllPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = planService.getAllPlans();

      sendSuccess(res, { plans }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get plan comparison
   */
  async getPlanComparison(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const comparison = planService.getPlanComparison();

      sendSuccess(res, comparison, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change user's plan
   */
  async changeUserPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const { plan } = req.body;

      await planService.changeUserPlan(userId, plan as Plan);

      sendSuccess(res, { message: 'Plan changed successfully' }, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminController();
