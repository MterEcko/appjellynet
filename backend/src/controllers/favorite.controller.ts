import { Request, Response, NextFunction } from 'express';
import favoriteService from '../services/favorite.service';
import { sendSuccess, sendError } from '../utils/response.util';

export class FavoriteController {
  /**
   * Add item to favorites
   */
  async addToFavorites(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const result = await favoriteService.addToFavorites(
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
   * Remove item from favorites
   */
  async removeFromFavorites(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileId = req.user?.profileId;
      const { itemId } = req.params;

      if (!profileId) {
        sendError(res, 'UNAUTHORIZED', 'Profile not selected', 401);
        return;
      }

      await favoriteService.removeFromFavorites(profileId, itemId);

      sendSuccess(res, { message: 'Item removed from favorites' }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's favorites
   */
  async getFavorites(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileId = req.user?.profileId;

      if (!profileId) {
        sendError(res, 'UNAUTHORIZED', 'Profile not selected', 401);
        return;
      }

      const favorites = await favoriteService.getFavorites(profileId);

      sendSuccess(res, favorites, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check if item is favorited
   */
  async checkFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profileId = req.user?.profileId;
      const { itemId } = req.params;

      if (!profileId) {
        sendError(res, 'UNAUTHORIZED', 'Profile not selected', 401);
        return;
      }

      const isFavorited = await favoriteService.isFavorited(profileId, itemId);

      sendSuccess(res, { isFavorited }, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new FavoriteController();
