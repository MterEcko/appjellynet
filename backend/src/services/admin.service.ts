import prisma from '../config/database';
import { NotFoundError } from '../utils/error.util';
import accountService, { CreateAccountData } from './account.service';
import { User, AccountStatus, Plan } from '@prisma/client';
import { logger } from '../utils/logger.util';

export class AdminService {
  /**
   * Get all accounts with pagination
   */
  async getAllAccounts(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [accounts, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        include: {
          profiles: {
            select: {
              id: true,
              name: true,
              isPrimary: true,
            },
          },
          subscriptions: {
            select: {
              id: true,
              plan: true,
              status: true,
              currentPeriodEnd: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count(),
    ]);

    // Remove password hashes
    const accountsWithoutPasswords = accounts.map((account) => {
      const { passwordHash, ...accountData } = account;
      return accountData;
    });

    return {
      accounts: accountsWithoutPasswords,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get account by ID (admin view)
   */
  async getAccountById(accountId: string) {
    const account = await prisma.user.findUnique({
      where: { id: accountId },
      include: {
        profiles: true,
        subscriptions: true,
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!account) {
      throw new NotFoundError('Account not found');
    }

    const { passwordHash, ...accountData } = account;

    return accountData;
  }

  /**
   * Create account (admin only)
   */
  async createAccount(data: CreateAccountData, clientIp: string): Promise<User> {
    return accountService.createAccount(data, clientIp);
  }

  /**
   * Suspend account
   */
  async suspendAccount(accountId: string, reason: string, adminId: string): Promise<void> {
    await accountService.suspendAccount(accountId, reason);

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ACCOUNT_SUSPENDED',
        entity: 'Account',
        entityId: accountId,
        changes: { reason },
      },
    });

    logger.info(`Account ${accountId} suspended by admin ${adminId}`);
  }

  /**
   * Reactivate account
   */
  async reactivateAccount(accountId: string, adminId: string): Promise<void> {
    await accountService.reactivateAccount(accountId);

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ACCOUNT_REACTIVATED',
        entity: 'Account',
        entityId: accountId,
      },
    });

    logger.info(`Account ${accountId} reactivated by admin ${adminId}`);
  }

  /**
   * Update account plan
   */
  async updateAccountPlan(accountId: string, plan: Plan, adminId: string) {
    const account = await prisma.user.update({
      where: { id: accountId },
      data: { plan },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ACCOUNT_PLAN_UPDATED',
        entity: 'Account',
        entityId: accountId,
        changes: { plan },
      },
    });

    const { passwordHash, ...accountData } = account;

    return accountData;
  }

  /**
   * Get dashboard stats
   */
  async getDashboardStats() {
    const [
      totalAccounts,
      activeAccounts,
      suspendedAccounts,
      demoAccounts,
      basicAccounts,
      premiumAccounts,
      totalProfiles,
      recentAccounts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: AccountStatus.ACTIVE } }),
      prisma.user.count({ where: { status: AccountStatus.SUSPENDED } }),
      prisma.user.count({ where: { plan: Plan.DEMO } }),
      prisma.user.count({ where: { plan: Plan.BASIC } }),
      prisma.user.count({ where: { plan: Plan.PREMIUM } }),
      prisma.profile.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          plan: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      accounts: {
        total: totalAccounts,
        active: activeAccounts,
        suspended: suspendedAccounts,
        demo: demoAccounts,
        basic: basicAccounts,
        premium: premiumAccounts,
      },
      profiles: {
        total: totalProfiles,
        average: totalAccounts > 0 ? totalProfiles / totalAccounts : 0,
      },
      recent: recentAccounts,
    };
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: {
              email: true,
              isAdmin: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.auditLog.count(),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export default new AdminService();
