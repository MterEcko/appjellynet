import prisma from '../config/database';
import { Ad, AdType, Prisma } from '@prisma/client';
import { logger } from '../utils/logger.util';
import { BadRequestError, NotFoundError } from '../utils/error.util';
import fs from 'fs/promises';
import path from 'path';

export interface CreateAdData {
  title: string;
  type: AdType;
  duration: number;
  url?: string;
  skipAfter?: number;
  weight?: number;
  targetAudience?: any;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateAdData {
  title?: string;
  type?: AdType;
  duration?: number;
  url?: string;
  skipAfter?: number;
  weight?: number;
  isActive?: boolean;
  targetAudience?: any;
  startDate?: Date;
  endDate?: Date;
}

export interface GetAdsFilters {
  type?: AdType;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface AdSelectionOptions {
  type: AdType;
  profileId: string;
  contentId?: string;
}

export interface TrackAdViewData {
  adId: string;
  profileId: string;
  contentId?: string;
  completed: boolean;
  skipped: boolean;
  watchedSeconds: number;
}

export interface AdStats {
  totalAds: number;
  activeAds: number;
  totalViews: number;
  totalCompletions: number;
  totalSkips: number;
  completionRate: number;
  adsByType: {
    type: AdType;
    count: number;
  }[];
}

class AdService {
  /**
   * Create a new ad
   */
  async createAd(data: CreateAdData): Promise<Ad> {
    logger.info(`Creating ad: ${data.title}`);

    const ad = await prisma.ad.create({
      data: {
        title: data.title,
        type: data.type,
        duration: data.duration,
        url: data.url || '',
        skipAfter: data.skipAfter,
        weight: data.weight || 1,
        targetAudience: data.targetAudience || Prisma.JsonNull,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: true,
      },
    });

    logger.info(`Ad created successfully: ${ad.id}`);
    return ad;
  }

  /**
   * Get ad by ID
   */
  async getAdById(adId: string): Promise<Ad> {
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
    });

    if (!ad) {
      throw new NotFoundError('Ad not found');
    }

    return ad;
  }

  /**
   * Get all ads with filters
   */
  async getAds(filters: GetAdsFilters = {}): Promise<{
    ads: Ad[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AdWhereInput = {};

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [ads, total] = await Promise.all([
      prisma.ad.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.ad.count({ where }),
    ]);

    return {
      ads,
      total,
      page,
      limit,
    };
  }

  /**
   * Update ad
   */
  async updateAd(adId: string, data: UpdateAdData): Promise<Ad> {
    logger.info(`Updating ad: ${adId}`);

    // Check if ad exists
    await this.getAdById(adId);

    const ad = await prisma.ad.update({
      where: { id: adId },
      data: {
        title: data.title,
        type: data.type,
        duration: data.duration,
        url: data.url,
        skipAfter: data.skipAfter,
        weight: data.weight,
        isActive: data.isActive,
        targetAudience: data.targetAudience !== undefined ? data.targetAudience : undefined,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });

    logger.info(`Ad updated successfully: ${ad.id}`);
    return ad;
  }

  /**
   * Delete ad
   */
  async deleteAd(adId: string): Promise<void> {
    logger.info(`Deleting ad: ${adId}`);

    const ad = await this.getAdById(adId);

    // Delete associated file if exists
    if (ad.url && ad.url.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'uploads', path.basename(ad.url));
      try {
        await fs.unlink(filePath);
        logger.info(`Deleted ad file: ${filePath}`);
      } catch (error: any) {
        logger.warn(`Failed to delete ad file: ${error.message}`);
      }
    }

    // Delete ad views
    await prisma.adView.deleteMany({
      where: { adId },
    });

    // Delete ad
    await prisma.ad.delete({
      where: { id: adId },
    });

    logger.info(`Ad deleted successfully: ${adId}`);
  }

  /**
   * Select ad for playback using weighted random selection
   */
  async selectAd(options: AdSelectionOptions): Promise<Ad | null> {
    const now = new Date();

    // Get eligible ads
    const eligibleAds = await prisma.ad.findMany({
      where: {
        type: options.type,
        isActive: true,
        OR: [
          {
            startDate: null,
            endDate: null,
          },
          {
            startDate: { lte: now },
            endDate: { gte: now },
          },
          {
            startDate: { lte: now },
            endDate: null,
          },
          {
            startDate: null,
            endDate: { gte: now },
          },
        ],
      },
    });

    if (eligibleAds.length === 0) {
      logger.info(`No eligible ads found for type: ${options.type}`);
      return null;
    }

    // Calculate total weight
    const totalWeight = eligibleAds.reduce((sum, ad) => sum + ad.weight, 0);

    // Weighted random selection
    let random = Math.random() * totalWeight;
    let selectedAd: Ad | null = null;

    for (const ad of eligibleAds) {
      random -= ad.weight;
      if (random <= 0) {
        selectedAd = ad;
        break;
      }
    }

    // Fallback to last ad if none selected
    if (!selectedAd) {
      selectedAd = eligibleAds[eligibleAds.length - 1];
    }

    // Increment impressions
    await prisma.ad.update({
      where: { id: selectedAd.id },
      data: {
        impressions: {
          increment: 1,
        },
      },
    });

    logger.info(`Selected ad: ${selectedAd.id} (${selectedAd.title}) for type: ${options.type}`);
    return selectedAd;
  }

  /**
   * Track ad view
   */
  async trackAdView(data: TrackAdViewData): Promise<void> {
    logger.info(`Tracking ad view: ${data.adId}`);

    // Check if ad exists
    await this.getAdById(data.adId);

    // Create ad view record
    await prisma.adView.create({
      data: {
        adId: data.adId,
        profileId: data.profileId,
        contentId: data.contentId,
        completed: data.completed,
        skipped: data.skipped,
        watchedSeconds: data.watchedSeconds,
      },
    });

    // Update ad statistics
    const updateData: any = {};

    if (data.completed) {
      updateData.completions = {
        increment: 1,
      };
    }

    if (data.skipped) {
      updateData.skips = {
        increment: 1,
      };
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.ad.update({
        where: { id: data.adId },
        data: updateData,
      });
    }

    logger.info(`Ad view tracked successfully: ${data.adId}`);
  }

  /**
   * Get ad statistics
   */
  async getAdStats(): Promise<AdStats> {
    const [totalAds, activeAds, totalViews, adsByType] = await Promise.all([
      prisma.ad.count(),
      prisma.ad.count({ where: { isActive: true } }),
      prisma.adView.count(),
      prisma.ad.groupBy({
        by: ['type'],
        _count: {
          id: true,
        },
      }),
    ]);

    // Calculate completion stats
    const completionStats = await prisma.ad.aggregate({
      _sum: {
        completions: true,
        skips: true,
      },
    });

    const totalCompletions = completionStats._sum.completions || 0;
    const totalSkips = completionStats._sum.skips || 0;
    const completionRate = totalViews > 0 ? (totalCompletions / totalViews) * 100 : 0;

    return {
      totalAds,
      activeAds,
      totalViews,
      totalCompletions,
      totalSkips,
      completionRate: Math.round(completionRate * 100) / 100,
      adsByType: adsByType.map((item) => ({
        type: item.type,
        count: item._count.id,
      })),
    };
  }

  /**
   * Get ad analytics
   */
  async getAdAnalytics(adId: string): Promise<{
    ad: Ad;
    views: number;
    completions: number;
    skips: number;
    completionRate: number;
    avgWatchTime: number;
  }> {
    const ad = await this.getAdById(adId);

    const [views, viewStats] = await Promise.all([
      prisma.adView.count({
        where: { adId },
      }),
      prisma.adView.aggregate({
        where: { adId },
        _count: {
          id: true,
        },
        _avg: {
          watchedSeconds: true,
        },
      }),
    ]);

    const completionRate = views > 0 ? (ad.completions / views) * 100 : 0;

    return {
      ad,
      views,
      completions: ad.completions,
      skips: ad.skips,
      completionRate: Math.round(completionRate * 100) / 100,
      avgWatchTime: Math.round((viewStats._avg.watchedSeconds || 0) * 100) / 100,
    };
  }

  /**
   * Calculate mid-roll positions for content
   */
  calculateMidrollPositions(contentDurationSeconds: number, midrollCount: number = 2): number[] {
    if (contentDurationSeconds < 600) {
      // No mid-rolls for content shorter than 10 minutes
      return [];
    }

    const positions: number[] = [];
    const interval = contentDurationSeconds / (midrollCount + 1);

    for (let i = 1; i <= midrollCount; i++) {
      positions.push(Math.floor(interval * i));
    }

    return positions;
  }
}

export default new AdService();
