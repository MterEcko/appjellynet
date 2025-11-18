import prisma from '../config/database';
import { AdType } from '@prisma/client';
import { NotFoundError } from '../utils/error.util';

export interface CreateAdData {
  type: AdType;
  title: string;
  campaignName?: string;
  filePath?: string;
  url?: string;
  thumbnailPath?: string;
  duration?: number;
  skipAfter?: number;
  weight?: number;
  clickUrl?: string;
  targetAudience?: any;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateAdData {
  type?: AdType;
  title?: string;
  campaignName?: string;
  filePath?: string;
  url?: string;
  thumbnailPath?: string;
  duration?: number;
  skipAfter?: number;
  weight?: number;
  clickUrl?: string;
  targetAudience?: any;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
}

export interface RecordAdViewData {
  adId: string;
  userId?: string;
  profileId?: string;
  contentId?: string;
  completed: boolean;
  skipped: boolean;
  clicked?: boolean;
  watchedSeconds: number;
  ipAddress?: string;
  userAgent?: string;
}

export class AdService {
  /**
   * Get all ads
   */
  async getAllAds(includeInactive: boolean = false) {
    const where: any = {};

    if (!includeInactive) {
      where.isActive = true;
    }

    return await prisma.ad.findMany({
      where,
      orderBy: [{ weight: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Get ad by ID
   */
  async getAdById(id: string) {
    const ad = await prisma.ad.findUnique({
      where: { id },
    });

    if (!ad) {
      throw new NotFoundError('Ad not found');
    }

    return ad;
  }

  /**
   * Get ads by type
   */
  async getAdsByType(adType: AdType) {
    const now = new Date();

    return await prisma.ad.findMany({
      where: {
        type: adType,
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
      },
      orderBy: [{ weight: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Get ad for playback (with targeting)
   */
  async getAdForPlayback(adType: AdType) {
    const now = new Date();

    const ads = await prisma.ad.findMany({
      where: {
        type: adType,
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
      },
      orderBy: [{ weight: 'desc' }, { impressions: 'asc' }],
      take: 10,
    });

    // Filter by date range
    const validAds = ads.filter(ad => {
      if (ad.endDate && ad.endDate < now) {
        return false;
      }
      return true;
    });

    // Select random ad from top candidates weighted by priority
    if (validAds.length === 0) {
      return null;
    }

    const selectedAd = validAds[Math.floor(Math.random() * Math.min(3, validAds.length))];

    // Increment impressions
    await prisma.ad.update({
      where: { id: selectedAd.id },
      data: { impressions: { increment: 1 } },
    });

    return selectedAd;
  }

  /**
   * Create new ad
   */
  async createAd(data: CreateAdData) {
    return await prisma.ad.create({
      data: {
        type: data.type,
        title: data.title,
        campaignName: data.campaignName,
        filePath: data.filePath,
        url: data.url,
        thumbnailPath: data.thumbnailPath,
        duration: data.duration,
        skipAfter: data.skipAfter,
        weight: data.weight ?? 5,
        clickUrl: data.clickUrl,
        targetAudience: data.targetAudience,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });
  }

  /**
   * Update ad
   */
  async updateAd(id: string, data: UpdateAdData) {
    await this.getAdById(id);

    return await prisma.ad.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete ad
   */
  async deleteAd(id: string) {
    await this.getAdById(id);

    await prisma.ad.delete({
      where: { id },
    });

    return { message: 'Ad deleted successfully' };
  }

  /**
   * Toggle ad active status
   */
  async toggleAdStatus(id: string) {
    const ad = await this.getAdById(id);

    return await prisma.ad.update({
      where: { id },
      data: { isActive: !ad.isActive },
    });
  }

  /**
   * Record ad view
   */
  async recordAdView(data: RecordAdViewData) {
    await this.getAdById(data.adId);

    // Create view record
    const view = await prisma.adView.create({
      data: {
        adId: data.adId,
        userId: data.userId,
        profileId: data.profileId,
        contentId: data.contentId,
        impression: true,
        started: true,
        completed: data.completed,
        skipped: data.skipped,
        clicked: data.clicked ?? false,
        watchedSeconds: data.watchedSeconds,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });

    // Update ad analytics
    const updateData: any = {};
    if (data.completed) {
      updateData.completions = { increment: 1 };
    }
    if (data.skipped) {
      updateData.skips = { increment: 1 };
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.ad.update({
        where: { id: data.adId },
        data: updateData,
      });
    }

    return view;
  }

  /**
   * Get ad analytics
   */
  async getAdAnalytics(id: string) {
    const ad = await this.getAdById(id);

    const totalViews = await prisma.adView.count({
      where: { adId: id },
    });

    const clicks = await prisma.adView.count({
      where: { adId: id, clicked: true },
    });

    const completionRate = ad.impressions > 0
      ? (ad.completions / ad.impressions) * 100
      : 0;

    const clickThroughRate = ad.impressions > 0
      ? (clicks / ad.impressions) * 100
      : 0;

    const skipRate = ad.impressions > 0
      ? (ad.skips / ad.impressions) * 100
      : 0;

    return {
      ad,
      totalViews,
      impressions: ad.impressions,
      completions: ad.completions,
      clicks,
      skips: ad.skips,
      completionRate: Math.round(completionRate * 100) / 100,
      clickThroughRate: Math.round(clickThroughRate * 100) / 100,
      skipRate: Math.round(skipRate * 100) / 100,
    };
  }

  /**
   * Get all ads analytics
   */
  async getAllAdsAnalytics() {
    const ads = await prisma.ad.findMany({
      orderBy: { impressions: 'desc' },
    });

    const analytics = await Promise.all(
      ads.map(async (ad) => {
        const totalViews = await prisma.adView.count({
          where: { adId: ad.id },
        });

        const clicks = await prisma.adView.count({
          where: { adId: ad.id, clicked: true },
        });

        const completionRate = ad.impressions > 0
          ? Math.round((ad.completions / ad.impressions) * 10000) / 100
          : 0;

        const clickThroughRate = ad.impressions > 0
          ? Math.round((clicks / ad.impressions) * 10000) / 100
          : 0;

        return {
          id: ad.id,
          title: ad.title,
          type: ad.type,
          isActive: ad.isActive,
          impressions: ad.impressions,
          completions: ad.completions,
          clicks,
          skips: ad.skips,
          totalViews,
          completionRate,
          clickThroughRate,
        };
      })
    );

    return analytics;
  }
}

export default new AdService();
