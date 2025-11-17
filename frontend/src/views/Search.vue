<template>
  <div class="min-h-screen bg-dark">
    <!-- Navigation Bar -->
    <nav class="fixed top-0 w-full z-50 bg-dark">
      <div class="flex items-center justify-between px-8 py-4">
        <!-- Back Button -->
        <button @click="$router.back()" class="flex items-center gap-2 hover:text-gray-300 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Volver</span>
        </button>

        <!-- User Menu -->
        <div class="flex items-center gap-6">
          <div class="w-8 h-8 bg-primary rounded overflow-hidden">
            <img v-if="currentProfile?.avatar" :src="currentProfile.avatar" alt="Profile" class="w-full h-full object-cover" />
            <span v-else class="flex items-center justify-center h-full text-sm">{{ currentProfile?.name?.[0] || 'U' }}</span>
          </div>
        </div>
      </div>
    </nav>

    <!-- Search Content -->
    <div class="pt-24 px-8">
      <!-- Search Input -->
      <div class="max-w-4xl mx-auto mb-12">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar películas, series..."
            class="w-full px-6 py-4 pl-14 bg-dark-lighter border border-gray-600 rounded-lg focus:outline-none focus:border-primary text-white text-lg"
            @input="onSearchInput"
            autofocus
          />
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
      </div>

      <!-- No Query -->
      <div v-else-if="!searchQuery" class="text-center py-20">
        <svg class="w-24 h-24 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h2 class="text-2xl font-semibold text-gray-400 mb-2">Busca tu contenido favorito</h2>
        <p class="text-gray-500">Escribe el nombre de una película o serie para empezar</p>
      </div>

      <!-- No Results -->
      <div v-else-if="!loading && results.length === 0" class="text-center py-20">
        <svg class="w-24 h-24 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 class="text-2xl font-semibold text-gray-400 mb-2">No se encontraron resultados</h2>
        <p class="text-gray-500">Intenta con otras palabras clave</p>
      </div>

      <!-- Results Grid -->
      <div v-else class="max-w-7xl mx-auto">
        <h2 class="text-2xl font-semibold mb-6">Resultados para "{{ searchQuery }}"</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div
            v-for="item in results"
            :key="item.Id"
            class="cursor-pointer group"
            @click="showItemInfo(item)"
          >
            <div class="relative aspect-[2/3] rounded overflow-hidden mb-2 transform group-hover:scale-105 transition-transform">
              <img
                :src="getImageUrl(item.Id)"
                :alt="item.Name"
                class="w-full h-full object-cover"
              />
              <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <svg class="w-16 h-16 opacity-0 group-hover:opacity-100 transition-opacity" fill="white" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            <h3 class="font-semibold text-sm mb-1 truncate">{{ item.Name }}</h3>
            <div class="flex items-center gap-2 text-xs text-gray-400">
              <span v-if="item.ProductionYear">{{ item.ProductionYear }}</span>
              <span v-if="item.Type === 'Movie'">Película</span>
              <span v-else-if="item.Type === 'Series'">Serie</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Item Details Modal -->
    <ItemDetailsModal
      v-if="selectedItem"
      :item="selectedItem"
      @close="selectedItem = null"
      @play="playItem"
      @item-selected="showItemInfo"
    />
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import jellyfinService from '@/services/jellyfin';
import ItemDetailsModal from '@/components/ItemDetailsModal.vue';

export default {
  name: 'Search',
  components: {
    ItemDetailsModal,
  },
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();

    const searchQuery = ref('');
    const results = ref([]);
    const loading = ref(false);
    const selectedItem = ref(null);
    const searchTimeout = ref(null);

    const currentProfile = computed(() => authStore.currentProfile);

    const performSearch = async () => {
      if (!searchQuery.value || searchQuery.value.length < 2) {
        results.value = [];
        return;
      }

      loading.value = true;

      try {
        const items = await jellyfinService.searchItems(searchQuery.value, 50);
        results.value = items;
      } catch (error) {
        console.error('Search failed:', error);
        results.value = [];
      } finally {
        loading.value = false;
      }
    };

    const onSearchInput = () => {
      // Debounce search
      if (searchTimeout.value) {
        clearTimeout(searchTimeout.value);
      }

      searchTimeout.value = setTimeout(() => {
        performSearch();
      }, 500);
    };

    const getImageUrl = (itemId) => {
      return jellyfinService.getImageUrl(itemId, 'Primary', 400);
    };

    const showItemInfo = async (item) => {
      try {
        const details = await jellyfinService.getItemDetails(item.Id);
        selectedItem.value = details;
      } catch (error) {
        console.error('Failed to load item details:', error);
        selectedItem.value = item;
      }
    };

    const playItem = (item) => {
      router.push({ name: 'Watch', params: { id: item.Id } });
    };

    return {
      searchQuery,
      results,
      loading,
      selectedItem,
      currentProfile,
      onSearchInput,
      getImageUrl,
      showItemInfo,
      playItem,
    };
  },
};
</script>
