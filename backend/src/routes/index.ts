import { Router } from 'express';
import authRoutes from './auth.routes';
import serverRoutes from './server.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
router.use('/auth', authRoutes);
router.use('/servers', serverRoutes);

export default router;
