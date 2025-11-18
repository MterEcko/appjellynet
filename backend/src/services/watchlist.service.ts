import prisma from '../config/database';
import { logger } from '../utils/logger.util';

export class WatchlistService {
  /**
   * Add item to watchlist
   */
  async addToWatchlist(
    profileId: string,
    itemId: string,
    itemType: string,
    itemTitle: string,
    itemData?: any
  ) {
    try {
      const watchlistItem = await prisma.watchlist.upsert({
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

      logger.info(`Added item ${itemId} to watchlist for profile ${profileId}`);
      return watchlistItem;
    } catch (error: any) {
      logger.error(`Failed to add to watchlist: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove item from watchlist
   */
  async removeFromWatchlist(profileId: string, itemId: string) {
    try {
      await prisma.watchlist.delete({
        where: {
          profileId_itemId: {
            profileId,
            itemId,
          },
        },
      });

      logger.info(`Removed item ${itemId} from watchlist for profile ${profileId}`);
      return { success: true };
    } catch (error: any) {
      if (error.code === 'P2025') {
        // Record not found
        return { success: true };
      }
      logger.error(`Failed to remove from watchlist: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user's watchlist
   */
  async getWatchlist(profileId: string) {
    try {
      const watchlist = await prisma.watchlist.findMany({
        where: { profileId },
        orderBy: { addedAt: 'desc' },
      });

      return watchlist;
    } catch (error: any) {
      logger.error(`Failed to get watchlist: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if item is in watchlist
   */
  async isInWatchlist(profileId: string, itemId: string): Promise<boolean> {
    try {
      const item = await prisma.watchlist.findUnique({
        where: {
          profileId_itemId: {
            profileId,
            itemId,
          },
        },
      });

      return !!item;
    } catch (error: any) {
      logger.error(`Failed to check watchlist: ${error.message}`);
      return false;
    }
  }
}

export default new WatchlistService();
