<template>
  <div class="watch-page">
    <!-- Media Source Selector (if multiple sources) -->
    <div v-if="mediaSources.length > 1" class="source-selector">
      <label>Fuente de Video:</label>
      <select v-model="selectedSourceIndex" @change="changeMediaSource" class="source-select">
        <option v-for="(source, index) in mediaSources" :key="source.Id" :value="index">
          {{ source.Name || `Fuente ${index + 1}` }} ({{ formatSize(source.Size) }})
        </option>
      </select>
    </div>

    <!-- Video Player -->
    <VideoPlayer
      v-if="itemDetails && serverUrl"
      :key="mediaSourceId"
      :item-id="itemId"
      :server-url="serverUrl"
      :media-source-id="mediaSourceId"
      :jellyfin-token="jellyfinToken"
      @ended="handleVideoEnded"
      @error="handleError"
    />

    <!-- Loading State -->
    <div v-else-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Cargando contenido...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h2>Error al cargar el video</h2>
      <p>{{ error }}</p>
      <button @click="$router.push('/browse')" class="btn-primary mt-4">
        Volver al inicio
      </button>
    </div>

    <!-- Back Button (Overlay) -->
    <button
      v-if="!loading && !error"
      @click="goBack"
      class="back-button"
      title="Volver"
    >
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import VideoPlayer from '@/components/VideoPlayer.vue';
import jellyfinService from '@/services/jellyfin';

export default {
  name: 'Watch',
  components: {
    VideoPlayer,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();

    const itemId = ref(route.params.id);
    const loading = ref(true);
    const error = ref(null);

    const itemDetails = ref(null);
    const serverUrl = ref('');
    const mediaSourceId = ref('');
    const jellyfinToken = ref('');
    const mediaSources = ref([]);
    const selectedSourceIndex = ref(0);

    /**
     * Load item details and prepare playback
     */
    const loadItemDetails = async () => {
      try {
        loading.value = true;
        error.value = null;

        // Initialize Jellyfin
        serverUrl.value = await jellyfinService.initializeJellyfin();

        // Get item details
        itemDetails.value = await jellyfinService.getItemDetails(itemId.value);

        // Get media sources
        if (itemDetails.value.MediaSources && itemDetails.value.MediaSources.length > 0) {
          mediaSources.value = itemDetails.value.MediaSources;
          mediaSourceId.value = mediaSources.value[selectedSourceIndex.value].Id;
        } else {
          throw new Error('No media sources available');
        }

        // Get Jellyfin token (from localStorage or backend)
        jellyfinToken.value = localStorage.getItem('jellyfinAccessToken') || '';

        loading.value = false;

      } catch (err) {
        console.error('Failed to load item details:', err);
        error.value = err.message || 'Error desconocido';
        loading.value = false;
      }
    };

    /**
     * Handle video ended
     */
    const handleVideoEnded = () => {
      // Show next episode or return to browse
      router.push('/browse');
    };

    /**
     * Handle playback error
     */
    const handleError = (err) => {
      error.value = err.message || 'Error en la reproducción';
    };

    /**
     * Go back
     */
    const goBack = () => {
      router.back();
    };

    /**
     * Change media source
     */
    const changeMediaSource = () => {
      mediaSourceId.value = mediaSources.value[selectedSourceIndex.value].Id;
    };

    /**
     * Format file size
     */
    const formatSize = (bytes) => {
      if (!bytes) return 'N/A';
      const gb = bytes / (1024 * 1024 * 1024);
      return `${gb.toFixed(2)} GB`;
    };

    onMounted(() => {
      loadItemDetails();
    });

    return {
      itemId,
      loading,
      error,
      itemDetails,
      serverUrl,
      mediaSourceId,
      jellyfinToken,
      mediaSources,
      selectedSourceIndex,
      handleVideoEnded,
      handleError,
      goBack,
      changeMediaSource,
      formatSize,
    };
  },
};
</script>

<style scoped>
.watch-page {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #000;
  overflow: hidden;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: white;
  text-align: center;
  padding: 20px;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: #E50914;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-icon {
  width: 80px;
  height: 80px;
  color: #E50914;
  margin-bottom: 20px;
}

.error-container h2 {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 10px;
}

.error-container p {
  color: #999;
  margin-bottom: 20px;
}

.back-button {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1001;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.back-button:hover {
  background: rgba(0, 0, 0, 0.9);
}

.source-selector {
  position: fixed;
  top: 20px;
  right: 80px;
  z-index: 1001;
  background: rgba(0, 0, 0, 0.8);
  padding: 10px 15px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.source-selector label {
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.source-select {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  min-width: 200px;
}

.source-select:hover {
  background: rgba(255, 255, 255, 0.15);
}

.source-select option {
  background: #1a1a1a;
  color: white;
}
</style>
