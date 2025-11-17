import prisma from '../config/database';
import { Plan } from '@prisma/client';
import { logger } from '../utils/logger.util';
import { NotFoundError } from '../utils/error.util';

export interface PlanConfig {
  plan: Plan;
  profileLimit: number;
  price: number;
  features: string[];
}

/**
 * Service for managing plans and packages
 */
class PlanService {
  /**
   * Get plan configuration
   */
  getPlanConfig(plan: Plan): PlanConfig {
    const configs: Record<Plan, PlanConfig> = {
      DEMO: {
        plan: Plan.DEMO,
        profileLimit: 1,
        price: 0,
        features: ['1 perfil', 'Acceso limitado 7 días', 'Calidad SD'],
      },
      BASIC: {
        plan: Plan.BASIC,
        profileLimit: 3,
        price: 5.99,
        features: ['3 perfiles', 'Calidad HD', 'Sin anuncios en pausa'],
      },
      PREMIUM: {
        plan: Plan.PREMIUM,
        profileLimit: 5,
        price: 9.99,
        features: ['5 perfiles', 'Calidad 4K', 'Sin anuncios', 'Descarga offline'],
      },
      FAMILY: {
        plan: Plan.FAMILY,
        profileLimit: 8,
        price: 14.99,
        features: [
          '8 perfiles',
          'Calidad 4K',
          'Sin anuncios',
          'Descarga offline',
          'Control parental',
        ],
      },
    };

    return configs[plan];
  }

  /**
   * Get all available plans
   */
  getAllPlans(): PlanConfig[] {
    return [
      this.getPlanConfig(Plan.DEMO),
      this.getPlanConfig(Plan.BASIC),
      this.getPlanConfig(Plan.PREMIUM),
      this.getPlanConfig(Plan.FAMILY),
    ];
  }

  /**
   * Change user's plan
   */
  async changeUserPlan(userId: string, newPlan: Plan): Promise<void> {
    logger.info(`Changing user ${userId} plan to ${newPlan}`);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profiles: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const newPlanConfig = this.getPlanConfig(newPlan);

    // Check if user has more profiles than new plan allows
    if (user.profiles.length > newPlanConfig.profileLimit) {
      throw new Error(
        `User has ${user.profiles.length} profiles but new plan only allows ${newPlanConfig.profileLimit}. Please delete extra profiles first.`
      );
    }

    // Update user plan
    await prisma.user.update({
      where: { id: userId },
      data: { plan: newPlan },
    });

    logger.info(`User ${userId} plan changed to ${newPlan} successfully`);
  }

  /**
   * Check if user can add more profiles
   */
  async canAddProfile(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profiles: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const planConfig = this.getPlanConfig(user.plan);
    return user.profiles.length < planConfig.profileLimit;
  }

  /**
   * Get profile limit for user
   */
  async getProfileLimit(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const planConfig = this.getPlanConfig(user.plan);
    return planConfig.profileLimit;
  }

  /**
   * Get plan comparison for UI
   */
  getPlanComparison() {
    const plans = this.getAllPlans();

    return {
      plans: plans.map((plan) => ({
        name: plan.plan,
        price: plan.price,
        profileLimit: plan.profileLimit,
        features: plan.features,
      })),
    };
  }
}

export default new PlanService();
