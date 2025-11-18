import { Router } from 'express';
import authRoutes from './auth.routes';
import serverRoutes from './server.routes';
import accountRoutes from './account.routes';
import profileRoutes from './profile.routes';
import adminRoutes from './admin.routes';
import planRoutes from './plan.routes';
import adRoutes from './ad.routes';
import jellyfinRoutes from './jellyfin.routes';
import watchlistRoutes from './watchlist.routes';
import favoriteRoutes from './favorite.routes';

const router = Router();

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use('/servers', serverRoutes);
router.use('/account', accountRoutes);
router.use('/profiles', profileRoutes);
router.use('/ads', adRoutes);
router.use('/jellyfin', jellyfinRoutes);
router.use('/watchlist', watchlistRoutes);
router.use('/favorites', favoriteRoutes);

// Admin routes
router.use('/admin', adminRoutes);
router.use('/plans', planRoutes);

export default router;
