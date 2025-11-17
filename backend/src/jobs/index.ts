import { logger } from '../utils/logger.util';
import { suspendExpiredDemosJob } from './suspend-expired-demos.job';
import { healthCheckServersJob } from './health-check-servers.job';
import { cleanupJob } from './cleanup.job';

/**
 * Start all cron jobs
 */
export const startCronJobs = (): void => {
  logger.info('Starting cron jobs...');

  // Start all jobs
  suspendExpiredDemosJob.start();
  healthCheckServersJob.start();
  cleanupJob.start();

  logger.info('All cron jobs started successfully');
  logger.info('- Suspend expired demos: Every hour');
  logger.info('- Health check servers: Every 15 minutes');
  logger.info('- Cleanup old data: Daily at 3:00 AM');
};

/**
 * Stop all cron jobs
 */
export const stopCronJobs = (): void => {
  logger.info('Stopping cron jobs...');

  suspendExpiredDemosJob.stop();
  healthCheckServersJob.stop();
  cleanupJob.stop();

  logger.info('All cron jobs stopped');
};
