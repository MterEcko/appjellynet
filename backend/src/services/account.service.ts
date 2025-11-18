import prisma from '../config/database';
import { NotFoundError } from '../utils/error.util';
import { User, Plan, AccountType, AccountStatus } from '@prisma/client';
import { hashPassword } from '../utils/bcrypt.util';
import profileService from './profile.service';
import JellyfinApiService from './jellyfin-api.service';
import serverDetectionService from './server-detection.service';
import { logger } from '../utils/logger.util';

export interface CreateAccountData {
  email: string;
  password: string;
  plan: Plan;
  accountType: AccountType;
  profilesCount?: number;
  wispCustomerId?: string;
  demoDurationDays?: number;
}

export class AccountService {
  /**
   * Get account info by user ID
   */
  async getAccount(userId: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('Account not found');
    }

    const { passwordHash, ...accountWithoutPassword } = user;

    return accountWithoutPassword;
  }

  /**
   * Get account with profiles
   */
  async getAccountWithProfiles(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profiles: true,
        subscriptions: true,
      },
    });

    if (!user) {
      throw new NotFoundError('Account not found');
    }

    const { passwordHash, ...accountWithoutPassword } = user;

    return accountWithoutPassword;
  }

  /**
   * Create a new account (Admin only)
   */
  async createAccount(data: CreateAccountData, clientIp: string): Promise<User> {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Calculate demo expiration if needed
    let demoExpiresAt: Date | undefined;
    if (data.accountType === AccountType.DEMO && data.demoDurationDays) {
      demoExpiresAt = new Date();
      demoExpiresAt.setDate(demoExpiresAt.getDate() + data.demoDurationDays);
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        plan: data.plan,
        accountType: data.accountType,
        status: AccountStatus.ACTIVE,
        wispCustomerId: data.wispCustomerId,
        demoDurationDays: data.demoDurationDays,
        demoExpiresAt,
      },
    });

    // Create profiles based on plan
    const profilesCount = data.profilesCount || this.getDefaultProfilesCount(data.plan);

    for (let i = 0; i < profilesCount; i++) {
      await profileService.createProfile(
        {
          userId: user.id,
          name: i === 0 ? 'Principal' : `Perfil ${i + 1}`,
        },
        clientIp
      );
    }

    logger.info(`Account created: ${user.email} with ${profilesCount} profiles`);

    // TODO: Send welcome email

    return user;
  }

  /**
   * Update account
   */
  async updateAccount(
    userId: string,
    data: Partial<Pick<User, 'email' | 'plan' | 'status'>>
  ): Promise<Omit<User, 'passwordHash'>> {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });

    const { passwordHash, ...accountWithoutPassword } = user;

    return accountWithoutPassword;
  }

  /**
   * Suspend account
   */
  async suspendAccount(userId: string, reason: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: AccountStatus.SUSPENDED,
        suspendedAt: new Date(),
        suspensionReason: reason,
      },
    });

    // Disable all profiles in Jellyfin
    // TODO: Implement this properly with server detection
    logger.info(`Account suspended: ${userId} - Reason: ${reason}`);
  }

  /**
   * Reactivate suspended account
   */
  async reactivateAccount(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: AccountStatus.ACTIVE,
        suspendedAt: null,
        suspensionReason: null,
      },
    });

    // Enable all profiles in Jellyfin
    // TODO: Implement this properly with server detection
    logger.info(`Account reactivated: ${userId}`);
  }

  /**
   * Update password for account and all Jellyfin profiles
   */
  async updatePassword(
    userId: string,
    newPassword: string,
    clientIp: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profiles: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Update password in database
    const newPasswordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Update password in Jellyfin for all profiles
    try {
      const detectedServer = await serverDetectionService.detectBestServer(clientIp);
      const jellyfinApi = new JellyfinApiService(detectedServer.server.url);

      for (const profile of user.profiles) {
        await jellyfinApi.updateUserPassword(profile.jellyfinUserId, newPassword);
      }

      logger.info(`Password updated for user ${userId} and all profiles in Jellyfin`);
    } catch (error: any) {
      logger.error(`Failed to update Jellyfin passwords: ${error.message}`);
      throw new Error('Failed to update password in Jellyfin');
    }
  }

  /**
   * Get default profiles count based on plan
   */
  private getDefaultProfilesCount(plan: Plan): number {
    switch (plan) {
      case Plan.BASIC:
        return 3;
      case Plan.PREMIUM:
        return 8;
      case Plan.DEMO:
        return 4;
      default:
        return 3;
    }
  }
}

export default new AccountService();
