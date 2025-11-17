import { Request, Response, NextFunction } from 'express';
import profileService from '../services/profile.service';
import { sendSuccess } from '../utils/response.util';
import { getClientIp } from '../utils/network.util';

export class ProfileController {
  /**
   * Get all profiles for current user
   */
  async getProfiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const profiles = await profileService.getProfiles(userId);

      sendSuccess(res, profiles, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get profile by ID
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const profile = await profileService.getProfileById(id, userId);

      sendSuccess(res, profile, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new profile
   */
  async createProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const clientIp = getClientIp(req);

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const profile = await profileService.createProfile(
        {
          userId,
          ...req.body,
        },
        clientIp
      );

      sendSuccess(res, profile, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update profile
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const profile = await profileService.updateProfile(id, userId, req.body);

      sendSuccess(res, profile, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete profile
   */
  async deleteProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;
      const clientIp = getClientIp(req);

      if (!userId) {
        throw new Error('User not authenticated');
      }

      await profileService.deleteProfile(id, userId, clientIp);

      sendSuccess(res, { message: 'Profile deleted successfully' }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Set profile as primary
   */
  async setPrimaryProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id } = req.params;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const profile = await profileService.setPrimaryProfile(id, userId);

      sendSuccess(res, profile, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new ProfileController();
