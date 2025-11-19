<template>
  <div class="video-player-container">
    <!-- Video.js Player with Jellyfin Stream -->
    <video
      ref="videoElement"
      class="video-js vjs-default-skin vjs-big-play-centered"
    ></video>

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

const initializePlayer = () => {
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

    // Set the source
    player.src({
      src: streamUrl.value,
      type: 'video/mp4', // Jellyfin will handle transcoding if needed
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
      console.log('Video ended');
      emit('ended');
    });

    // Force controls to be visible
    player.ready(function() {
      this.controlBar.show();
      console.log('Player ready, stream URL:', streamUrl.value);
    });

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
</style>
