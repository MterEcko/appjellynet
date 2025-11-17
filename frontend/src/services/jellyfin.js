import api from './api';

/**
 * Jellyfin API Service
 * Handles all communication with Jellyfin servers
 */

let serverUrl = null;
let jellyfinUserId = null;
let jellyfinAccessToken = null;

/**
 * Initialize Jellyfin connection
 */
export async function initializeJellyfin() {
  try {
    // Get detected server from backend
    const response = await api.get('/servers/detect');
    serverUrl = response.data.data.server.url;

    // Get Jellyfin credentials from profile
    const profileData = JSON.parse(localStorage.getItem('currentProfile'));
    if (profileData) {
      jellyfinUserId = profileData.jellyfinUserId;
      // You'll need to get the Jellyfin access token from backend
      // For now, we'll use the backend API as proxy
    }

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
  if (!serverUrl) await initializeJellyfin();

  const url = `${serverUrl}/Users/${jellyfinUserId}/Items/Latest?Limit=${limit}&Fields=PrimaryImageAspectRatio,Overview,Genres&ImageTypeLimit=1&EnableImageTypes=Primary,Backdrop,Thumb`;

  try {
    const response = await fetch(url, {
      headers: {
        'X-Emby-Token': jellyfinAccessToken,
      },
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to get latest media:', error);
    return [];
  }
}

/**
 * Get resume items (continue watching)
 */
export async function getResumeItems() {
  if (!serverUrl) await initializeJellyfin();

  const url = `${serverUrl}/Users/${jellyfinUserId}/Items/Resume?Limit=12&Fields=PrimaryImageAspectRatio,Overview&ImageTypeLimit=1&EnableImageTypes=Primary,Backdrop,Thumb&MediaTypes=Video`;

  try {
    const response = await fetch(url, {
      headers: {
        'X-Emby-Token': jellyfinAccessToken,
      },
    });
    const data = await response.json();
    return data.Items || [];
  } catch (error) {
    console.error('Failed to get resume items:', error);
    return [];
  }
}

/**
 * Get items by type (Movies, Series, etc.)
 */
export async function getItemsByType(type, limit = 20, startIndex = 0) {
  if (!serverUrl) await initializeJellyfin();

  const params = new URLSearchParams({
    IncludeItemTypes: type,
    Recursive: 'true',
    Limit: limit,
    StartIndex: startIndex,
    Fields: 'PrimaryImageAspectRatio,Overview,Genres',
    ImageTypeLimit: 1,
    EnableImageTypes: 'Primary,Backdrop,Thumb',
    SortBy: 'SortName',
    SortOrder: 'Ascending',
  });

  const url = `${serverUrl}/Users/${jellyfinUserId}/Items?${params}`;

  try {
    const response = await fetch(url, {
      headers: {
        'X-Emby-Token': jellyfinAccessToken,
      },
    });
    const data = await response.json();
    return data.Items || [];
  } catch (error) {
    console.error(`Failed to get ${type}:`, error);
    return [];
  }
}

/**
 * Search for items
 */
export async function searchItems(searchTerm, limit = 20) {
  if (!serverUrl) await initializeJellyfin();

  const params = new URLSearchParams({
    searchTerm,
    Limit: limit,
    Fields: 'PrimaryImageAspectRatio,Overview',
    Recursive: 'true',
    EnableTotalRecordCount: 'false',
    ImageTypeLimit: 1,
    IncludePeople: 'false',
    IncludeMedia: 'true',
    IncludeGenres: 'false',
    IncludeStudios: 'false',
    IncludeArtists: 'false',
  });

  const url = `${serverUrl}/Users/${jellyfinUserId}/Items?${params}`;

  try {
    const response = await fetch(url, {
      headers: {
        'X-Emby-Token': jellyfinAccessToken,
      },
    });
    const data = await response.json();
    return data.Items || [];
  } catch (error) {
    console.error('Search failed:', error);
    return [];
  }
}

/**
 * Get item details
 */
export async function getItemDetails(itemId) {
  if (!serverUrl) await initializeJellyfin();

  const url = `${serverUrl}/Users/${jellyfinUserId}/Items/${itemId}`;

  try {
    const response = await fetch(url, {
      headers: {
        'X-Emby-Token': jellyfinAccessToken,
      },
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to get item details:', error);
    throw error;
  }
}

/**
 * Get playback URL for an item
 */
export function getPlaybackUrl(itemId, mediaSourceId) {
  if (!serverUrl) return '';

  return `${serverUrl}/Videos/${itemId}/stream?Static=true&mediaSourceId=${mediaSourceId}&api_key=${jellyfinAccessToken}`;
}

/**
 * Get image URL
 */
export function getImageUrl(itemId, imageType = 'Primary', maxWidth = 500) {
  if (!serverUrl) return '';

  return `${serverUrl}/Items/${itemId}/Images/${imageType}?maxWidth=${maxWidth}`;
}

/**
 * Report playback progress
 */
export async function reportPlaybackProgress(itemId, positionTicks, isPaused = false) {
  if (!serverUrl) return;

  const url = `${serverUrl}/Sessions/Playing/Progress`;

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Emby-Token': jellyfinAccessToken,
      },
      body: JSON.stringify({
        ItemId: itemId,
        PositionTicks: positionTicks,
        IsPaused: isPaused,
      }),
    });
  } catch (error) {
    console.error('Failed to report playback progress:', error);
  }
}

/**
 * Report playback stopped
 */
export async function reportPlaybackStopped(itemId, positionTicks) {
  if (!serverUrl) return;

  const url = `${serverUrl}/Sessions/Playing/Stopped`;

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Emby-Token': jellyfinAccessToken,
      },
      body: JSON.stringify({
        ItemId: itemId,
        PositionTicks: positionTicks,
      }),
    });
  } catch (error) {
    console.error('Failed to report playback stopped:', error);
  }
}

export default {
  initializeJellyfin,
  getLatestMedia,
  getResumeItems,
  getItemsByType,
  searchItems,
  getItemDetails,
  getPlaybackUrl,
  getImageUrl,
  reportPlaybackProgress,
  reportPlaybackStopped,
  get serverUrl() {
    return serverUrl;
  },
};
