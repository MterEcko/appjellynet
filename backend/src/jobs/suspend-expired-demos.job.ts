import cron from 'node-cron';
import prisma from '../config/database';
import { AccountStatus, Plan } from '@prisma/client';
import { logger } from '../utils/logger.util';

/**
 * Cron job to suspend expired demo accounts
 * Runs every hour
 */
export const suspendExpiredDemosJob = cron.schedule('0 * * * *', async () => {
  try {
    logger.info('Running suspend-expired-demos job...');

    // Find all demo accounts that have expired
    const expiredDemos = await prisma.user.findMany({
      where: {
        plan: Plan.DEMO,
        status: AccountStatus.ACTIVE,
        demoExpiresAt: {
          lte: new Date(),
        },
      },
      include: {
        profiles: true,
      },
    });

    if (expiredDemos.length === 0) {
      logger.info('No expired demo accounts found');
      return;
    }

    logger.info(`Found ${expiredDemos.length} expired demo accounts`);

    for (const account of expiredDemos) {
      try {
        // Update account status
        await prisma.user.update({
          where: { id: account.id },
          data: {
            status: AccountStatus.SUSPENDED,
            suspendedAt: new Date(),
            suspensionReason: 'Demo period expired',
          },
        });

        // TODO: Disable all profiles in Jellyfin
        // This would require server detection and calling Jellyfin API

        // Create audit log
        await prisma.auditLog.create({
          data: {
            userId: account.id,
            action: 'DEMO_EXPIRED',
            entity: 'Account',
            entityId: account.id,
            changes: {
              status: AccountStatus.SUSPENDED,
              reason: 'Demo period expired',
            },
          },
        });

        logger.info(`Demo account expired and suspended: ${account.email}`);

        // TODO: Send email notification about demo expiration
        // with option to upgrade to paid plan
      } catch (error: any) {
        logger.error(`Failed to suspend demo account ${account.id}: ${error.message}`);
      }
    }

    logger.info(`Suspend-expired-demos job completed. Suspended ${expiredDemos.length} accounts`);
  } catch (error: any) {
    logger.error(`Error in suspend-expired-demos job: ${error.message}`);
  }
});
