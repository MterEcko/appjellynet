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

    sendSuccess(res, ad, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      sendError(res, 'VALIDATION_ERROR', error.errors[0].message, 400);
    return;
    }
    sendError(res, 'CREATE_AD_ERROR', error.message, 500);
    return;
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

    sendSuccess(res, result);
  } catch (error: any) {
    sendError(res, 'GET_ADS_ERROR', error.message, 500);
    return;
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

    sendSuccess(res, ad);
  } catch (error: any) {
    if (error.message === 'Ad not found') {
      sendError(res, 'AD_NOT_FOUND', error.message, 404);
    return;
    }
    sendError(res, 'GET_AD_ERROR', error.message, 500);
    return;
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

    sendSuccess(res, ad);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      sendError(res, 'VALIDATION_ERROR', error.errors[0].message, 400);
    return;
    }
    if (error.message === 'Ad not found') {
      sendError(res, 'AD_NOT_FOUND', error.message, 404);
    return;
    }
    sendError(res, 'UPDATE_AD_ERROR', error.message, 500);
    return;
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

    sendSuccess(res, null);
  } catch (error: any) {
    if (error.message === 'Ad not found') {
      sendError(res, 'AD_NOT_FOUND', error.message, 404);
    return;
    }
    sendError(res, 'DELETE_AD_ERROR', error.message, 500);
    return;
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
      sendError(res, 'PROFILE_REQUIRED', 'Profile ID is required', 400);
    return;
    }

    const ad = await adService.selectAd({
      type: validatedData.type,
      profileId,
      contentId: validatedData.contentId,
    });

    if (!ad) {
      sendSuccess(res, null); return;
    }

    sendSuccess(res, ad);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      sendError(res, 'VALIDATION_ERROR', error.errors[0].message, 400);
    return;
    }
    sendError(res, 'SELECT_AD_ERROR', error.message, 500);
    return;
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
      sendError(res, 'PROFILE_REQUIRED', 'Profile ID is required', 400);
    return;
    }

    await adService.trackAdView({
      adId: validatedData.adId,
      profileId,
      contentId: validatedData.contentId,
      completed: validatedData.completed,
      skipped: validatedData.skipped,
      watchedSeconds: validatedData.watchedSeconds,
    });

    sendSuccess(res, null);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      sendError(res, 'VALIDATION_ERROR', error.errors[0].message, 400);
    return;
    }
    if (error.message === 'Ad not found') {
      sendError(res, 'AD_NOT_FOUND', error.message, 404);
    return;
    }
    sendError(res, 'TRACK_AD_VIEW_ERROR', error.message, 500);
    return;
  }
};

/**
 * Get ad statistics
 * GET /api/ads/stats
 */
export const getAdStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await adService.getAdStats();

    sendSuccess(res, stats);
  } catch (error: any) {
    sendError(res, 'GET_AD_STATS_ERROR', error.message, 500);
    return;
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

    sendSuccess(res, analytics);
  } catch (error: any) {
    if (error.message === 'Ad not found') {
      sendError(res, 'AD_NOT_FOUND', error.message, 404);
    return;
    }
    sendError(res, 'GET_AD_ANALYTICS_ERROR', error.message, 500);
    return;
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
      sendError(res, 'VALIDATION_ERROR', 'contentDurationSeconds is required', 400);
    return;
    }

    const positions = adService.calculateMidrollPositions(
      contentDurationSeconds,
      midrollCount || 2
    );

    sendSuccess(res, { positions });
  } catch (error: any) {
    sendError(res, 'CALCULATE_MIDROLL_ERROR', error.message, 500);
    return;
  }
};
