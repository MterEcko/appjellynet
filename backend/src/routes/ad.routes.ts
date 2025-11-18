import { Router } from 'express';
import adController from '../controllers/ad.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

// Public routes (for playback)
router.get('/playback/:adType', authenticate, adController.getAdForPlayback);
router.post('/views', authenticate, adController.recordAdView);

// Admin routes
router.use(requireAdmin);

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
