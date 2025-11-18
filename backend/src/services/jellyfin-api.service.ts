import axios, { AxiosInstance } from 'axios';
import env from '../config/env';
import { logger } from '../utils/logger.util';

export interface JellyfinUser {
  Id: string;
  Name: string;
  ServerId: string;
  HasPassword: boolean;
  HasConfiguredPassword: boolean;
  HasConfiguredEasyPassword: boolean;
  EnableAutoLogin: boolean;
  LastLoginDate: string;
  LastActivityDate: string;
  Configuration: any;
  Policy: any;
}

export interface JellyfinSystemInfo {
  SystemUpdateLevel: string;
  OperatingSystemDisplayName: string;
  HasPendingRestart: boolean;
  IsShuttingDown: boolean;
  Version: string;
  WebSocketPortNumber: number;
  CompletedInstallations: any[];
  Id: string;
  ProgramDataPath: string;
  WebPath: string;
  LogPath: string;
  ItemsByNamePath: string;
  InternalMetadataPath: string;
  CachePath: string;
  TranscodingTempPath: string;
  ServerName: string;
  LocalAddress: string;
  WanAddress: string;
}

export class JellyfinApiService {
  private api: AxiosInstance;

  constructor(baseUrl: string) {
    this.api = axios.create({
      baseURL: baseUrl,
      headers: {
        'X-Emby-Token': env.JELLYFIN_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  // System endpoints
  async getSystemInfo(): Promise<JellyfinSystemInfo> {
    try {
      const response = await this.api.get('/System/Info');
      return response.data;
    } catch (error: any) {
      logger.error(`Jellyfin getSystemInfo error: ${error.message}`);
      throw error;
    }
  }

  async ping(): Promise<boolean> {
    try {
      await this.api.get('/System/Ping');
      return true;
    } catch (error) {
      return false;
    }
  }

  // User endpoints
  async getUsers(): Promise<JellyfinUser[]> {
    try {
      const response = await this.api.get('/Users');
      return response.data;
    } catch (error: any) {
      logger.error(`Jellyfin getUsers error: ${error.message}`);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<JellyfinUser> {
    try {
      const response = await this.api.get(`/Users/${userId}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Jellyfin getUserById error: ${error.message}`);
      throw error;
    }
  }

  async createUser(name: string, password?: string): Promise<JellyfinUser> {
    try {
      const response = await this.api.post('/Users/New', {
        Name: name,
        Password: password || '',
      });
      return response.data;
    } catch (error: any) {
      logger.error(`Jellyfin createUser error: ${error.message}`);
      throw error;
    }
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    try {
      await this.api.post(`/Users/${userId}/Password`, {
        Id: userId,
        NewPw: newPassword,
        ResetPassword: false,
      });
    } catch (error: any) {
      logger.error(`Jellyfin updateUserPassword error: ${error.message}`);
      throw error;
    }
  }

  async updateUserPolicy(userId: string, policy: any): Promise<void> {
    try {
      await this.api.post(`/Users/${userId}/Policy`, policy);
    } catch (error: any) {
      logger.error(`Jellyfin updateUserPolicy error: ${error.message}`);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await this.api.delete(`/Users/${userId}`);
    } catch (error: any) {
      logger.error(`Jellyfin deleteUser error: ${error.message}`);
      throw error;
    }
  }

  async enableUser(userId: string): Promise<void> {
    try {
      await this.api.post(`/Users/${userId}/Policy`, {
        IsDisabled: false,
      });
    } catch (error: any) {
      logger.error(`Jellyfin enableUser error: ${error.message}`);
      throw error;
    }
  }

  async disableUser(userId: string): Promise<void> {
    try {
      await this.api.post(`/Users/${userId}/Policy`, {
        IsDisabled: true,
      });
    } catch (error: any) {
      logger.error(`Jellyfin disableUser error: ${error.message}`);
      throw error;
    }
  }

  // Items endpoints
  async getItems(userId: string, params?: any): Promise<any> {
    try {
      const response = await this.api.get(`/Users/${userId}/Items`, {
        params,
      });
      return response.data;
    } catch (error: any) {
      logger.error(`Jellyfin getItems error: ${error.message}`);
      throw error;
    }
  }

  async getItemById(userId: string, itemId: string): Promise<any> {
    try {
      const response = await this.api.get(`/Users/${userId}/Items/${itemId}`);
      return response.data;
    } catch (error: any) {
      logger.error(`Jellyfin getItemById error: ${error.message}`);
      throw error;
    }
  }

  async getLatestMedia(userId: string, limit: number = 16): Promise<any> {
    try {
      const response = await this.api.get(`/Users/${userId}/Items/Latest`, {
        params: {
          limit,
        },
      });
      return response.data;
    } catch (error: any) {
      logger.error(`Jellyfin getLatestMedia error: ${error.message}`);
      throw error;
    }
  }

  async getResumeItems(userId: string): Promise<any> {
    try {
      const response = await this.api.get(`/Users/${userId}/Items/Resume`, {
        params: {
          limit: 20,
        },
      });
      return response.data;
    } catch (error: any) {
      logger.error(`Jellyfin getResumeItems error: ${error.message}`);
      throw error;
    }
  }

  async getItemsByType(userId: string, type: string, limit: number = 20, startIndex: number = 0): Promise<any> {
    try {
      const response = await this.api.get(`/Users/${userId}/Items`, {
        params: {
          includeItemTypes: type,
          limit,
          startIndex,
        },
      });
      return response.data;
    } catch (error: any) {
      logger.error(`Jellyfin getItemsByType error: ${error.message}`);
      throw error;
    }
  }

  async getItemDetails(userId: string, itemId: string): Promise<any> {
    // Alias for getItemById for consistency
    return this.getItemById(userId, itemId);
  }

  async searchItems(userId: string, searchTerm: string, limit: number = 20): Promise<any> {
    try {
      const response = await this.api.get('/Search/Hints', {
        params: {
          userId,
          searchTerm,
          limit,
        },
      });
      return response.data;
    } catch (error: any) {
      logger.error(`Jellyfin searchItems error: ${error.message}`);
      throw error;
    }
  }

  // Sessions endpoints
  async getSessions(): Promise<any[]> {
    try {
      const response = await this.api.get('/Sessions');
      return response.data;
    } catch (error: any) {
      logger.error(`Jellyfin getSessions error: ${error.message}`);
      throw error;
    }
  }

  async reportPlaybackStart(_userId: string, itemId: string, sessionId: string): Promise<void> {
    try {
      await this.api.post('/Sessions/Playing', {
        ItemId: itemId,
        SessionId: sessionId,
        PlayMethod: 'DirectPlay',
        PositionTicks: 0,
      });
    } catch (error: any) {
      logger.error(`Jellyfin reportPlaybackStart error: ${error.message}`);
      throw error;
    }
  }

  async reportPlaybackProgress(
    _userId: string,
    itemId: string,
    sessionId: string,
    positionTicks: number
  ): Promise<void> {
    try {
      await this.api.post('/Sessions/Playing/Progress', {
        ItemId: itemId,
        SessionId: sessionId,
        PositionTicks: positionTicks,
        IsPaused: false,
      });
    } catch (error: any) {
      logger.error(`Jellyfin reportPlaybackProgress error: ${error.message}`);
      throw error;
    }
  }

  async reportPlaybackStopped(
    _userId: string,
    itemId: string,
    sessionId: string,
    positionTicks: number
  ): Promise<void> {
    try {
      await this.api.post('/Sessions/Playing/Stopped', {
        ItemId: itemId,
        SessionId: sessionId,
        PositionTicks: positionTicks,
      });
    } catch (error: any) {
      logger.error(`Jellyfin reportPlaybackStopped error: ${error.message}`);
      throw error;
    }
  }
}

// Export instances for each configured server
export const jellyfinLocalApi = new JellyfinApiService(env.JELLYFIN_SERVER_LOCAL);
export const jellyfinWispApi = new JellyfinApiService(env.JELLYFIN_SERVER_WISP);
export const jellyfinIspApi = new JellyfinApiService(env.JELLYFIN_SERVER_ISP);
export const jellyfinPublicApi = new JellyfinApiService(env.JELLYFIN_SERVER_PUBLIC);

export default JellyfinApiService;
