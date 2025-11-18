import { Router } from 'express';
import uploadController, { uploadAdVideo, uploadAdThumbnail } from '../controllers/upload.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';

const router = Router();

// All upload routes require authentication and admin privileges
router.use(authMiddleware);
router.use(adminMiddleware);

// Upload ad video
router.post('/ad-video', uploadAdVideo, uploadController.uploadAdVideoFile);

// Upload ad thumbnail
router.post('/ad-thumbnail', uploadAdThumbnail, uploadController.uploadAdThumbnailFile);

export default router;
