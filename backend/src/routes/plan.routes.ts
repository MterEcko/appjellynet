import { Router } from 'express';
import planController from '../controllers/plan.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Get all plans
router.get('/', planController.getAllPlans);

// Initialize default plans
router.post('/initialize', planController.initializeDefaultPlans);

// Get plan by type
router.get('/type/:planType', planController.getPlanByType);

// Get plan by ID
router.get('/:id', planController.getPlanById);

// Create new plan
router.post('/', planController.createPlan);

// Update plan
router.put('/:id', planController.updatePlan);

// Delete plan
router.delete('/:id', planController.deletePlan);

// Toggle plan status
router.post('/:id/toggle-status', planController.togglePlanStatus);

export default router;
