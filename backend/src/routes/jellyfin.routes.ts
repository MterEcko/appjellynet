import { Router } from 'express';
import jellyfinProxyController from '../controllers/jellyfin-proxy.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get latest media
router.get('/latest', jellyfinProxyController.getLatest);

// Get resume items (continue watching)
router.get('/resume', jellyfinProxyController.getResume);

// Get items by type (Movie, Series, etc.)
router.get('/items/:type', jellyfinProxyController.getItemsByType);

// Search items
router.get('/search', jellyfinProxyController.search);

// Get item details
router.get('/item/:id', jellyfinProxyController.getItem);

// Report playback progress
router.post('/playback/progress', jellyfinProxyController.reportProgress);

// Report playback stopped
router.post('/playback/stopped', jellyfinProxyController.reportStopped);

export default router;
