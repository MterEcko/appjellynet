import cron from 'node-cron';
import serverDetectionService from '../services/server-detection.service';
import { logger } from '../utils/logger.util';

/**
 * Cron job to health check all Jellyfin servers
 * Runs every 15 minutes
 */
export const healthCheckServersJob = cron.schedule('*/15 * * * *', async () => {
  try {
    logger.info('Running health-check-servers job...');

    const results = await serverDetectionService.healthCheckAllServers();

    let healthyCount = 0;
    let unhealthyCount = 0;

    for (const [url, result] of results.entries()) {
      if (result.success) {
        healthyCount++;
        logger.debug(`Server ${url} is healthy (${result.latency}ms)`);
      } else {
        unhealthyCount++;
        logger.warn(`Server ${url} is unhealthy: ${result.error}`);
      }
    }

    logger.info(
      `Health check completed. Healthy: ${healthyCount}, Unhealthy: ${unhealthyCount}`
    );
  } catch (error: any) {
    logger.error(`Error in health-check-servers job: ${error.message}`);
  }
});
