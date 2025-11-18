import { Request, Response } from 'express';
import adService from '../services/ad.service';
import { sendSuccess, sendError } from '../utils/response.util';
import { AdType } from '@prisma/client';
import { z } from 'zod';

// Validation schemas
const createAdSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.nativeEnum(AdType),
  duration: z.number().positive(),
  url: z.string().url().optional(),
  skipAfter: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  targetAudience: z.any().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const updateAdSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  type: z.nativeEnum(AdType).optional(),
  duration: z.number().positive().optional(),
  url: z.string().url().optional(),
  skipAfter: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  isActive: z.boolean().optional(),
  targetAudience: z.any().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const trackAdViewSchema = z.object({
  adId: z.string().uuid(),
  contentId: z.string().optional(),
  completed: z.boolean(),
  skipped: z.boolean(),
  watchedSeconds: z.number().min(0),
});

const selectAdSchema = z.object({
  type: z.nativeEnum(AdType),
  contentId: z.string().optional(),
});

/**
 * Create a new ad
 * POST /api/ads
 */
export const createAd = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = createAdSchema.parse(req.body);

    // Handle file upload if present
    let url = validatedData.url;
    if (req.file) {
      url = `/uploads/ads/${req.file.filename}`;
    }

    const ad = await adService.createAd({
      ...validatedData,
      url,
      startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
    });

    sendSuccess(res, ad, 'Ad created successfully', 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendError(res, 'VALIDATION_ERROR', error.errors[0].message, 400);
    }
    sendError(res, 'CREATE_AD_ERROR', error.message, 500);
  }
};

/**
 * Get all ads
 * GET /api/ads
 */
export const getAds = async (req: Request, res: Response): Promise<void> => {
  try {
    const type = req.query.type as AdType | undefined;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const result = await adService.getAds({
      type,
      isActive,
      page,
      limit,
    });

    sendSuccess(res, result, 'Ads retrieved successfully');
  } catch (error: any) {
    sendError(res, 'GET_ADS_ERROR', error.message, 500);
  }
};

/**
 * Get ad by ID
 * GET /api/ads/:id
 */
export const getAdById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const ad = await adService.getAdById(id);

    sendSuccess(res, ad, 'Ad retrieved successfully');
  } catch (error: any) {
    if (error.message === 'Ad not found') {
      return sendError(res, 'AD_NOT_FOUND', error.message, 404);
    }
    sendError(res, 'GET_AD_ERROR', error.message, 500);
  }
};

/**
 * Update ad
 * PUT /api/ads/:id
 */
export const updateAd = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const validatedData = updateAdSchema.parse(req.body);

    // Handle file upload if present
    let url = validatedData.url;
    if (req.file) {
      url = `/uploads/ads/${req.file.filename}`;
    }

    const ad = await adService.updateAd(id, {
      ...validatedData,
      url,
      startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
    });

    sendSuccess(res, ad, 'Ad updated successfully');
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendError(res, 'VALIDATION_ERROR', error.errors[0].message, 400);
    }
    if (error.message === 'Ad not found') {
      return sendError(res, 'AD_NOT_FOUND', error.message, 404);
    }
    sendError(res, 'UPDATE_AD_ERROR', error.message, 500);
  }
};

/**
 * Delete ad
 * DELETE /api/ads/:id
 */
export const deleteAd = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await adService.deleteAd(id);

    sendSuccess(res, null, 'Ad deleted successfully');
  } catch (error: any) {
    if (error.message === 'Ad not found') {
      return sendError(res, 'AD_NOT_FOUND', error.message, 404);
    }
    sendError(res, 'DELETE_AD_ERROR', error.message, 500);
  }
};

/**
 * Select ad for playback
 * POST /api/ads/select
 */
export const selectAd = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = selectAdSchema.parse(req.body);
    const profileId = req.user?.profileId;

    if (!profileId) {
      return sendError(res, 'PROFILE_REQUIRED', 'Profile ID is required', 400);
    }

    const ad = await adService.selectAd({
      type: validatedData.type,
      profileId,
      contentId: validatedData.contentId,
    });

    if (!ad) {
      return sendSuccess(res, null, 'No ad available');
    }

    sendSuccess(res, ad, 'Ad selected successfully');
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendError(res, 'VALIDATION_ERROR', error.errors[0].message, 400);
    }
    sendError(res, 'SELECT_AD_ERROR', error.message, 500);
  }
};

/**
 * Track ad view
 * POST /api/ads/track
 */
export const trackAdView = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = trackAdViewSchema.parse(req.body);
    const profileId = req.user?.profileId;

    if (!profileId) {
      return sendError(res, 'PROFILE_REQUIRED', 'Profile ID is required', 400);
    }

    await adService.trackAdView({
      adId: validatedData.adId,
      profileId,
      contentId: validatedData.contentId,
      completed: validatedData.completed,
      skipped: validatedData.skipped,
      watchedSeconds: validatedData.watchedSeconds,
    });

    sendSuccess(res, null, 'Ad view tracked successfully');
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return sendError(res, 'VALIDATION_ERROR', error.errors[0].message, 400);
    }
    if (error.message === 'Ad not found') {
      return sendError(res, 'AD_NOT_FOUND', error.message, 404);
    }
    sendError(res, 'TRACK_AD_VIEW_ERROR', error.message, 500);
  }
};

/**
 * Get ad statistics
 * GET /api/ads/stats
 */
export const getAdStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await adService.getAdStats();

    sendSuccess(res, stats, 'Ad statistics retrieved successfully');
  } catch (error: any) {
    sendError(res, 'GET_AD_STATS_ERROR', error.message, 500);
  }
};

/**
 * Get ad analytics
 * GET /api/ads/:id/analytics
 */
export const getAdAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const analytics = await adService.getAdAnalytics(id);

    sendSuccess(res, analytics, 'Ad analytics retrieved successfully');
  } catch (error: any) {
    if (error.message === 'Ad not found') {
      return sendError(res, 'AD_NOT_FOUND', error.message, 404);
    }
    sendError(res, 'GET_AD_ANALYTICS_ERROR', error.message, 500);
  }
};

/**
 * Calculate mid-roll positions
 * POST /api/ads/midroll-positions
 */
export const calculateMidrollPositions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contentDurationSeconds, midrollCount } = req.body;

    if (!contentDurationSeconds || typeof contentDurationSeconds !== 'number') {
      return sendError(res, 'VALIDATION_ERROR', 'contentDurationSeconds is required', 400);
    }

    const positions = adService.calculateMidrollPositions(
      contentDurationSeconds,
      midrollCount || 2
    );

    sendSuccess(res, { positions }, 'Mid-roll positions calculated successfully');
  } catch (error: any) {
    sendError(res, 'CALCULATE_MIDROLL_ERROR', error.message, 500);
  }
};
