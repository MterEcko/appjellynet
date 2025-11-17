import { Request, Response, NextFunction } from 'express';
import JellyfinApiService from '../services/jellyfin-api.service';
import serverDetectionService from '../services/server-detection.service';
import { sendSuccess } from '../utils/response.util';
import { getClientIp } from '../utils/network.util';
import prisma from '../config/database';

export class JellyfinProxyController {
  /**
   * Get latest media items
   */
  async getLatest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileId = req.user?.profileId;
      const clientIp = getClientIp(req);
      const limit = parseInt(req.query.limit as string) || 16;

      if (!profileId) {
        throw new Error('Profile not selected');
      }

      const profile = await prisma.profile.findUnique({
        where: { id: profileId },
      });

      if (!profile) {
        throw new Error('Profile not found');
      }

      const detectedServer = await serverDetectionService.detectBestServer(clientIp);
      const jellyfinApi = new JellyfinApiService(detectedServer.server.url);

      const items = await jellyfinApi.getLatestMedia(profile.jellyfinUserId, limit);

      sendSuccess(res, items, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get resume items (continue watching)
   */
  async getResume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileId = req.user?.profileId;
      const clientIp = getClientIp(req);

      if (!profileId) {
        throw new Error('Profile not selected');
      }

      const profile = await prisma.profile.findUnique({
        where: { id: profileId },
      });

      if (!profile) {
        throw new Error('Profile not found');
      }

      const detectedServer = await serverDetectionService.detectBestServer(clientIp);
      const jellyfinApi = new JellyfinApiService(detectedServer.server.url);

      const items = await jellyfinApi.getResumeItems(profile.jellyfinUserId);

      sendSuccess(res, items, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get items by type
   */
  async getItemsByType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileId = req.user?.profileId;
      const clientIp = getClientIp(req);
      const { type } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      const startIndex = parseInt(req.query.startIndex as string) || 0;

      if (!profileId) {
        throw new Error('Profile not selected');
      }

      const profile = await prisma.profile.findUnique({
        where: { id: profileId },
      });

      if (!profile) {
        throw new Error('Profile not found');
      }

      const detectedServer = await serverDetectionService.detectBestServer(clientIp);
      const jellyfinApi = new JellyfinApiService(detectedServer.server.url);

      const result = await jellyfinApi.getItemsByType(
        profile.jellyfinUserId,
        type,
        limit,
        startIndex
      );

      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search items
   */
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileId = req.user?.profileId;
      const clientIp = getClientIp(req);
      const searchTerm = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!profileId) {
        throw new Error('Profile not selected');
      }

      if (!searchTerm) {
        throw new Error('Search term is required');
      }

      const profile = await prisma.profile.findUnique({
        where: { id: profileId },
      });

      if (!profile) {
        throw new Error('Profile not found');
      }

      const detectedServer = await serverDetectionService.detectBestServer(clientIp);
      const jellyfinApi = new JellyfinApiService(detectedServer.server.url);

      const items = await jellyfinApi.searchItems(profile.jellyfinUserId, searchTerm, limit);

      sendSuccess(res, items, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get item details
   */
  async getItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileId = req.user?.profileId;
      const clientIp = getClientIp(req);
      const { id } = req.params;

      if (!profileId) {
        throw new Error('Profile not selected');
      }

      const profile = await prisma.profile.findUnique({
        where: { id: profileId },
      });

      if (!profile) {
        throw new Error('Profile not found');
      }

      const detectedServer = await serverDetectionService.detectBestServer(clientIp);
      const jellyfinApi = new JellyfinApiService(detectedServer.server.url);

      const item = await jellyfinApi.getItemDetails(profile.jellyfinUserId, id);

      sendSuccess(res, item, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Report playback progress
   */
  async reportProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileId = req.user?.profileId;
      const clientIp = getClientIp(req);
      const { itemId, positionTicks, isPaused } = req.body;

      if (!profileId) {
        throw new Error('Profile not selected');
      }

      const profile = await prisma.profile.findUnique({
        where: { id: profileId },
      });

      if (!profile) {
        throw new Error('Profile not found');
      }

      const detectedServer = await serverDetectionService.detectBestServer(clientIp);
      const jellyfinApi = new JellyfinApiService(detectedServer.server.url);

      await jellyfinApi.reportPlaybackProgress(profile.jellyfinUserId, itemId, positionTicks, isPaused);

      sendSuccess(res, { message: 'Progress reported' }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Report playback stopped
   */
  async reportStopped(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileId = req.user?.profileId;
      const clientIp = getClientIp(req);
      const { itemId, positionTicks } = req.body;

      if (!profileId) {
        throw new Error('Profile not selected');
      }

      const profile = await prisma.profile.findUnique({
        where: { id: profileId },
      });

      if (!profile) {
        throw new Error('Profile not found');
      }

      const detectedServer = await serverDetectionService.detectBestServer(clientIp);
      const jellyfinApi = new JellyfinApiService(detectedServer.server.url);

      await jellyfinApi.reportPlaybackStopped(profile.jellyfinUserId, itemId, positionTicks);

      sendSuccess(res, { message: 'Playback stopped reported' }, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new JellyfinProxyController();
