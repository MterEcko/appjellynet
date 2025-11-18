<template>
  <div v-if="item" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="$emit('close')">
    <!-- Backdrop -->
    <div class="absolute inset-0 bg-black/80" @click="$emit('close')"></div>

    <!-- Modal Content -->
    <div class="relative bg-dark-lighter rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
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
          :alt="item.Name"
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-dark-lighter via-dark-lighter/50 to-transparent"></div>

        <!-- Title and Actions -->
        <div class="absolute bottom-0 left-0 right-0 p-8">
          <h2 class="text-4xl font-bold mb-4">{{ item.Name }}</h2>

          <div class="flex gap-3">
            <button
              @click="$emit('play', item)"
              class="flex items-center gap-2 bg-white text-black px-6 py-2 rounded font-semibold hover:bg-gray-200 transition-colors"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              {{ item.Type === 'Series' ? 'Ver series' : 'Reproducir' }}
            </button>

            <button
              @click="handleWatchlistToggle"
              :class="{ 'bg-white text-black border-white': isInWatchlistState }"
              class="w-10 h-10 flex items-center justify-center rounded-full border-2 border-gray-400 hover:border-white transition-colors"
              :title="isInWatchlistState ? 'Quitar de mi lista' : 'Agregar a mi lista'"
            >
              <svg v-if="!isInWatchlistState" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            </button>

            <button
              @click="handleFavoriteToggle"
              :class="{ 'bg-white text-black border-white': isFavoritedState }"
              class="w-10 h-10 flex items-center justify-center rounded-full border-2 border-gray-400 hover:border-white transition-colors"
              :title="isFavoritedState ? 'Quitar me gusta' : 'Me gusta'"
            >
              <svg v-if="!isFavoritedState" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Details -->
      <div class="p-8">
        <div class="grid grid-cols-3 gap-8">
          <!-- Left Column -->
          <div class="col-span-2">
            <!-- Metadata -->
            <div class="flex items-center gap-4 mb-4 text-sm">
              <span v-if="item.CommunityRating" class="text-green-400 font-semibold">
                {{ Math.round(item.CommunityRating * 10) }}% Match
              </span>
              <span v-if="item.ProductionYear">{{ item.ProductionYear }}</span>
              <span v-if="item.OfficialRating" class="border border-gray-400 px-2 py-0.5">
                {{ item.OfficialRating }}
              </span>
              <span v-if="item.RunTimeTicks">{{ formatRuntime(item.RunTimeTicks) }}</span>
              <span v-if="item.Type === 'Series' && item.ChildCount">
                {{ item.ChildCount }} temporada{{ item.ChildCount !== 1 ? 's' : '' }}
              </span>
            </div>

            <!-- Overview -->
            <p v-if="item.Overview" class="text-gray-300 mb-6">
              {{ item.Overview }}
            </p>
          </div>

          <!-- Right Column -->
          <div class="col-span-1">
            <!-- Cast -->
            <div v-if="item.People && item.People.length > 0" class="mb-4">
              <h3 class="text-gray-400 text-sm mb-2">Reparto:</h3>
              <p class="text-sm">
                {{ item.People.slice(0, 5).map(p => p.Name).join(', ') }}
              </p>
            </div>

            <!-- Genres -->
            <div v-if="item.Genres && item.Genres.length > 0" class="mb-4">
              <h3 class="text-gray-400 text-sm mb-2">Géneros:</h3>
              <p class="text-sm">{{ item.Genres.join(', ') }}</p>
            </div>

            <!-- Studios -->
            <div v-if="item.Studios && item.Studios.length > 0" class="mb-4">
              <h3 class="text-gray-400 text-sm mb-2">Estudio:</h3>
              <p class="text-sm">{{ item.Studios.map(s => s.Name).join(', ') }}</p>
            </div>
          </div>
        </div>

        <!-- Similar Content -->
        <div v-if="similarItems.length > 0" class="mt-8">
          <h3 class="text-xl font-semibold mb-4">Títulos similares</h3>
          <div class="grid grid-cols-3 gap-4">
            <div
              v-for="similar in similarItems.slice(0, 3)"
              :key="similar.Id"
              class="bg-dark rounded overflow-hidden cursor-pointer hover:scale-105 transition-transform"
              @click="$emit('item-selected', similar)"
            >
              <img
                :src="getImageUrl(similar.Id)"
                :alt="similar.Name"
                class="w-full h-48 object-cover"
              />
              <div class="p-3">
                <h4 class="font-semibold text-sm mb-1">{{ similar.Name }}</h4>
                <p class="text-xs text-gray-400 line-clamp-2">{{ similar.Overview }}</p>
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
import { useWatchlist } from '@/composables/useWatchlist';
import { useFavorites } from '@/composables/useFavorites';

export default {
  name: 'ItemDetailsModal',
  props: {
    item: {
      type: Object,
      default: null,
    },
  },
  emits: ['close', 'play', 'item-selected'],
  setup(props) {
    const similarItems = ref([]);
    const isInWatchlistState = ref(false);
    const isFavoritedState = ref(false);

    const { toggleWatchlist, isInWatchlist } = useWatchlist();
    const { toggleFavorite, isFavorited } = useFavorites();

    const backdropUrl = computed(() => {
      if (!props.item) return '';
      return jellyfinService.getBackdropUrl(props.item, 1280);
    });

    const getImageUrl = (itemId) => {
      return jellyfinService.getImageUrl(itemId, 'Primary', 300);
    };

    const formatRuntime = (ticks) => {
      const minutes = Math.floor(ticks / 600000000);
      if (minutes < 60) return `${minutes} min`;
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}min`;
    };

    const handleWatchlistToggle = async () => {
      if (!props.item) return;
      const success = await toggleWatchlist(props.item);
      if (success) {
        isInWatchlistState.value = !isInWatchlistState.value;
      }
    };

    const handleFavoriteToggle = async () => {
      if (!props.item) return;
      const success = await toggleFavorite(props.item);
      if (success) {
        isFavoritedState.value = !isFavoritedState.value;
      }
    };

    const checkStatuses = async () => {
      if (!props.item) return;
      isInWatchlistState.value = await isInWatchlist(props.item.Id);
      isFavoritedState.value = await isFavorited(props.item.Id);
    };

    // Load similar items when item changes
    watch(
      () => props.item,
      async (newItem) => {
        if (newItem) {
          // Check watchlist and favorite status
          await checkStatuses();

          // Load similar items
          try {
            similarItems.value = await jellyfinService.getSimilarItems(newItem.Id, 6);
          } catch (error) {
            console.error('Failed to load similar items:', error);
            similarItems.value = [];
          }
        }
      },
      { immediate: true }
    );

    return {
      similarItems,
      backdropUrl,
      getImageUrl,
      formatRuntime,
      isInWatchlistState,
      isFavoritedState,
      handleWatchlistToggle,
      handleFavoriteToggle,
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
