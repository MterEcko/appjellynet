<template>
  <div class="video-player-container">
    <!-- Ad Overlay -->
    <div v-if="isPlayingAd" class="ad-overlay">
      <div class="ad-info">
        <span class="ad-badge">Anuncio</span>
        <span v-if="adTimeRemaining > 0" class="ad-timer">
          El contenido comenzará en {{ adTimeRemaining }}s
        </span>
      </div>
      <button
        v-if="canSkipAd"
        @click="skipAd"
        class="skip-ad-button"
      >
        Saltar anuncio →
      </button>
    </div>

    <!-- Video Element -->
    <video
      ref="videoPlayer"
      class="video-js vjs-default-skin vjs-big-play-centered"
      controls
      preload="auto"
      @ended="handleVideoEnded"
      @timeupdate="handleTimeUpdate"
      @play="handlePlay"
      @pause="handlePause"
    ></video>

    <!-- Loading Spinner -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Cargando...</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import api from '@/services/api';

export default {
  name: 'VideoPlayer',
  props: {
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
      required: true,
    },
    jellyfinToken: {
      type: String,
      required: true,
    },
  },
  emits: ['ended', 'error'],
  setup(props, { emit }) {
    const videoPlayer = ref(null);
    let player = null;

    const loading = ref(true);
    const isPlayingAd = ref(false);
    const currentAd = ref(null);
    const adTimeRemaining = ref(0);
    const canSkipAd = ref(false);
    const adStartTime = ref(0);

    let midrollPositions = [];
    let shownMidrolls = new Set();
    let contentDuration = 0;

    /**
     * Initialize video player
     */
    const initPlayer = async () => {
      try {
        loading.value = true;

        // Show pre-roll ad first
        await showPrerollAd();

        // Initialize Video.js player
        player = videojs(videoPlayer.value, {
          fluid: true,
          aspectRatio: '16:9',
          playbackRates: [0.5, 1, 1.25, 1.5, 2],
          controlBar: {
            volumePanel: { inline: false },
          },
        });

        // Load content
        const contentUrl = `${props.serverUrl}/Videos/${props.itemId}/stream?Static=true&mediaSourceId=${props.mediaSourceId}&api_key=${props.jellyfinToken}`;

        player.src({
          type: 'video/mp4',
          src: contentUrl,
        });

        player.on('loadedmetadata', () => {
          contentDuration = player.duration();
          calculateMidrollPositions();
        });

        player.on('timeupdate', checkMidrollPositions);

        loading.value = false;

      } catch (error) {
        console.error('Failed to initialize player:', error);
        loading.value = false;
        emit('error', error);
      }
    };

    /**
     * Show pre-roll ad
     */
    const showPrerollAd = async () => {
      try {
        const response = await api.post('/ads/select', {
          type: 'PREROLL',
          contentId: props.itemId,
        });

        const ad = response.data.data;
        if (ad) {
          await playAd(ad);
        }
      } catch (error) {
        console.error('Failed to load pre-roll ad:', error);
        // Continue without ad
      }
    };

    /**
     * Play an ad
     */
    const playAd = (ad) => {
      return new Promise((resolve) => {
        currentAd.value = ad;
        isPlayingAd.value = true;
        adStartTime.value = Date.now();
        adTimeRemaining.value = ad.duration;
        canSkipAd.value = false;

        // Initialize ad player if not exists
        if (!player) {
          player = videojs(videoPlayer.value, {
            fluid: true,
            aspectRatio: '16:9',
            controls: false, // Disable controls for ads
          });
        }

        // Load ad
        const adUrl = ad.url.startsWith('http') ? ad.url : `${import.meta.env.VITE_API_URL.replace('/api', '')}${ad.url}`;

        player.src({
          type: 'video/mp4',
          src: adUrl,
        });

        player.play();

        // Countdown timer
        const countdownInterval = setInterval(() => {
          const elapsed = Math.floor((Date.now() - adStartTime.value) / 1000);
          adTimeRemaining.value = Math.max(0, ad.duration - elapsed);

          // Allow skip after specified time
          if (ad.skipAfter && elapsed >= ad.skipAfter) {
            canSkipAd.value = true;
          }

          if (adTimeRemaining.value === 0) {
            clearInterval(countdownInterval);
          }
        }, 1000);

        // Ad ended
        player.one('ended', async () => {
          clearInterval(countdownInterval);
          await trackAdView(ad, true, false, ad.duration);
          isPlayingAd.value = false;
          currentAd.value = null;
          player.controls(true); // Re-enable controls
          resolve();
        });
      });
    };

    /**
     * Skip ad
     */
    const skipAd = async () => {
      if (!canSkipAd.value || !currentAd.value) return;

      const watchedSeconds = Math.floor((Date.now() - adStartTime.value) / 1000);
      await trackAdView(currentAd.value, false, true, watchedSeconds);

      player.pause();
      isPlayingAd.value = false;
      currentAd.value = null;
      player.controls(true);
    };

    /**
     * Track ad view
     */
    const trackAdView = async (ad, completed, skipped, watchedSeconds) => {
      try {
        await api.post('/ads/track', {
          adId: ad.id,
          contentId: props.itemId,
          completed,
          skipped,
          watchedSeconds,
        });
      } catch (error) {
        console.error('Failed to track ad view:', error);
      }
    };

    /**
     * Calculate mid-roll positions
     */
    const calculateMidrollPositions = async () => {
      if (contentDuration < 600) return; // No mid-rolls for content < 10 minutes

      try {
        const response = await api.post('/ads/midroll-positions', {
          contentDurationSeconds: Math.floor(contentDuration),
          midrollCount: 2,
        });

        midrollPositions = response.data.data.positions;
      } catch (error) {
        console.error('Failed to calculate mid-roll positions:', error);
      }
    };

    /**
     * Check for mid-roll positions
     */
    const checkMidrollPositions = async () => {
      if (isPlayingAd.value || !player) return;

      const currentTime = Math.floor(player.currentTime());

      for (const position of midrollPositions) {
        if (!shownMidrolls.has(position) && currentTime >= position && currentTime < position + 5) {
          shownMidrolls.add(position);
          await showMidrollAd();
          break;
        }
      }
    };

    /**
     * Show mid-roll ad
     */
    const showMidrollAd = async () => {
      try {
        const response = await api.post('/ads/select', {
          type: 'MIDROLL',
          contentId: props.itemId,
        });

        const ad = response.data.data;
        if (ad) {
          const resumePosition = player.currentTime();
          player.pause();
          await playAd(ad);
          player.currentTime(resumePosition);
          player.play();
        }
      } catch (error) {
        console.error('Failed to load mid-roll ad:', error);
      }
    };

    /**
     * Handle video ended
     */
    const handleVideoEnded = () => {
      emit('ended');
    };

    /**
     * Handle time update
     */
    const handleTimeUpdate = () => {
      // Report progress to Jellyfin
      if (player && !isPlayingAd.value) {
        const positionTicks = Math.floor(player.currentTime() * 10000000);
        // You can implement progress reporting here
      }
    };

    /**
     * Handle play
     */
    const handlePlay = () => {
      // Player started/resumed
    };

    /**
     * Handle pause
     */
    const handlePause = async () => {
      if (isPlayingAd.value) return;

      // Show pause-roll ad
      try {
        const response = await api.post('/ads/select', {
          type: 'PAUSEROLL',
          contentId: props.itemId,
        });

        const ad = response.data.data;
        if (ad) {
          // You can show pause-roll as overlay instead of interrupting
          console.log('Pause-roll ad available:', ad);
        }
      } catch (error) {
        console.error('Failed to load pause-roll ad:', error);
      }
    };

    /**
     * Cleanup
     */
    const cleanup = () => {
      if (player) {
        player.dispose();
        player = null;
      }
    };

    onMounted(() => {
      initPlayer();
    });

    onBeforeUnmount(() => {
      cleanup();
    });

    return {
      videoPlayer,
      loading,
      isPlayingAd,
      adTimeRemaining,
      canSkipAd,
      skipAd,
      handleVideoEnded,
      handleTimeUpdate,
      handlePlay,
      handlePause,
    };
  },
};
</script>

<style scoped>
.video-player-container {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #000;
}

.video-js {
  width: 100%;
  height: 100%;
}

.ad-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  pointer-events: none;
}

.ad-info {
  position: absolute;
  top: 20px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ad-badge {
  background: #E50914;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  width: fit-content;
}

.ad-timer {
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
}

.skip-ad-button {
  position: absolute;
  bottom: 80px;
  right: 20px;
  background: rgba(255, 255, 255, 0.9);
  color: #000;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  pointer-events: all;
  transition: background 0.2s;
}

.skip-ad-button:hover {
  background: rgba(255, 255, 255, 1);
}

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
</style>
