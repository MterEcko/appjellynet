import { Request, Response, NextFunction } from 'express';
import adService from '../services/ad.service';
import { sendSuccess } from '../utils/response.util';

export class AdController {
  /**
   * Get all ads
   */
  async getAllAds(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const ads = await adService.getAllAds(includeInactive);
      sendSuccess(res, ads, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get ad by ID
   */
  async getAdById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const ad = await adService.getAdById(id);
      sendSuccess(res, ad, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get ads by type
   */
  async getAdsByType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { adType } = req.params;
      const ads = await adService.getAdsByType(adType as any);
      sendSuccess(res, ads, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get ad for playback
   */
  async getAdForPlayback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { adType } = req.params;

      const ad = await adService.getAdForPlayback(adType as any);

      if (!ad) {
        sendSuccess(res, null, 200);
        return;
      }

      sendSuccess(res, ad, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new ad
   */
  async createAd(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ad = await adService.createAd(req.body);
      sendSuccess(res, ad, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update ad
   */
  async updateAd(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const ad = await adService.updateAd(id, req.body);
      sendSuccess(res, ad, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete ad
   */
  async deleteAd(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await adService.deleteAd(id);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle ad status
   */
  async toggleAdStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const ad = await adService.toggleAdStatus(id);
      sendSuccess(res, ad, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Record ad view
   */
  async recordAdView(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const view = await adService.recordAdView(req.body);
      sendSuccess(res, view, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get ad analytics
   */
  async getAdAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const analytics = await adService.getAdAnalytics(id);
      sendSuccess(res, analytics, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all ads analytics
   */
  async getAllAdsAnalytics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const analytics = await adService.getAllAdsAnalytics();
      sendSuccess(res, analytics, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new AdController();
