import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response.util';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directories exist
const uploadDirs = {
  adVideos: path.join(__dirname, '../../public/uploads/ads/videos'),
  adThumbnails: path.join(__dirname, '../../public/uploads/ads/thumbnails'),
};

Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage for ad videos
const adVideoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirs.adVideos);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `ad-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Configure storage for ad thumbnails
const adThumbnailStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirs.adThumbnails);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `thumb-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filters
const videoFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /mp4|avi|mov|mkv|webm/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de video (mp4, avi, mov, mkv, webm)'));
  }
};

const imageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (jpeg, jpg, png, gif, webp)'));
  }
};

// Multer upload instances
export const uploadAdVideo = multer({
  storage: adVideoStorage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max
  },
}).single('video');

export const uploadAdThumbnail = multer({
  storage: adThumbnailStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
}).single('thumbnail');

export class UploadController {
  /**
   * Upload ad video
   */
  async uploadAdVideoFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No video file provided' });
        return;
      }

      const filePath = `/uploads/ads/videos/${req.file.filename}`;
      const url = `${process.env.API_URL || 'http://localhost:3000'}${filePath}`;

      sendSuccess(res, {
        filePath,
        url,
        filename: req.file.filename,
        size: req.file.size,
      }, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload ad thumbnail
   */
  async uploadAdThumbnailFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'No thumbnail file provided' });
        return;
      }

      const filePath = `/uploads/ads/thumbnails/${req.file.filename}`;
      const url = `${process.env.API_URL || 'http://localhost:3000'}${filePath}`;

      sendSuccess(res, {
        filePath,
        url,
        filename: req.file.filename,
        size: req.file.size,
      }, 201);
    } catch (error) {
      next(error);
    }
  }
}

export default new UploadController();
