import { Request, Response, NextFunction } from 'express';
import JellyfinApiService from '../services/jellyfin-api.service';
import serverDetectionService from '../services/server-detection.service';
import profileService from '../services/profile.service';
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
      const userId = req.user?.userId;
      const clientIp = getClientIp(req);
      const limit = parseInt(req.query.limit as string) || 16;

      if (!profileId || !userId) {
        throw new Error('Profile not selected');
      }

      // Ensure profile has a Jellyfin user - create one if needed
      const jellyfinUserId = await profileService.ensureJellyfinUser(profileId, userId, clientIp);

      const detectedServer = await serverDetectionService.detectBestServer(clientIp);
      const jellyfinApi = new JellyfinApiService(detectedServer.server.url);

      const items = await jellyfinApi.getLatestMedia(jellyfinUserId, limit);

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
      const userId = req.user?.userId;
      const clientIp = getClientIp(req);

      if (!profileId || !userId) {
        throw new Error('Profile not selected');
      }

      // Ensure profile has a Jellyfin user - create one if needed
      const jellyfinUserId = await profileService.ensureJellyfinUser(profileId, userId, clientIp);

      const detectedServer = await serverDetectionService.detectBestServer(clientIp);
      const jellyfinApi = new JellyfinApiService(detectedServer.server.url);

      const items = await jellyfinApi.getResumeItems(jellyfinUserId);

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
      const userId = req.user?.userId;
      const clientIp = getClientIp(req);
      const { type } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      const startIndex = parseInt(req.query.startIndex as string) || 0;

      if (!profileId || !userId) {
        throw new Error('Profile not selected');
      }

      // Ensure profile has a Jellyfin user - create one if needed
      const jellyfinUserId = await profileService.ensureJellyfinUser(profileId, userId, clientIp);

      const detectedServer = await serverDetectionService.detectBestServer(clientIp);
      const jellyfinApi = new JellyfinApiService(detectedServer.server.url);

      const result = await jellyfinApi.getItemsByType(
        jellyfinUserId,
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
      const userId = req.user?.userId;
      const clientIp = getClientIp(req);
      const searchTerm = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!profileId || !userId) {
        throw new Error('Profile not selected');
      }

      if (!searchTerm) {
        throw new Error('Search term is required');
      }

      // Ensure profile has a Jellyfin user - create one if needed
      const jellyfinUserId = await profileService.ensureJellyfinUser(profileId, userId, clientIp);

      const detectedServer = await serverDetectionService.detectBestServer(clientIp);
      const jellyfinApi = new JellyfinApiService(detectedServer.server.url);

      const items = await jellyfinApi.searchItems(jellyfinUserId, searchTerm, limit);

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
      const userId = req.user?.userId;
      const clientIp = getClientIp(req);
      const { id } = req.params;

      if (!profileId || !userId) {
        throw new Error('Profile not selected');
      }

      // Ensure profile has a Jellyfin user - create one if needed
      const jellyfinUserId = await profileService.ensureJellyfinUser(profileId, userId, clientIp);

      const detectedServer = await serverDetectionService.detectBestServer(clientIp);
      const jellyfinApi = new JellyfinApiService(detectedServer.server.url);

      const item = await jellyfinApi.getItemDetails(jellyfinUserId, id);

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
      const userId = req.user?.userId;
      const clientIp = getClientIp(req);
      const { itemId, positionTicks, isPaused } = req.body;

      if (!profileId || !userId) {
        throw new Error('Profile not selected');
      }

      // Ensure profile has a Jellyfin user - create one if needed
      const jellyfinUserId = await profileService.ensureJellyfinUser(profileId, userId, clientIp);

      const detectedServer = await serverDetectionService.detectBestServer(clientIp);
      const jellyfinApi = new JellyfinApiService(detectedServer.server.url);

      await jellyfinApi.reportPlaybackProgress(jellyfinUserId, itemId, positionTicks, isPaused);

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
      const userId = req.user?.userId;
      const clientIp = getClientIp(req);
      const { itemId, sessionId, positionTicks } = req.body;

      if (!profileId || !userId) {
        throw new Error('Profile not selected');
      }

      // Ensure profile has a Jellyfin user - create one if needed
      const jellyfinUserId = await profileService.ensureJellyfinUser(profileId, userId, clientIp);

      const detectedServer = await serverDetectionService.detectBestServer(clientIp);
      const jellyfinApi = new JellyfinApiService(detectedServer.server.url);

      await jellyfinApi.reportPlaybackStopped(jellyfinUserId, itemId, sessionId, positionTicks);

      sendSuccess(res, { message: 'Playback stopped reported' }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get series seasons
   */
  async getSeasons(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileId = req.user?.profileId;
      const userId = req.user?.userId;
      const clientIp = getClientIp(req);
      const { seriesId } = req.params;

      if (!profileId || !userId) {
        throw new Error('Profile not selected');
      }

      const jellyfinUserId = await profileService.ensureJellyfinUser(profileId, userId, clientIp);

      const detectedServer = await serverDetectionService.detectBestServer(clientIp);
      const jellyfinApi = new JellyfinApiService(detectedServer.server.url);

      const seasons = await jellyfinApi.getSeasons(jellyfinUserId, seriesId);

      sendSuccess(res, seasons, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get season episodes
   */
  async getEpisodes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileId = req.user?.profileId;
      const userId = req.user?.userId;
      const clientIp = getClientIp(req);
      const { seriesId, seasonId } = req.params;

      if (!profileId || !userId) {
        throw new Error('Profile not selected');
      }

      const jellyfinUserId = await profileService.ensureJellyfinUser(profileId, userId, clientIp);

      const detectedServer = await serverDetectionService.detectBestServer(clientIp);
      const jellyfinApi = new JellyfinApiService(detectedServer.server.url);

      const episodes = await jellyfinApi.getEpisodes(jellyfinUserId, seriesId, seasonId);

      sendSuccess(res, episodes, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get similar items
   */
  async getSimilar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileId = req.user?.profileId;
      const userId = req.user?.userId;
      const clientIp = getClientIp(req);
      const { itemId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!profileId || !userId) {
        throw new Error('Profile not selected');
      }

      const jellyfinUserId = await profileService.ensureJellyfinUser(profileId, userId, clientIp);

      const detectedServer = await serverDetectionService.detectBestServer(clientIp);
      const jellyfinApi = new JellyfinApiService(detectedServer.server.url);

      const similar = await jellyfinApi.getSimilarItems(jellyfinUserId, itemId, limit);

      sendSuccess(res, similar, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get items by genre
   */
  async getByGenre(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileId = req.user?.profileId;
      const userId = req.user?.userId;
      const clientIp = getClientIp(req);
      const { genre } = req.params;
      const itemType = req.query.type as string || 'Movie,Series';
      const limit = parseInt(req.query.limit as string) || 50;

      if (!profileId || !userId) {
        throw new Error('Profile not selected');
      }

      const jellyfinUserId = await profileService.ensureJellyfinUser(profileId, userId, clientIp);

      const detectedServer = await serverDetectionService.detectBestServer(clientIp);
      const jellyfinApi = new JellyfinApiService(detectedServer.server.url);

      const items = await jellyfinApi.getItemsByGenre(jellyfinUserId, genre, itemType, limit);

      sendSuccess(res, items, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all genres
   */
  async getGenres(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileId = req.user?.profileId;
      const userId = req.user?.userId;
      const clientIp = getClientIp(req);

      if (!profileId || !userId) {
        throw new Error('Profile not selected');
      }

      const jellyfinUserId = await profileService.ensureJellyfinUser(profileId, userId, clientIp);

      const detectedServer = await serverDetectionService.detectBestServer(clientIp);
      const jellyfinApi = new JellyfinApiService(detectedServer.server.url);

      const genres = await jellyfinApi.getAllGenres(jellyfinUserId);

      sendSuccess(res, genres, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new JellyfinProxyController();
