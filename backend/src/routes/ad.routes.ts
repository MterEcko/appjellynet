import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  createAd,
  getAds,
  getAdById,
  updateAd,
  deleteAd,
  selectAd,
  trackAdView,
  getAdStats,
  getAdAnalytics,
  calculateMidrollPositions,
} from '../controllers/ad.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';
import fs from 'fs';

const router = Router();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads', 'ads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (_req: any, file: any, cb: any) => {
  // Allow video files
  const allowedMimes = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only video files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
  },
});

// Public routes (require authentication but not admin)
router.post('/select', authMiddleware, selectAd);
router.post('/track', authMiddleware, trackAdView);
router.post('/midroll-positions', authMiddleware, calculateMidrollPositions);

// Admin routes (require authentication and admin role)
router.post('/', authMiddleware, adminMiddleware, upload.single('video'), createAd);
router.get('/', authMiddleware, adminMiddleware, getAds);
router.get('/stats', authMiddleware, adminMiddleware, getAdStats);
router.get('/:id', authMiddleware, adminMiddleware, getAdById);
router.get('/:id/analytics', authMiddleware, adminMiddleware, getAdAnalytics);
router.put('/:id', authMiddleware, adminMiddleware, upload.single('video'), updateAd);
router.delete('/:id', authMiddleware, adminMiddleware, deleteAd);

export default router;
