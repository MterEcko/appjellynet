<template>
  <div class="jellyfin-player-container">
    <!-- Jellyfin Web Player in iframe -->
    <iframe
      v-if="jellyfinPlayerUrl"
      ref="playerIframe"
      :src="jellyfinPlayerUrl"
      class="jellyfin-iframe"
      allowfullscreen
      allow="autoplay; fullscreen; picture-in-picture"
      @load="handleIframeLoad"
    ></iframe>

    <!-- Loading Spinner -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Cargando reproductor...</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-overlay">
      <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h2>Error al cargar el reproductor</h2>
      <p>{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

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
const playerIframe = ref(null);

// Construct Jellyfin web player URL
const jellyfinPlayerUrl = computed(() => {
  try {
    // Use Jellyfin's web client video player
    const baseUrl = props.serverUrl.replace('/api', '');

    // Build the URL to Jellyfin's web player
    // Format: /web/index.html#!/video?id=ITEMID&mediaSourceId=MEDIASOURCEID&api_key=TOKEN
    let url = `${baseUrl}/web/index.html#!/video?id=${props.itemId}`;

    if (props.mediaSourceId) {
      url += `&mediaSourceId=${props.mediaSourceId}`;
    }

    url += `&api_key=${props.jellyfinToken}`;

    // Add auto-play parameter
    url += '&autoplay=true';

    return url;
  } catch (err) {
    console.error('Error building Jellyfin URL:', err);
    error.value = 'Error al construir la URL del reproductor';
    return null;
  }
});

const handleIframeLoad = () => {
  loading.value = false;
  console.log('Jellyfin player loaded');
};

// Listen for messages from iframe (for ended event)
const handleMessage = (event) => {
  // Check if message is from Jellyfin player
  if (event.origin !== new URL(props.serverUrl).origin) {
    return;
  }

  try {
    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

    if (data.type === 'playbackstop' || data.type === 'ended') {
      emit('ended');
    }
  } catch (err) {
    console.error('Error parsing iframe message:', err);
  }
};

onMounted(() => {
  window.addEventListener('message', handleMessage);

  // Set a timeout to hide loading spinner even if load event doesn't fire
  setTimeout(() => {
    if (loading.value) {
      loading.value = false;
    }
  }, 3000);
});

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage);
});
</script>

<style scoped>
.jellyfin-player-container {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #000;
  overflow: hidden;
}

.jellyfin-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
  background: #000;
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
