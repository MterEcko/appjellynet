import prisma from '../config/database';
import { Plan } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../utils/error.util';

export interface CreatePlanConfigData {
  planType: Plan;
  name: string;
  description?: string;
  monthlyPrice?: number;
  weeklyPrice?: number;
  currency?: string;
  maxProfiles?: number;
  maxDevices?: number;
  maxConcurrentStreams?: number;
  allowDownload?: boolean;
  maxVideoQuality?: string;
  allowAds?: boolean;
  skipAdsEnabled?: boolean;
  features?: any;
}

export interface UpdatePlanConfigData {
  name?: string;
  description?: string;
  monthlyPrice?: number;
  weeklyPrice?: number;
  currency?: string;
  maxProfiles?: number;
  maxDevices?: number;
  maxConcurrentStreams?: number;
  allowDownload?: boolean;
  maxVideoQuality?: string;
  allowAds?: boolean;
  skipAdsEnabled?: boolean;
  features?: any;
  isActive?: boolean;
}

export class PlanService {
  /**
   * Get all plan configurations
   */
  async getAllPlans(includeInactive: boolean = false) {
    const where = includeInactive ? {} : { isActive: true };

    return await prisma.planConfig.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get plan configuration by plan type
   */
  async getPlanByType(planType: Plan) {
    const plan = await prisma.planConfig.findUnique({
      where: { planType },
    });

    if (!plan) {
      throw new NotFoundError(`Plan configuration for ${planType} not found`);
    }

    return plan;
  }

  /**
   * Get plan configuration by ID
   */
  async getPlanById(id: string) {
    const plan = await prisma.planConfig.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundError('Plan configuration not found');
    }

    return plan;
  }

  /**
   * Create new plan configuration
   */
  async createPlan(data: CreatePlanConfigData) {
    // Check if plan type already exists
    const existing = await prisma.planConfig.findUnique({
      where: { planType: data.planType },
    });

    if (existing) {
      throw new BadRequestError(`Plan configuration for ${data.planType} already exists`);
    }

    return await prisma.planConfig.create({
      data: {
        planType: data.planType,
        name: data.name,
        description: data.description,
        monthlyPrice: data.monthlyPrice,
        weeklyPrice: data.weeklyPrice,
        currency: data.currency || 'USD',
        maxProfiles: data.maxProfiles || 1,
        maxDevices: data.maxDevices || 1,
        maxConcurrentStreams: data.maxConcurrentStreams || 1,
        allowDownload: data.allowDownload || false,
        maxVideoQuality: data.maxVideoQuality || '720p',
        allowAds: data.allowAds !== undefined ? data.allowAds : true,
        skipAdsEnabled: data.skipAdsEnabled || false,
        features: data.features || {},
      },
    });
  }

  /**
   * Update plan configuration
   */
  async updatePlan(id: string, data: UpdatePlanConfigData) {
    await this.getPlanById(id);

    return await prisma.planConfig.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete plan configuration
   */
  async deletePlan(id: string) {
    await this.getPlanById(id);

    await prisma.planConfig.delete({
      where: { id },
    });

    return { message: 'Plan configuration deleted successfully' };
  }

  /**
   * Toggle plan active status
   */
  async togglePlanStatus(id: string) {
    const plan = await this.getPlanById(id);

    return await prisma.planConfig.update({
      where: { id },
      data: { isActive: !plan.isActive },
    });
  }

  /**
   * Initialize default plans if they don't exist
   */
  async initializeDefaultPlans() {
    const defaultPlans = [
      {
        planType: 'BASIC' as Plan,
        name: 'Plan Básico',
        description: 'Plan básico con anuncios',
        monthlyPrice: 4.99,
        maxProfiles: 1,
        maxDevices: 1,
        maxConcurrentStreams: 1,
        allowDownload: false,
        maxVideoQuality: '720p',
        allowAds: true,
        skipAdsEnabled: false,
      },
      {
        planType: 'PREMIUM' as Plan,
        name: 'Plan Premium',
        description: 'Plan premium sin anuncios',
        monthlyPrice: 9.99,
        maxProfiles: 4,
        maxDevices: 4,
        maxConcurrentStreams: 2,
        allowDownload: true,
        maxVideoQuality: '1080p',
        allowAds: false,
        skipAdsEnabled: true,
      },
      {
        planType: 'FAMILY' as Plan,
        name: 'Plan Familiar',
        description: 'Plan familiar con múltiples perfiles',
        monthlyPrice: 14.99,
        maxProfiles: 6,
        maxDevices: 6,
        maxConcurrentStreams: 4,
        allowDownload: true,
        maxVideoQuality: '4K',
        allowAds: false,
        skipAdsEnabled: true,
      },
      {
        planType: 'DEMO' as Plan,
        name: 'Demo',
        description: 'Plan de demostración',
        monthlyPrice: 0,
        maxProfiles: 1,
        maxDevices: 1,
        maxConcurrentStreams: 1,
        allowDownload: false,
        maxVideoQuality: '480p',
        allowAds: true,
        skipAdsEnabled: false,
      },
    ];

    const results = [];
    for (const planData of defaultPlans) {
      const existing = await prisma.planConfig.findUnique({
        where: { planType: planData.planType },
      });

      if (!existing) {
        const plan = await prisma.planConfig.create({ data: planData });
        results.push(plan);
      }
    }

    return results;
  }
}

export default new PlanService();
