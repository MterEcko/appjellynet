import prisma from '../config/database';
import { isIpInCidr } from '../utils/network.util';
import { pingMultipleServers, PingResult } from '../utils/ping.util';
import { logger } from '../utils/logger.util';
import { Server } from '@prisma/client';

export interface DetectedServer {
  server: Server;
  latency: number;
  reason: string;
}

export class ServerDetectionService {
  private static LATENCY_THRESHOLD = 100; // ms
  private static PING_TIMEOUT = 5000; // ms

  /**
   * Detect the best Jellyfin server for a client based on their IP
   */
  async detectBestServer(clientIp: string): Promise<DetectedServer> {
    logger.info(`Detecting best server for client IP: ${clientIp}`);

    // Get all active servers
    const servers = await prisma.server.findMany({
      where: { isActive: true },
      orderBy: { priority: 'asc' },
    });

    if (servers.length === 0) {
      throw new Error('No active servers configured');
    }

    // Step 1: Find servers matching client's network
    const matchingServers = servers.filter((server) => {
      if (!server.networkCidr) return false;
      return isIpInCidr(clientIp, server.networkCidr);
    });

    logger.debug(`Found ${matchingServers.length} servers matching client network`);

    // Step 2: If no matching servers, use fallback server
    if (matchingServers.length === 0) {
      const fallbackServer = servers.find((s) => s.isFallback);

      if (!fallbackServer) {
        // No fallback configured, use first server
        return {
          server: servers[0],
          latency: 0,
          reason: 'default_server',
        };
      }

      logger.info(`Using fallback server: ${fallbackServer.name}`);

      return {
        server: fallbackServer,
        latency: 0,
        reason: 'fallback',
      };
    }

    // Step 3: Ping matching servers to find the one with lowest latency
    const serverUrls = matchingServers.map((s) => s.url);
    const pingResults = await pingMultipleServers(serverUrls, ServerDetectionService.PING_TIMEOUT);

    // Step 4: Find server with lowest latency
    let bestServer: Server | null = null;
    let lowestLatency = Infinity;

    for (const server of matchingServers) {
      const pingResult = pingResults.get(server.url);

      if (pingResult && pingResult.success) {
        if (pingResult.latency < lowestLatency) {
          lowestLatency = pingResult.latency;
          bestServer = server;
        }
      }
    }

    // Step 5: If all pings failed, return highest priority server
    if (!bestServer) {
      logger.warn('All ping attempts failed, using highest priority matching server');
      bestServer = matchingServers[0];
      lowestLatency = 0;
    }

    // Update server health check
    await prisma.server.update({
      where: { id: bestServer.id },
      data: {
        lastHealthCheck: new Date(),
        isHealthy: lowestLatency < ServerDetectionService.LATENCY_THRESHOLD,
        latency: lowestLatency,
      },
    });

    logger.info(`Selected server: ${bestServer.name} (latency: ${lowestLatency}ms)`);

    return {
      server: bestServer,
      latency: lowestLatency,
      reason: lowestLatency < ServerDetectionService.LATENCY_THRESHOLD ? 'optimal' : 'available',
    };
  }

  /**
   * Health check all servers
   */
  async healthCheckAllServers(): Promise<Map<string, PingResult>> {
    const servers = await prisma.server.findMany({
      where: { isActive: true },
    });

    const serverUrls = servers.map((s) => s.url);
    const pingResults = await pingMultipleServers(serverUrls);

    // Update server health status
    for (const server of servers) {
      const pingResult = pingResults.get(server.url);

      if (pingResult) {
        await prisma.server.update({
          where: { id: server.id },
          data: {
            lastHealthCheck: new Date(),
            isHealthy: pingResult.success,
            latency: pingResult.latency,
          },
        });
      }
    }

    return pingResults;
  }
}

export default new ServerDetectionService();
