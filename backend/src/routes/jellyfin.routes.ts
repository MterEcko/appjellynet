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

// Get series seasons
router.get('/series/:seriesId/seasons', jellyfinProxyController.getSeasons);

// Get season episodes
router.get('/series/:seriesId/seasons/:seasonId/episodes', jellyfinProxyController.getEpisodes);

// Get similar items
router.get('/similar/:itemId', jellyfinProxyController.getSimilar);

// Get all genres
router.get('/genres', jellyfinProxyController.getGenres);

// Get items by genre
router.get('/genre/:genre', jellyfinProxyController.getByGenre);

// Report playback progress
router.post('/playback/progress', jellyfinProxyController.reportProgress);

// Report playback stopped
router.post('/playback/stopped', jellyfinProxyController.reportStopped);

// Get Jellyfin access token for direct streaming
router.get('/access-token', jellyfinProxyController.getAccessToken);

export default router;
