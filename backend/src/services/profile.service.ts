import prisma from '../config/database';
import { NotFoundError, ConflictError, ValidationError } from '../utils/error.util';
import JellyfinApiService from './jellyfin-api.service';
import serverDetectionService from './server-detection.service';
import { logger } from '../utils/logger.util';
import { Profile, Plan } from '@prisma/client';

export interface CreateProfileData {
  userId: string;
  name: string;
  avatar?: string;
  pin?: string;
  ageRestriction?: number;
  language?: string;
  subtitleLanguage?: string;
  qualityPreference?: string;
}

export class ProfileService {
  /**
   * Get all profiles for a user
   */
  async getProfiles(userId: string): Promise<Profile[]> {
    return prisma.profile.findMany({
      where: { userId },
      orderBy: { isPrimary: 'desc' },
    });
  }

  /**
   * Get profile by ID
   */
  async getProfileById(profileId: string, userId: string): Promise<Profile> {
    const profile = await prisma.profile.findFirst({
      where: {
        id: profileId,
        userId,
      },
    });

    if (!profile) {
      throw new NotFoundError('Profile not found');
    }

    return profile;
  }

  /**
   * Create a new profile and corresponding Jellyfin user
   */
  async createProfile(data: CreateProfileData, clientIp: string): Promise<Profile> {
    // Get user and check profile limit
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      include: { profiles: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check profile limit based on plan
    const profileLimit = this.getProfileLimit(user.plan);

    if (user.profiles.length >= profileLimit) {
      throw new ConflictError(
        `Profile limit reached. ${user.plan} plan allows up to ${profileLimit} profiles.`
      );
    }

    // Detect best Jellyfin server
    const detectedServer = await serverDetectionService.detectBestServer(clientIp);
    const jellyfinApi = new JellyfinApiService(detectedServer.server.url);

    try {
      // Create user in Jellyfin
      // Use the same password as the master account for simplicity
      const jellyfinUser = await jellyfinApi.createUser(data.name);

      // Create profile in database
      const profile = await prisma.profile.create({
        data: {
          userId: data.userId,
          jellyfinUserId: jellyfinUser.Id,
          name: data.name,
          avatar: data.avatar,
          pin: data.pin,
          ageRestriction: data.ageRestriction,
          language: data.language || 'es',
          subtitleLanguage: data.subtitleLanguage,
          qualityPreference: data.qualityPreference,
          isPrimary: user.profiles.length === 0, // First profile is primary
        },
      });

      logger.info(
        `Profile created: ${profile.id} (Jellyfin User: ${jellyfinUser.Id}) on server ${detectedServer.server.name}`
      );

      return profile;
    } catch (error: any) {
      logger.error(`Failed to create profile: ${error.message}`);
      throw new Error(`Failed to create profile in Jellyfin: ${error.message}`);
    }
  }

  /**
   * Update profile
   */
  async updateProfile(
    profileId: string,
    userId: string,
    data: Partial<CreateProfileData>
  ): Promise<Profile> {
    // Verify ownership
    await this.getProfileById(profileId, userId);

    // Update in database
    const updatedProfile = await prisma.profile.update({
      where: { id: profileId },
      data: {
        name: data.name,
        avatar: data.avatar,
        pin: data.pin,
        ageRestriction: data.ageRestriction,
        language: data.language,
        subtitleLanguage: data.subtitleLanguage,
        qualityPreference: data.qualityPreference,
      },
    });

    // TODO: Update Jellyfin user name if changed
    // This would require detecting server and calling Jellyfin API

    return updatedProfile;
  }

  /**
   * Delete profile and corresponding Jellyfin user
   */
  async deleteProfile(profileId: string, userId: string, clientIp: string): Promise<void> {
    const profile = await this.getProfileById(profileId, userId);

    // Don't allow deleting primary profile if there are other profiles
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profiles: true },
    });

    if (profile.isPrimary && user!.profiles.length > 1) {
      throw new ValidationError('Cannot delete primary profile. Assign another profile as primary first.');
    }

    // Detect server and delete from Jellyfin
    try {
      const detectedServer = await serverDetectionService.detectBestServer(clientIp);
      const jellyfinApi = new JellyfinApiService(detectedServer.server.url);

      await jellyfinApi.deleteUser(profile.jellyfinUserId);
    } catch (error: any) {
      logger.error(`Failed to delete Jellyfin user: ${error.message}`);
      // Continue with deletion even if Jellyfin deletion fails
    }

    // Delete from database
    await prisma.profile.delete({
      where: { id: profileId },
    });

    logger.info(`Profile deleted: ${profileId}`);
  }

  /**
   * Set profile as primary
   */
  async setPrimaryProfile(profileId: string, userId: string): Promise<Profile> {
    await this.getProfileById(profileId, userId);

    // Unset all primary flags
    await prisma.profile.updateMany({
      where: { userId },
      data: { isPrimary: false },
    });

    // Set new primary
    const profile = await prisma.profile.update({
      where: { id: profileId },
      data: { isPrimary: true },
    });

    return profile;
  }

  /**
   * Get Jellyfin credentials for a profile
   */
  async getJellyfinCredentials(profileId: string, userId: string): Promise<{
    jellyfinUserId: string;
    jellyfinAccessToken: string;
  }> {
    const profile = await this.getProfileById(profileId, userId);

    // For Jellyfin API calls from frontend, we return the profile's Jellyfin user ID
    // The access token is managed by the Jellyfin SDK on the frontend
    // However, for server-side calls, we can generate an access token

    // For now, we'll return the jellyfinUserId and let the frontend handle authentication
    // The frontend will use quick connect or authenticate directly with Jellyfin

    return {
      jellyfinUserId: profile.jellyfinUserId!,
      jellyfinAccessToken: '', // Frontend will authenticate with Jellyfin directly
    };
  }

  /**
   * Ensure profile has a Jellyfin user - create one if it doesn't exist
   */
  async ensureJellyfinUser(profileId: string, userId: string, clientIp: string): Promise<string> {
    const profile = await this.getProfileById(profileId, userId);

    // If profile already has a Jellyfin user ID, return it
    if (profile.jellyfinUserId) {
      return profile.jellyfinUserId;
    }

    // Profile doesn't have a Jellyfin user, create one
    try {
      const detectedServer = await serverDetectionService.detectBestServer(clientIp);
      const jellyfinApi = new JellyfinApiService(detectedServer.server.url);

      // Create user in Jellyfin with the profile's name
      const jellyfinUser = await jellyfinApi.createUser(profile.name);

      // Update profile with Jellyfin user ID
      const updatedProfile = await prisma.profile.update({
        where: { id: profileId },
        data: { jellyfinUserId: jellyfinUser.Id },
      });

      logger.info(
        `Created Jellyfin user for profile ${profileId}: ${jellyfinUser.Id} on server ${detectedServer.server.name}`
      );

      return updatedProfile.jellyfinUserId!;
    } catch (error: any) {
      logger.error(`Failed to create Jellyfin user for profile ${profileId}: ${error.message}`);
      throw new Error(`Failed to create Jellyfin user: ${error.message}`);
    }
  }

  /**
   * Get profile limit based on plan
   */
  private getProfileLimit(plan: Plan): number {
    switch (plan) {
      case Plan.BASIC:
        return 3;
      case Plan.PREMIUM:
        return 8;
      case Plan.DEMO:
        return 4;
      default:
        return 3;
    }
  }
}

export default new ProfileService();
