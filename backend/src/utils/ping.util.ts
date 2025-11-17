import axios from 'axios';
import { logger } from './logger.util';

export interface PingResult {
  success: boolean;
  latency: number; // in milliseconds
  error?: string;
}

/**
 * Measure latency to a server by pinging its health endpoint
 */
export async function pingServer(url: string, timeout: number = 5000): Promise<PingResult> {
  const startTime = Date.now();

  try {
    await axios.get(`${url}/System/Ping`, {
      timeout,
      validateStatus: () => true, // Accept any status code
    });

    const latency = Date.now() - startTime;

    return {
      success: true,
      latency,
    };
  } catch (error: any) {
    const latency = Date.now() - startTime;

    logger.debug(`Ping failed for ${url}: ${error.message}`);

    return {
      success: false,
      latency,
      error: error.message,
    };
  }
}

/**
 * Ping multiple servers and return results
 */
export async function pingMultipleServers(
  urls: string[],
  timeout: number = 5000
): Promise<Map<string, PingResult>> {
  const results = new Map<string, PingResult>();

  const promises = urls.map(async (url) => {
    const result = await pingServer(url, timeout);
    results.set(url, result);
  });

  await Promise.all(promises);

  return results;
}
