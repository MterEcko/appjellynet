import { defineStore } from 'pinia';
import api from '@/services/api';
import { jwtDecode } from 'jwt-decode';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    accessToken: localStorage.getItem('accessToken') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    currentProfile: JSON.parse(localStorage.getItem('currentProfile')) || null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    isAdmin: (state) => state.user?.role === 'ADMIN',
  },

  actions: {
    /**
     * Login with email and password
     */
    async login(email, password) {
      try {
        const response = await api.post('/auth/login', { email, password });
        const { user, accessToken, refreshToken } = response.data.data;

        this.user = user;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        return true;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },

    /**
     * Logout
     */
    logout() {
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.currentProfile = null;

      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentProfile');
    },

    /**
     * Refresh access token
     */
    async refreshAccessToken() {
      try {
        const response = await api.post('/auth/refresh', {
          refreshToken: this.refreshToken,
        });
        const { accessToken } = response.data.data;

        this.accessToken = accessToken;
        localStorage.setItem('accessToken', accessToken);

        return accessToken;
      } catch (error) {
        console.error('Token refresh error:', error);
        this.logout();
        throw error;
      }
    },

    /**
     * Set current profile
     */
    setCurrentProfile(profile) {
      this.currentProfile = profile;
      localStorage.setItem('currentProfile', JSON.stringify(profile));
    },

    /**
     * Load user from token
     */
    loadUserFromToken() {
      if (this.accessToken) {
        try {
          const decoded = jwtDecode(this.accessToken);
          this.user = decoded;
        } catch (error) {
          console.error('Invalid token:', error);
          this.logout();
        }
      }
    },

    /**
     * Check if token is expired
     */
    isTokenExpired() {
      if (!this.accessToken) return true;

      try {
        const decoded = jwtDecode(this.accessToken);
        const now = Date.now() / 1000;
        return decoded.exp < now;
      } catch (error) {
        return true;
      }
    },

    /**
     * Initialize auth state
     */
    async initialize() {
      if (this.accessToken && !this.isTokenExpired()) {
        this.loadUserFromToken();
        return true;
      } else if (this.refreshToken) {
        try {
          await this.refreshAccessToken();
          this.loadUserFromToken();
          return true;
        } catch (error) {
          this.logout();
          return false;
        }
      }
      return false;
    },
  },
});
