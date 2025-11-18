import { Router } from 'express';
import favoriteController from '../controllers/favorite.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get favorites
router.get('/', favoriteController.getFavorites);

// Add to favorites
router.post('/', favoriteController.addToFavorites);

// Check if item is favorited
router.get('/check/:itemId', favoriteController.checkFavorite);

// Remove from favorites
router.delete('/:itemId', favoriteController.removeFromFavorites);

export default router;
