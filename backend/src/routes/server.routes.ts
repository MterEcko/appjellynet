import { Router } from 'express';
import serverController from '../controllers/server.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Detect best server for current client
router.get('/detect', serverController.detectServer);

// Get all available servers
router.get('/', serverController.getServers);

// Health check all servers (could be admin only)
router.get('/health', serverController.healthCheck);

export default router;
