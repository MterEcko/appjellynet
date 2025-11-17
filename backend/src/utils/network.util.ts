import { logger } from './logger.util';

/**
 * Check if an IP address is within a CIDR range
 */
export function isIpInCidr(ip: string, cidr: string): boolean {
  try {
    const [range, bits] = cidr.split('/');
    const mask = ~(2 ** (32 - parseInt(bits)) - 1);

    return (ipToInt(ip) & mask) === (ipToInt(range) & mask);
  } catch (error) {
    logger.error(`Error checking IP in CIDR: ${error}`);
    return false;
  }
}

/**
 * Convert IP address string to integer
 */
export function ipToInt(ip: string): number {
  return ip
    .split('.')
    .reduce((int, oct) => (int << 8) + parseInt(oct, 10), 0) >>> 0;
}

/**
 * Extract client IP from request
 * Handles proxies and Cloudflare Tunnel
 */
export function getClientIp(req: any): string {
  const forwardedFor = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const cfConnectingIp = req.headers['cf-connecting-ip']; // Cloudflare

  if (cfConnectingIp) {
    return Array.isArray(cfConnectingIp) ? cfConnectingIp[0] : cfConnectingIp;
  }

  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ips.split(',')[0].trim();
  }

  return req.connection.remoteAddress || req.socket.remoteAddress || '0.0.0.0';
}
