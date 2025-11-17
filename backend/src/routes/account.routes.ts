import { Router } from 'express';
import accountController from '../controllers/account.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get current account info (with profiles)
router.get('/me', accountController.getMe);

// Update account
router.patch('/me', accountController.updateAccount);

// Update password (syncs to all Jellyfin profiles)
router.post('/password', accountController.updatePassword);

export default router;
