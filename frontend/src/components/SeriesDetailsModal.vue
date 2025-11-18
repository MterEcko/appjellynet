<template>
  <div v-if="series" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="$emit('close')">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/80" @click="$emit('close')"></div>

    <!-- Modal Content -->
    <div class="relative bg-dark-lighter rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
      <!-- Close Button -->
      <button
        @click="$emit('close')"
        class="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Backdrop Image -->
      <div class="relative h-96">
        <img
          v-if="backdropUrl"
          :src="backdropUrl"
          :alt="series.Name"
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-dark-lighter via-dark-lighter/50 to-transparent"></div>

        <!-- Title -->
        <div class="absolute bottom-0 left-0 right-0 p-8">
          <h2 class="text-4xl font-bold mb-2">{{ series.Name }}</h2>
          <div class="flex items-center gap-4 text-sm text-gray-300">
            <span v-if="series.ProductionYear">{{ series.ProductionYear }}</span>
            <span v-if="series.CommunityRating" class="text-green-400">
              {{ Math.round(series.CommunityRating * 10) }}% Match
            </span>
            <span v-if="seasons.length">{{ seasons.length }} temporada{{ seasons.length !== 1 ? 's' : '' }}</span>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="p-8">
        <!-- Overview -->
        <p v-if="series.Overview" class="text-gray-300 mb-6">
          {{ series.Overview }}
        </p>

        <!-- Genres -->
        <div v-if="series.Genres && series.Genres.length > 0" class="mb-6">
          <h3 class="text-gray-400 text-sm mb-2">Géneros:</h3>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="genre in series.Genres"
              :key="genre"
              class="px-3 py-1 bg-gray-800 rounded-full text-sm"
            >
              {{ genre }}
            </span>
          </div>
        </div>

        <!-- Seasons -->
        <div v-if="seasons.length > 0" class="mt-8">
          <h3 class="text-2xl font-semibold mb-4">Temporadas</h3>

          <!-- Season Selection Tabs -->
          <div class="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button
              v-for="season in seasons"
              :key="season.Id"
              @click="selectSeason(season)"
              :class="{
                'bg-primary text-black': selectedSeason?.Id === season.Id,
                'bg-gray-800 hover:bg-gray-700': selectedSeason?.Id !== season.Id,
              }"
              class="px-4 py-2 rounded font-semibold transition-colors whitespace-nowrap"
            >
              {{ season.Name }}
            </button>
          </div>

          <!-- Episodes List -->
          <div v-if="loadingEpisodes" class="text-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary mx-auto"></div>
            <p class="text-gray-400 mt-4">Cargando episodios...</p>
          </div>

          <div v-else-if="episodes.length > 0" class="grid grid-cols-1 gap-4">
            <div
              v-for="(episode, index) in episodes"
              :key="episode.Id"
              @click="$emit('play-episode', episode)"
              class="flex gap-4 bg-dark p-4 rounded hover:bg-gray-800 cursor-pointer transition-colors"
            >
              <!-- Episode Thumbnail -->
              <div class="flex-shrink-0 w-48 h-28 bg-gray-800 rounded overflow-hidden relative">
                <img
                  v-if="episode.ImageTags?.Primary"
                  :src="getImageUrl(episode.Id)"
                  :alt="episode.Name"
                  class="w-full h-full object-cover"
                />
                <div class="absolute inset-0 flex items-center justify-center">
                  <svg class="w-12 h-12 text-white opacity-0 hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>

              <!-- Episode Info -->
              <div class="flex-1">
                <div class="flex items-start justify-between mb-2">
                  <div>
                    <span class="text-gray-400 text-sm">{{ index + 1 }}.</span>
                    <h4 class="font-semibold inline ml-2">{{ episode.Name }}</h4>
                  </div>
                  <span v-if="episode.RunTimeTicks" class="text-gray-400 text-sm">
                    {{ formatRuntime(episode.RunTimeTicks) }}
                  </span>
                </div>
                <p v-if="episode.Overview" class="text-sm text-gray-400 line-clamp-2">
                  {{ episode.Overview }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';
import jellyfinService from '@/services/jellyfin';

export default {
  name: 'SeriesDetailsModal',
  props: {
    series: {
      type: Object,
      default: null,
    },
  },
  emits: ['close', 'play-episode'],
  setup(props) {
    const seasons = ref([]);
    const episodes = ref([]);
    const selectedSeason = ref(null);
    const loadingEpisodes = ref(false);

    const backdropUrl = computed(() => {
      if (!props.series) return '';
      return jellyfinService.getBackdropUrl(props.series, 1280);
    });

    const getImageUrl = (episodeId) => {
      return jellyfinService.getImageUrl(episodeId, 'Primary', 400);
    };

    const formatRuntime = (ticks) => {
      const minutes = Math.floor(ticks / 600000000);
      if (minutes < 60) return `${minutes} min`;
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}min`;
    };

    const loadSeasons = async () => {
      if (!props.series) return;

      try {
        const seasonsData = await jellyfinService.getSeasons(props.series.Id);
        seasons.value = seasonsData;

        // Auto-select first season
        if (seasonsData.length > 0) {
          await selectSeason(seasonsData[0]);
        }
      } catch (error) {
        console.error('Failed to load seasons:', error);
      }
    };

    const selectSeason = async (season) => {
      selectedSeason.value = season;
      loadingEpisodes.value = true;

      try {
        const episodesData = await jellyfinService.getEpisodes(props.series.Id, season.Id);
        episodes.value = episodesData;
      } catch (error) {
        console.error('Failed to load episodes:', error);
        episodes.value = [];
      } finally {
        loadingEpisodes.value = false;
      }
    };

    // Load seasons when series changes
    watch(
      () => props.series,
      async (newSeries) => {
        if (newSeries) {
          await loadSeasons();
        }
      },
      { immediate: true }
    );

    return {
      seasons,
      episodes,
      selectedSeason,
      loadingEpisodes,
      backdropUrl,
      getImageUrl,
      formatRuntime,
      selectSeason,
    };
  },
};
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
