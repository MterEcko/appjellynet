import api from './api';

/**
 * Jellyfin API Service
 * All requests are proxied through our backend for authentication
 */

let serverUrl = null;

/**
 * Initialize Jellyfin connection
 */
export async function initializeJellyfin() {
  try {
    // Get detected server from backend
    const response = await api.get('/servers/detect');
    serverUrl = response.data.data.url;

    return serverUrl;
  } catch (error) {
    console.error('Failed to initialize Jellyfin:', error);
    throw error;
  }
}

/**
 * Get latest media items
 */
export async function getLatestMedia(limit = 16) {
  try {
    const response = await api.get(`/jellyfin/latest?limit=${limit}`);
    return response.data.data;
  } catch (error) {
    console.error('Failed to get latest media:', error);
    return [];
  }
}

/**
 * Get resume items (continue watching)
 */
export async function getResumeItems() {
  try {
    const response = await api.get('/jellyfin/resume');
    return response.data.data.Items || [];
  } catch (error) {
    console.error('Failed to get resume items:', error);
    return [];
  }
}

/**
 * Get items by type (Movies, Series, etc.)
 */
export async function getItemsByType(type, limit = 20, startIndex = 0) {
  try {
    const response = await api.get(`/jellyfin/items/${type}?limit=${limit}&startIndex=${startIndex}`);
    return response.data.data.Items || [];
  } catch (error) {
    console.error(`Failed to get ${type}:`, error);
    return [];
  }
}

/**
 * Search for items
 */
export async function searchItems(searchTerm, limit = 20) {
  try {
    const response = await api.get(`/jellyfin/search?q=${encodeURIComponent(searchTerm)}&limit=${limit}`);
    // Search API returns SearchHints array, not Items
    return response.data.data.SearchHints || [];
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
}

/**
 * Get item details
 */
export async function getItemDetails(itemId) {
  try {
    const response = await api.get(`/jellyfin/item/${itemId}`);
    return response.data.data;
  } catch (error) {
    console.error('Failed to get item details:', error);
    throw error;
  }
}

/**
 * Get playback URL for an item
 * This constructs the URL for direct streaming from Jellyfin
 */
export function getPlaybackUrl(itemId, mediaSourceId = null) {
  if (!serverUrl) return '';

  // For direct playback, we'll use the detected server URL
  // The actual playback will be handled by the video player with proper auth
  const source = mediaSourceId || itemId;
  return `${serverUrl}/Videos/${itemId}/stream?Static=true&mediaSourceId=${source}`;
}

/**
 * Get image URL
 */
export function getImageUrl(itemId, imageType = 'Primary', maxWidth = 500) {
  if (!serverUrl) return '';

  return `${serverUrl}/Items/${itemId}/Images/${imageType}?maxWidth=${maxWidth}`;
}

/**
 * Get backdrop image URL
 */
export function getBackdropUrl(item, maxWidth = 1920) {
  if (!serverUrl || !item) return '';

  if (item.BackdropImageTags && item.BackdropImageTags.length > 0) {
    return `${serverUrl}/Items/${item.Id}/Images/Backdrop/0?maxWidth=${maxWidth}&tag=${item.BackdropImageTags[0]}`;
  }

  // Fallback to primary image
  if (item.ImageTags && item.ImageTags.Primary) {
    return `${serverUrl}/Items/${item.Id}/Images/Primary?maxWidth=${maxWidth}&tag=${item.ImageTags.Primary}`;
  }

  return '';
}

/**
 * Report playback progress
 */
export async function reportPlaybackProgress(itemId, positionTicks, isPaused = false) {
  try {
    await api.post('/jellyfin/playback/progress', {
      itemId,
      positionTicks,
      isPaused,
    });
  } catch (error) {
    console.error('Failed to report playback progress:', error);
  }
}

/**
 * Report playback stopped
 */
export async function reportPlaybackStopped(itemId, positionTicks) {
  try {
    await api.post('/jellyfin/playback/stopped', {
      itemId,
      positionTicks,
    });
  } catch (error) {
    console.error('Failed to report playback stopped:', error);
  }
}

/**
 * Get series seasons
 */
export async function getSeasons(seriesId) {
  try {
    const response = await api.get(`/jellyfin/series/${seriesId}/seasons`);
    return response.data.data.Items || [];
  } catch (error) {
    console.error('Failed to get seasons:', error);
    return [];
  }
}

/**
 * Get season episodes
 */
export async function getEpisodes(seriesId, seasonId) {
  try {
    const response = await api.get(`/jellyfin/series/${seriesId}/seasons/${seasonId}/episodes`);
    return response.data.data.Items || [];
  } catch (error) {
    console.error('Failed to get episodes:', error);
    return [];
  }
}

/**
 * Get similar items
 */
export async function getSimilarItems(itemId, limit = 10) {
  try {
    const response = await api.get(`/jellyfin/similar/${itemId}?limit=${limit}`);
    return response.data.data.Items || [];
  } catch (error) {
    console.error('Failed to get similar items:', error);
    return [];
  }
}

/**
 * Get all genres
 */
export async function getGenres() {
  try {
    const response = await api.get('/jellyfin/genres');
    return response.data.data.Items || [];
  } catch (error) {
    console.error('Failed to get genres:', error);
    return [];
  }
}

/**
 * Get items by genre
 */
export async function getItemsByGenre(genre, type = 'Movie,Series', limit = 50) {
  try {
    const response = await api.get(`/jellyfin/genre/${encodeURIComponent(genre)}?type=${type}&limit=${limit}`);
    return response.data.data.Items || [];
  } catch (error) {
    console.error('Failed to get items by genre:', error);
    return [];
  }
}

export default {
  initializeJellyfin,
  getLatestMedia,
  getResumeItems,
  getItemsByType,
  searchItems,
  getItemDetails,
  getSeasons,
  getEpisodes,
  getSimilarItems,
  getGenres,
  getItemsByGenre,
  getPlaybackUrl,
  getImageUrl,
  getBackdropUrl,
  reportPlaybackProgress,
  reportPlaybackStopped,
  get serverUrl() {
    return serverUrl;
  },
};
