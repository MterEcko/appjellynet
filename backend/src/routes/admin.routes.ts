import { Router } from 'express';
import adminController from '../controllers/admin.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';

const router = Router();

// All routes require authentication and admin privileges
router.use(authMiddleware);
router.use(adminMiddleware);

// Dashboard stats
router.get('/stats', adminController.getDashboardStats);

// Audit logs
router.get('/audit-logs', adminController.getAuditLogs);

// Plans management
router.get('/plans', adminController.getAllPlans);

// Account management
router.get('/accounts', adminController.getAllAccounts);
router.get('/accounts/:id', adminController.getAccountById);
router.post('/accounts', adminController.createAccount);
router.post('/accounts/:id/suspend', adminController.suspendAccount);
router.post('/accounts/:id/reactivate', adminController.reactivateAccount);
router.patch('/accounts/:id/plan', adminController.updateAccountPlan);

export default router;
