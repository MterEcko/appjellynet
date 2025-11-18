import { Request, Response, NextFunction } from 'express';
import serverDetectionService from '../services/server-detection.service';
import { sendSuccess } from '../utils/response.util';
import { getClientIp } from '../utils/network.util';
import prisma from '../config/database';

export class ServerController {
  async detectServer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientIp = getClientIp(req);

      const result = await serverDetectionService.detectBestServer(clientIp);

      sendSuccess(
        res,
        {
          serverId: result.server.serverId,
          name: result.server.name,
          url: result.server.url,
          latencyMs: result.latency,
          reason: result.reason,
        },
        200
      );
    } catch (error) {
      next(error);
    }
  }

  async getServers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const servers = await prisma.server.findMany({
        where: { isActive: true },
        orderBy: { priority: 'asc' },
        select: {
          id: true,
          serverId: true,
          name: true,
          url: true,
          priority: true,
          isHealthy: true,
          lastHealthCheck: true,
          latency: true,
        },
      });

      sendSuccess(res, servers, 200);
    } catch (error) {
      next(error);
    }
  }

  async healthCheck(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const results = await serverDetectionService.healthCheckAllServers();

      const healthStatus = Array.from(results.entries()).map(([url, result]) => ({
        url,
        healthy: result.success,
        latency: result.latency,
        error: result.error,
      }));

      sendSuccess(res, healthStatus, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new ServerController();
