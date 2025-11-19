import { Router } from 'express';
import adController from '../controllers/ad.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';

const router = Router();

// Public routes (for playback)
router.get('/playback/:adType', authMiddleware, adController.getAdForPlayback);
router.post('/views', authMiddleware, adController.recordAdView);

// Admin routes - require authentication first, then admin check
router.use(authMiddleware);
router.use(adminMiddleware);

// Get all ads
router.get('/', adController.getAllAds);

// Get analytics
router.get('/analytics', adController.getAllAdsAnalytics);

// Get ads by type
router.get('/type/:adType', adController.getAdsByType);

// Get ad analytics
router.get('/:id/analytics', adController.getAdAnalytics);

// Get ad by ID
router.get('/:id', adController.getAdById);

// Create new ad
router.post('/', adController.createAd);

// Update ad
router.put('/:id', adController.updateAd);

// Delete ad
router.delete('/:id', adController.deleteAd);

// Toggle ad status
router.post('/:id/toggle-status', adController.toggleAdStatus);

export default router;
