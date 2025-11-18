import { Router } from 'express';
import watchlistController from '../controllers/watchlist.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get watchlist
router.get('/', watchlistController.getWatchlist);

// Add to watchlist
router.post('/', watchlistController.addToWatchlist);

// Check if item is in watchlist
router.get('/check/:itemId', watchlistController.checkWatchlist);

// Remove from watchlist
router.delete('/:itemId', watchlistController.removeFromWatchlist);

export default router;
