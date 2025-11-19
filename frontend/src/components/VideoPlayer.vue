<template>
  <div class="video-player-container">
    <!-- Video.js Player with Jellyfin Stream -->
    <video
      ref="videoElement"
      class="video-js vjs-default-skin vjs-big-play-centered"
    ></video>

    <!-- Ad Overlay (for video ads - preroll/midroll) -->
    <div v-if="isPlayingAd && currentAd" class="ad-overlay">
      <div class="ad-badge">
        <span class="ad-icon">📺</span>
        Anuncio
      </div>
      <div v-if="currentAd.clickUrl" class="ad-click-area" @click="handleAdClick">
        <p class="ad-title">{{ currentAd.title }}</p>
        <p class="ad-campaign">{{ currentAd.campaignName || '' }}</p>
      </div>
    </div>

    <!-- Pauseroll Overlay (shown when video is paused) -->
    <div v-if="showPauseroll && pauserollAd" class="pauseroll-overlay" @click="handlePauserollClick">
      <div class="pauseroll-content">
        <img
          v-if="pauserollAd.thumbnailPath"
          :src="getAdImageUrl(pauserollAd.thumbnailPath)"
          :alt="pauserollAd.title"
          class="pauseroll-image"
        />
        <div class="pauseroll-info">
          <div class="pauseroll-badge">Anuncio</div>
          <h3 class="pauseroll-title">{{ pauserollAd.title }}</h3>
          <p v-if="pauserollAd.campaignName" class="pauseroll-campaign">{{ pauserollAd.campaignName }}</p>
          <button v-if="pauserollAd.clickUrl" class="pauseroll-cta">
            Más información →
          </button>
        </div>
      </div>
    </div>

    <!-- Loading Spinner -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Cargando video...</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-overlay">
      <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h2>Error al cargar el video</h2>
      <p>{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import api from '@/services/api';

const props = defineProps({
  itemId: {
    type: String,
    required: true,
  },
  serverUrl: {
    type: String,
    required: true,
  },
  mediaSourceId: {
    type: String,
    required: false,
  },
  jellyfinToken: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['ended', 'error']);

const loading = ref(true);
const error = ref(null);
const videoElement = ref(null);
let player = null;

// Ad state
const currentAd = ref(null);
const isPlayingAd = ref(false);
const adWatched = ref(0);
const midrollPlayed = ref(false);
const pauserollAd = ref(null);
const showPauseroll = ref(false);

// Construct Jellyfin streaming URL
const streamUrl = computed(() => {
  try {
    const baseUrl = props.serverUrl.replace('/api', '');

    // Use Jellyfin's direct stream endpoint
    // This endpoint returns the video file directly with the API key for authentication
    let url = `${baseUrl}/Items/${props.itemId}/Download?api_key=${props.jellyfinToken}`;

    if (props.mediaSourceId) {
      url += `&mediaSourceId=${props.mediaSourceId}`;
    }

    return url;
  } catch (err) {
    console.error('Error building stream URL:', err);
    error.value = 'Error al construir la URL del video';
    return null;
  }
});

/**
 * Fetch pre-roll ad
 */
const fetchPrerollAd = async () => {
  try {
    const response = await api.get('/ads/playback/PREROLL');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching pre-roll ad:', error);
    return null;
  }
};

/**
 * Fetch mid-roll ad
 */
const fetchMidrollAd = async () => {
  try {
    const response = await api.get('/ads/playback/MIDROLL');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching mid-roll ad:', error);
    return null;
  }
};

/**
 * Fetch pause-roll ad
 */
const fetchPauserollAd = async () => {
  try {
    const response = await api.get('/ads/playback/PAUSEROLL');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching pause-roll ad:', error);
    return null;
  }
};

/**
 * Report ad view
 */
const reportAdView = async (adId, completed, skipped, watchedSeconds, clicked = false) => {
  try {
    await api.post('/ads/views', {
      adId,
      contentId: props.itemId,
      completed,
      skipped,
      watchedSeconds,
      clicked,
    });
  } catch (error) {
    console.error('Error reporting ad view:', error);
  }
};

/**
 * Get ad image URL (thumbnail or video preview)
 */
const getAdImageUrl = (imagePath) => {
  if (!imagePath) return '';
  // If already a full URL, return as-is
  if (imagePath.startsWith('http')) return imagePath;
  // Use relative URL to leverage Vite proxy in dev
  return imagePath;
};

/**
 * Handle ad click
 */
const handleAdClick = () => {
  if (!currentAd.value || !currentAd.value.clickUrl) return;

  // Report click
  reportAdView(currentAd.value.id, false, false, adWatched.value, true);

  // Open link in new tab
  window.open(currentAd.value.clickUrl, '_blank');
};

/**
 * Play ad video
 */
const playAd = (ad, onAdEnd = null) => {
  if (!player || !ad) return;

  isPlayingAd.value = true;
  currentAd.value = ad;
  adWatched.value = 0;

  // Always use filePath (relative URL) instead of absolute URL
  // This works with Vite proxy in dev and static serving in production
  // and allows access from any IP/domain, not just localhost
  const adUrl = ad.filePath;

  console.log('Loading ad video from:', adUrl);

  player.src({
    src: adUrl,
    type: 'video/mp4',
  });

  // Track ad watch time
  const adTimeTracker = setInterval(() => {
    if (player && isPlayingAd.value) {
      adWatched.value = Math.floor(player.currentTime());
    }
  }, 1000);

  // Handle ad end
  const handleAdEnd = () => {
    clearInterval(adTimeTracker);
    const completed = adWatched.value >= (ad.duration || player.duration() || 0) * 0.95;

    // Report ad view
    reportAdView(ad.id, completed, false, adWatched.value);

    // Clean up
    player.off('ended', handleAdEnd);
    isPlayingAd.value = false;
    currentAd.value = null;

    // Call custom callback or play main video
    if (onAdEnd) {
      onAdEnd();
    } else {
      playMainVideo();
    }
  };

  player.one('ended', handleAdEnd);
  player.play();
};

/**
 * Play main video
 */
const playMainVideo = () => {
  if (!player || !streamUrl.value) return;

  // Set main video source
  player.src({
    src: streamUrl.value,
    type: 'video/mp4',
  });

  player.play();
};

/**
 * Check for mid-roll ad at 50% of video
 */
const checkMidroll = async () => {
  if (!player || midrollPlayed.value || isPlayingAd.value) return;

  const currentTime = player.currentTime();
  const duration = player.duration();

  // Check if we're at ~50% of the video
  if (currentTime >= duration * 0.5 && currentTime <= duration * 0.51) {
    midrollPlayed.value = true;

    // Fetch and play midroll ad
    const midrollAd = await fetchMidrollAd();
    if (midrollAd) {
      console.log('Playing mid-roll ad:', midrollAd.title);
      const resumeTime = currentTime;

      // Play ad
      playAd(midrollAd, () => {
        // Resume main video after ad
        player.currentTime(resumeTime);
        player.play();
      });
    }
  }
};

/**
 * Handle pause event for pause-roll ads
 */
const handlePause = async () => {
  if (isPlayingAd.value) return; // Don't show pauseroll during ad

  // Fetch pauseroll ad if we don't have one
  if (!pauserollAd.value) {
    pauserollAd.value = await fetchPauserollAd();
  }

  if (pauserollAd.value) {
    showPauseroll.value = true;
    // Report impression
    reportAdView(pauserollAd.value.id, false, false, 0);
  }
};

/**
 * Handle play event to hide pause-roll
 */
const handlePlay = () => {
  if (showPauseroll.value) {
    showPauseroll.value = false;
  }
};

/**
 * Handle pauseroll click
 */
const handlePauserollClick = () => {
  if (!pauserollAd.value || !pauserollAd.value.clickUrl) return;

  // Report click
  reportAdView(pauserollAd.value.id, false, false, 0, true);

  // Open link in new tab
  window.open(pauserollAd.value.clickUrl, '_blank');
};

const initializePlayer = async () => {
  if (!videoElement.value || !streamUrl.value) {
    error.value = 'No se pudo inicializar el reproductor';
    loading.value = false;
    return;
  }

  try {
    player = videojs(videoElement.value, {
      controls: true,
      autoplay: true,
      preload: 'auto',
      fluid: true,
      responsive: true,
      aspectRatio: '16:9',
      playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
      controlBar: {
        volumePanel: {
          inline: false,
        },
        pictureInPictureToggle: true,
        fullscreenToggle: true,
      },
      html5: {
        vhs: {
          withCredentials: false,
        },
        nativeVideoTracks: false,
        nativeAudioTracks: false,
        nativeTextTracks: false,
      },
    });

    // Handle player events
    player.on('loadstart', () => {
      console.log('Video loading started');
      loading.value = true;
    });

    player.on('loadeddata', () => {
      console.log('Video data loaded');
      loading.value = false;
    });

    player.on('canplay', () => {
      console.log('Video can play');
      loading.value = false;
    });

    player.on('error', (e) => {
      console.error('Video.js error:', e);
      const playerError = player.error();
      if (playerError) {
        error.value = `Error de reproducción: ${playerError.message || 'Error desconocido'}`;
        emit('error', playerError);
      }
      loading.value = false;
    });

    player.on('ended', () => {
      // Only emit ended if it's the main video, not an ad
      if (!isPlayingAd.value) {
        console.log('Main video ended');
        emit('ended');
      }
    });

    // Listen for pause events (for pauseroll ads)
    player.on('pause', handlePause);

    // Listen for play events (to hide pauseroll)
    player.on('play', handlePlay);

    // Listen for timeupdate to check for midroll
    player.on('timeupdate', checkMidroll);

    // Force controls to be visible
    player.ready(function() {
      this.controlBar.show();
      console.log('Player ready, stream URL:', streamUrl.value);
    });

    // Check for pre-roll ad
    const prerollAd = await fetchPrerollAd();

    if (prerollAd) {
      console.log('Playing pre-roll ad:', prerollAd.title);
      playAd(prerollAd);
    } else {
      console.log('No pre-roll ad, playing main video');
      playMainVideo();
    }

  } catch (err) {
    console.error('Error initializing player:', err);
    error.value = 'Error al inicializar el reproductor';
    loading.value = false;
  }
};

onMounted(() => {
  initializePlayer();
});

onBeforeUnmount(() => {
  if (player) {
    player.dispose();
    player = null;
  }
});
</script>

<style>
/* Global styles for Video.js - NOT scoped */
.video-player-container {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #000;
  overflow: hidden;
}

.video-player-container .video-js {
  width: 100% !important;
  height: 100% !important;
  position: absolute;
  top: 0;
  left: 0;
}

/* Force controls to be visible and properly positioned */
.video-player-container .vjs-control-bar {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  position: absolute !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  width: 100% !important;
  height: 3em !important;
  background-color: rgba(43, 51, 63, 0.7) !important;
}

/* Keep controls visible even when user is inactive */
.video-player-container .vjs-has-started.vjs-user-inactive.vjs-playing .vjs-control-bar {
  opacity: 1 !important;
  visibility: visible !important;
  transform: translateY(0) !important;
}

/* Ensure big play button is visible */
.video-player-container .vjs-big-play-button {
  display: block !important;
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
}

/* Hide big play button when playing */
.video-player-container .vjs-has-started .vjs-big-play-button {
  display: none !important;
}

/* Loading overlay */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.9);
  z-index: 999;
  pointer-events: none;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: #E50914;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-overlay p {
  margin-top: 16px;
  color: white;
  font-size: 18px;
}

/* Error overlay */
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #000;
  color: white;
  padding: 20px;
  text-align: center;
  z-index: 1000;
}

.error-icon {
  width: 64px;
  height: 64px;
  color: #E50914;
  margin-bottom: 20px;
}

.error-overlay h2 {
  font-size: 24px;
  margin-bottom: 10px;
}

.error-overlay p {
  color: #999;
  font-size: 16px;
}

/* Ad overlay styles */
.ad-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10;
}

.ad-badge {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(229, 9, 20, 0.9);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ad-icon {
  font-size: 18px;
}

.ad-click-area {
  position: absolute;
  bottom: 80px;
  left: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.8);
  padding: 15px 20px;
  border-radius: 8px;
  cursor: pointer;
  pointer-events: all;
  transition: background 0.2s;
}

.ad-click-area:hover {
  background: rgba(0, 0, 0, 0.9);
}

.ad-title {
  color: white;
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 5px 0;
}

.ad-campaign {
  color: #ccc;
  font-size: 14px;
  margin: 0;
}

/* Pauseroll overlay styles */
.pauseroll-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.85);
  z-index: 15;
  cursor: pointer;
  backdrop-filter: blur(8px);
}

.pauseroll-content {
  display: flex;
  max-width: 800px;
  background: rgba(20, 20, 20, 0.95);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  transition: transform 0.2s;
}

.pauseroll-content:hover {
  transform: scale(1.02);
}

.pauseroll-image {
  width: 300px;
  height: 200px;
  object-fit: cover;
}

.pauseroll-info {
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.pauseroll-badge {
  display: inline-block;
  background: rgba(229, 9, 20, 0.9);
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 12px;
  align-self: flex-start;
}

.pauseroll-title {
  color: white;
  font-size: 24px;
  font-weight: bold;
  margin: 0 0 8px 0;
}

.pauseroll-campaign {
  color: #ccc;
  font-size: 16px;
  margin: 0 0 16px 0;
}

.pauseroll-cta {
  background: #E50914;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
  align-self: flex-start;
}

.pauseroll-cta:hover {
  background: #B8070F;
}

/* Responsive design for pauseroll */
@media (max-width: 768px) {
  .pauseroll-content {
    flex-direction: column;
    max-width: 90%;
  }

  .pauseroll-image {
    width: 100%;
    height: 180px;
  }

  .pauseroll-info {
    padding: 20px;
  }

  .pauseroll-title {
    font-size: 20px;
  }

  .pauseroll-campaign {
    font-size: 14px;
  }
}
</style>
