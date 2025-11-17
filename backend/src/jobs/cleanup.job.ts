import cron from 'node-cron';
import prisma from '../config/database';
import { logger } from '../utils/logger.util';

/**
 * Cron job to clean up old data
 * Runs daily at 3:00 AM
 */
export const cleanupJob = cron.schedule('0 3 * * *', async () => {
  try {
    logger.info('Running cleanup job...');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Delete old webhook deliveries (older than 30 days)
    const deletedWebhookDeliveries = await prisma.webhookDelivery.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    logger.info(`Deleted ${deletedWebhookDeliveries.count} old webhook deliveries`);

    // Delete old audit logs (older than 90 days)
    const deletedAuditLogs = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: ninetyDaysAgo,
        },
      },
    });

    logger.info(`Deleted ${deletedAuditLogs.count} old audit logs`);

    // Delete old ad views (older than 90 days)
    const deletedAdViews = await prisma.adView.deleteMany({
      where: {
        createdAt: {
          lt: ninetyDaysAgo,
        },
      },
    });

    logger.info(`Deleted ${deletedAdViews.count} old ad views`);

    logger.info('Cleanup job completed successfully');
  } catch (error: any) {
    logger.error(`Error in cleanup job: ${error.message}`);
  }
});
