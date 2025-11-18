import prisma from '../config/database';
import { AdType, Plan } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../utils/error.util';

export interface CreateAdData {
  title: string;
  description?: string;
  adType: AdType;
  videoUrl: string;
  thumbnailUrl?: string;
  clickUrl?: string;
  targetPlans?: Plan[];
  targetRegions?: string[];
  duration: number;
  skipAfter?: number;
  startDate?: Date;
  endDate?: Date;
  priority?: number;
}

export interface UpdateAdData {
  title?: string;
  description?: string;
  adType?: AdType;
  videoUrl?: string;
  thumbnailUrl?: string;
  clickUrl?: string;
  targetPlans?: Plan[];
  targetRegions?: string[];
  duration?: number;
  skipAfter?: number;
  startDate?: Date;
  endDate?: Date;
  priority?: number;
  isActive?: boolean;
}

export interface RecordAdViewData {
  adId: string;
  userId?: string;
  profileId?: string;
  itemId: string;
  itemType: string;
  wasCompleted: boolean;
  wasSkipped: boolean;
  wasClicked: boolean;
  watchDuration: number;
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
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
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
        adType,
        isActive: true,
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Get ad for playback (with targeting)
   */
  async getAdForPlayback(adType: AdType, userPlan: Plan, region?: string) {
    const now = new Date();

    const ads = await prisma.ad.findMany({
      where: {
        adType,
        isActive: true,
        OR: [
          { targetPlans: { isEmpty: true } },
          { targetPlans: { has: userPlan } },
        ],
        startDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      },
      orderBy: [{ priority: 'desc' }, { impressions: 'asc' }],
      take: 10,
    });

    // Filter by region if specified
    let filteredAds = ads;
    if (region) {
      filteredAds = ads.filter(ad =>
        ad.targetRegions.length === 0 || ad.targetRegions.includes(region)
      );
    }

    // Select random ad from top candidates
    if (filteredAds.length === 0) {
      return null;
    }

    const selectedAd = filteredAds[Math.floor(Math.random() * Math.min(3, filteredAds.length))];

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
        title: data.title,
        description: data.description,
        adType: data.adType,
        videoUrl: data.videoUrl,
        thumbnailUrl: data.thumbnailUrl,
        clickUrl: data.clickUrl,
        targetPlans: data.targetPlans || [],
        targetRegions: data.targetRegions || [],
        duration: data.duration,
        skipAfter: data.skipAfter,
        startDate: data.startDate,
        endDate: data.endDate,
        priority: data.priority || 0,
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
    const ad = await this.getAdById(data.adId);

    // Create view record
    const view = await prisma.adView.create({
      data: {
        adId: data.adId,
        userId: data.userId,
        profileId: data.profileId,
        itemId: data.itemId,
        itemType: data.itemType,
        wasCompleted: data.wasCompleted,
        wasSkipped: data.wasSkipped,
        wasClicked: data.wasClicked,
        watchDuration: data.watchDuration,
      },
    });

    // Update ad analytics
    const updateData: any = {};
    if (data.wasCompleted) {
      updateData.completions = { increment: 1 };
    }
    if (data.wasSkipped) {
      updateData.skips = { increment: 1 };
    }
    if (data.wasClicked) {
      updateData.clicks = { increment: 1 };
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

    const completionRate = ad.impressions > 0
      ? (ad.completions / ad.impressions) * 100
      : 0;

    const clickThroughRate = ad.impressions > 0
      ? (ad.clicks / ad.impressions) * 100
      : 0;

    const skipRate = ad.impressions > 0
      ? (ad.skips / ad.impressions) * 100
      : 0;

    return {
      ad,
      totalViews,
      impressions: ad.impressions,
      completions: ad.completions,
      clicks: ad.clicks,
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

        const completionRate = ad.impressions > 0
          ? Math.round((ad.completions / ad.impressions) * 10000) / 100
          : 0;

        const clickThroughRate = ad.impressions > 0
          ? Math.round((ad.clicks / ad.impressions) * 10000) / 100
          : 0;

        return {
          id: ad.id,
          title: ad.title,
          adType: ad.adType,
          isActive: ad.isActive,
          impressions: ad.impressions,
          completions: ad.completions,
          clicks: ad.clicks,
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
