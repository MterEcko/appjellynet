import { Router } from 'express';
import profileController from '../controllers/profile.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get all profiles for current user
router.get('/', profileController.getProfiles);

// Create new profile
router.post('/', profileController.createProfile);

// Get profile by ID
router.get('/:id', profileController.getProfile);

// Update profile
router.patch('/:id', profileController.updateProfile);

// Delete profile
router.delete('/:id', profileController.deleteProfile);

// Set profile as primary
router.post('/:id/primary', profileController.setPrimaryProfile);

// Get Jellyfin credentials for current profile
router.get('/jellyfin/credentials', profileController.getJellyfinCredentials);

export default router;
