import prisma from '../config/database';
import { logger } from '../utils/logger.util';

export class FavoriteService {
  /**
   * Add item to favorites
   */
  async addToFavorites(
    profileId: string,
    itemId: string,
    itemType: string,
    itemTitle: string,
    itemData?: any
  ) {
    try {
      const favoriteItem = await prisma.favorite.upsert({
        where: {
          profileId_itemId: {
            profileId,
            itemId,
          },
        },
        update: {},
        create: {
          profileId,
          itemId,
          itemType,
          itemTitle,
          itemData: itemData || null,
        },
      });

      logger.info(`Added item ${itemId} to favorites for profile ${profileId}`);
      return favoriteItem;
    } catch (error: any) {
      logger.error(`Failed to add to favorites: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove item from favorites
   */
  async removeFromFavorites(profileId: string, itemId: string) {
    try {
      await prisma.favorite.delete({
        where: {
          profileId_itemId: {
            profileId,
            itemId,
          },
        },
      });

      logger.info(`Removed item ${itemId} from favorites for profile ${profileId}`);
      return { success: true };
    } catch (error: any) {
      if (error.code === 'P2025') {
        // Record not found
        return { success: true };
      }
      logger.error(`Failed to remove from favorites: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user's favorites
   */
  async getFavorites(profileId: string) {
    try {
      const favorites = await prisma.favorite.findMany({
        where: { profileId },
        orderBy: { addedAt: 'desc' },
      });

      return favorites;
    } catch (error: any) {
      logger.error(`Failed to get favorites: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if item is favorited
   */
  async isFavorited(profileId: string, itemId: string): Promise<boolean> {
    try {
      const item = await prisma.favorite.findUnique({
        where: {
          profileId_itemId: {
            profileId,
            itemId,
          },
        },
      });

      return !!item;
    } catch (error: any) {
      logger.error(`Failed to check favorites: ${error.message}`);
      return false;
    }
  }
}

export default new FavoriteService();
