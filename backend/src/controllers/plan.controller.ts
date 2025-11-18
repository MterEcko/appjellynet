import { Request, Response, NextFunction } from 'express';
import planService from '../services/plan.service';
import { sendSuccess } from '../utils/response.util';

export class PlanController {
  /**
   * Get all plans
   */
  async getAllPlans(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const plans = await planService.getAllPlans(includeInactive);
      sendSuccess(res, plans, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get plan by ID
   */
  async getPlanById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const plan = await planService.getPlanById(id);
      sendSuccess(res, plan, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get plan by type
   */
  async getPlanByType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { planType } = req.params;
      const plan = await planService.getPlanByType(planType as any);
      sendSuccess(res, plan, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new plan
   */
  async createPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plan = await planService.createPlan(req.body);
      sendSuccess(res, plan, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update plan
   */
  async updatePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const plan = await planService.updatePlan(id, req.body);
      sendSuccess(res, plan, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete plan
   */
  async deletePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await planService.deletePlan(id);
      sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle plan status
   */
  async togglePlanStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const plan = await planService.togglePlanStatus(id);
      sendSuccess(res, plan, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Initialize default plans
   */
  async initializeDefaultPlans(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plans = await planService.initializeDefaultPlans();
      sendSuccess(res, { message: 'Default plans initialized', plans }, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new PlanController();
