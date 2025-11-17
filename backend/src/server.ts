import app from './app';
import env from './config/env';
import { logger } from './utils/logger.util';
import prisma from './config/database';
import { startCronJobs, stopCronJobs } from './jobs';

const PORT = env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📝 Environment: ${env.NODE_ENV}`);
  logger.info(`🔗 API URL: http://localhost:${PORT}/api`);

  // Start cron jobs
  if (env.NODE_ENV === 'production' || env.NODE_ENV === 'development') {
    startCronJobs();
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  stopCronJobs();
  server.close(async () => {
    logger.info('HTTP server closed');
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  stopCronJobs();
  server.close(async () => {
    logger.info('HTTP server closed');
    await prisma.$disconnect();
    process.exit(0);
  });
});
