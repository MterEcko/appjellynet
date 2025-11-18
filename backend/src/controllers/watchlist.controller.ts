import { Request, Response, NextFunction } from 'express';
import watchlistService from '../services/watchlist.service';
import { sendSuccess, sendError } from '../utils/response.util';

export class WatchlistController {
  /**
   * Add item to watchlist
   */
  async addToWatchlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileId = req.user?.profileId;
      const { itemId, itemType, itemTitle, itemData } = req.body;

      if (!profileId) {
        sendError(res, 'UNAUTHORIZED', 'Profile not selected', 401);
        return;
      }

      if (!itemId || !itemType || !itemTitle) {
        sendError(res, 'BAD_REQUEST', 'Missing required fields', 400);
        return;
      }

      const result = await watchlistService.addToWatchlist(
        profileId,
        itemId,
        itemType,
        itemTitle,
        itemData
      );

      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove item from watchlist
   */
  async removeFromWatchlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileId = req.user?.profileId;
      const { itemId } = req.params;

      if (!profileId) {
        sendError(res, 'UNAUTHORIZED', 'Profile not selected', 401);
        return;
      }

      await watchlistService.removeFromWatchlist(profileId, itemId);

      sendSuccess(res, { message: 'Item removed from watchlist' }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's watchlist
   */
  async getWatchlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileId = req.user?.profileId;

      if (!profileId) {
        sendError(res, 'UNAUTHORIZED', 'Profile not selected', 401);
        return;
      }

      const watchlist = await watchlistService.getWatchlist(profileId);

      sendSuccess(res, watchlist, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if item is in watchlist
   */
  async checkWatchlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileId = req.user?.profileId;
      const { itemId } = req.params;

      if (!profileId) {
        sendError(res, 'UNAUTHORIZED', 'Profile not selected', 401);
        return;
      }

      const isInWatchlist = await watchlistService.isInWatchlist(profileId, itemId);

      sendSuccess(res, { isInWatchlist }, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new WatchlistController();
