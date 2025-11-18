<template>
  <div class="min-h-screen bg-dark">
    <!-- Series Details Modal -->
    <SeriesDetailsModal
      v-if="selectedSeries"
      :series="selectedSeries"
      @close="selectedSeries = null"
      @play-episode="playEpisode"
    />

    <!-- Item Details Modal (for movies) -->
    <ItemDetailsModal
      v-if="selectedItem"
      :item="selectedItem"
      @close="selectedItem = null"
      @play="playItem"
      @item-selected="showItemInfo"
    />

    <!-- Navigation Bar -->
    <nav class="fixed top-0 w-full z-50 transition-all duration-300" :class="{ 'bg-dark': scrolled, 'bg-gradient-to-b from-black/80 to-transparent': !scrolled }">
      <div class="flex items-center justify-between px-8 py-4">
        <!-- Logo -->
        <div class="flex items-center gap-8">
          <h1 class="text-3xl font-bold text-primary">QbitStream</h1>

          <!-- Navigation Links -->
          <div class="hidden md:flex gap-6 text-sm">
            <button @click="currentView = 'home'" :class="{ 'text-white font-semibold': currentView === 'home' }" class="hover:text-gray-300 transition-colors">Inicio</button>
            <button @click="currentView = 'movies'" :class="{ 'text-white font-semibold': currentView === 'movies' }" class="hover:text-gray-300 transition-colors">Películas</button>
            <button @click="currentView = 'series'" :class="{ 'text-white font-semibold': currentView === 'series' }" class="hover:text-gray-300 transition-colors">Series</button>
            <button @click="loadGenresView" :class="{ 'text-white font-semibold': currentView === 'genres' }" class="hover:text-gray-300 transition-colors">Géneros</button>
            <button @click="loadMyList" :class="{ 'text-white font-semibold': currentView === 'mylist' }" class="hover:text-gray-300 transition-colors">Mi Lista</button>
          </div>
        </div>

        <!-- User Menu -->
        <div class="flex items-center gap-6">
          <router-link to="/search" class="hover:text-gray-300">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </router-link>

          <!-- Profile Dropdown -->
          <div class="relative">
            <button @click="showProfileMenu = !showProfileMenu" class="flex items-center gap-2">
              <div class="w-8 h-8 bg-primary rounded overflow-hidden">
                <img v-if="currentProfile?.avatar" :src="currentProfile.avatar" alt="Profile" class="w-full h-full object-cover" />
                <span v-else class="flex items-center justify-center h-full text-sm">{{ currentProfile?.name?.[0] || 'U' }}</span>
              </div>
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>

            <!-- Dropdown Menu -->
            <div v-if="showProfileMenu" class="absolute right-0 mt-2 w-48 bg-dark-lighter border border-gray-700 rounded shadow-xl">
              <router-link to="/profiles" class="block px-4 py-2 hover:bg-gray-700">Cambiar Perfil</router-link>
              <router-link to="/account" class="block px-4 py-2 hover:bg-gray-700">Mi Cuenta</router-link>
              <hr class="border-gray-700" />
              <button @click="logout" class="w-full text-left px-4 py-2 hover:bg-gray-700">Cerrar Sesión</button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Hero Banner -->
    <HeroBanner
      v-if="featuredItem && currentView === 'home'"
      :featured-item="featuredItem"
      :server-url="serverUrl"
      @play="playItem"
      @info="showItemInfo"
    />

    <!-- Content Rows -->
    <div :class="{ '-mt-32': currentView === 'home', 'pt-24': currentView !== 'home' }" class="relative z-20">
      <!-- Home View -->
      <template v-if="currentView === 'home'">
        <!-- Continue Watching -->
        <ContentRow
          v-if="continueWatching.length > 0"
          title="Continuar viendo"
          :items="continueWatching"
          :server-url="serverUrl"
          @play="playItem"
        />

        <!-- Latest Movies -->
        <ContentRow
          v-if="latestMovies.length > 0"
          title="Películas recientes"
          :items="latestMovies"
          :server-url="serverUrl"
          @play="playItem"
        />

        <!-- Latest Series -->
        <ContentRow
          v-if="latestSeries.length > 0"
          title="Series recientes"
          :items="latestSeries"
          :server-url="serverUrl"
          @play="playItem"
        />

        <!-- Popular -->
        <ContentRow
          v-if="popularItems.length > 0"
          title="Popular"
          :items="popularItems"
          :server-url="serverUrl"
          @play="playItem"
        />
      </template>

      <!-- Movies View -->
      <template v-else-if="currentView === 'movies'">
        <div class="px-8">
          <h1 class="text-4xl font-bold mb-8">Películas</h1>
        </div>
        <ContentRow
          v-if="latestMovies.length > 0"
          title="Todas las películas"
          :items="latestMovies"
          :server-url="serverUrl"
          @play="playItem"
        />
      </template>

      <!-- Series View -->
      <template v-else-if="currentView === 'series'">
        <div class="px-8">
          <h1 class="text-4xl font-bold mb-8">Series</h1>
        </div>
        <ContentRow
          v-if="latestSeries.length > 0"
          title="Todas las series"
          :items="latestSeries"
          :server-url="serverUrl"
          @play="playItem"
        />
      </template>

      <!-- My List View -->
      <template v-else-if="currentView === 'mylist'">
        <div class="px-8">
          <h1 class="text-4xl font-bold mb-8">Mi Lista</h1>
          <p v-if="myListItems.length === 0" class="text-gray-400">No tienes elementos en tu lista</p>
        </div>
        <ContentRow
          v-if="myListItems.length > 0"
          title="Mis películas y series"
          :items="myListItems"
          :server-url="serverUrl"
          @play="playItem"
        />
      </template>

      <!-- Genres View -->
      <template v-else-if="currentView === 'genres'">
        <div class="px-8">
          <h1 class="text-4xl font-bold mb-8">Géneros</h1>

          <!-- If no genre is selected, show genre grid -->
          <div v-if="!selectedGenre" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
            <button
              v-for="genre in genres"
              :key="genre.Id"
              @click="loadGenreContent(genre.Name)"
              class="bg-gray-800 hover:bg-gray-700 rounded-lg p-6 text-center transition-all hover:scale-105"
            >
              <h3 class="text-lg font-semibold">{{ genre.Name }}</h3>
            </button>
          </div>

          <!-- If genre is selected, show genre content -->
          <div v-else>
            <button @click="selectedGenre = null" class="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Volver a géneros
            </button>
            <ContentRow
              v-if="genreItems.length > 0"
              :title="selectedGenre"
              :items="genreItems"
              :server-url="serverUrl"
              @play="playItem"
            />
            <p v-else class="text-gray-400">No hay contenido disponible para este género</p>
          </div>
        </div>
      </template>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="fixed inset-0 flex items-center justify-center bg-dark z-50">
      <div class="text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mx-auto mb-4"></div>
        <p class="text-gray-400">Cargando contenido...</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import HeroBanner from '@/components/HeroBanner.vue';
import ContentRow from '@/components/ContentRow.vue';
import ItemDetailsModal from '@/components/ItemDetailsModal.vue';
import SeriesDetailsModal from '@/components/SeriesDetailsModal.vue';
import jellyfinService from '@/services/jellyfin';
import { useWatchlist } from '@/composables/useWatchlist';

export default {
  name: 'Browse',
  components: {
    HeroBanner,
    ContentRow,
    ItemDetailsModal,
    SeriesDetailsModal,
  },
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    const { watchlist, loadWatchlist } = useWatchlist();

    const scrolled = ref(false);
    const showProfileMenu = ref(false);
    const loading = ref(true);
    const selectedItem = ref(null);
    const selectedSeries = ref(null);
    const currentView = ref('home');

    const serverUrl = ref('');
    const featuredItem = ref(null);
    const continueWatching = ref([]);
    const latestMovies = ref([]);
    const latestSeries = ref([]);
    const popularItems = ref([]);
    const myListItems = ref([]);
    const genres = ref([]);
    const selectedGenre = ref(null);
    const genreItems = ref([]);

    const currentProfile = computed(() => authStore.currentProfile);

    const loadContent = async () => {
      try {
        loading.value = true;

        // Initialize Jellyfin
        serverUrl.value = await jellyfinService.initializeJellyfin();

        // Load all content in parallel
        const [resume, movies, series] = await Promise.all([
          jellyfinService.getResumeItems(),
          jellyfinService.getItemsByType('Movie', 20),
          jellyfinService.getItemsByType('Series', 20),
        ]);

        continueWatching.value = resume;
        latestMovies.value = movies;
        latestSeries.value = series;
        popularItems.value = [...movies, ...series].sort(() => Math.random() - 0.5).slice(0, 20);

        // Set featured item (random from latest)
        const allLatest = [...movies, ...series];
        if (allLatest.length > 0) {
          featuredItem.value = allLatest[Math.floor(Math.random() * Math.min(10, allLatest.length))];
        }

      } catch (error) {
        console.error('Failed to load content:', error);
        // Handle error - maybe redirect to login or show error message
      } finally {
        loading.value = false;
      }
    };

    const playItem = (item) => {
      if (item.Type === 'Series') {
        // For series, show series details modal with seasons/episodes
        showSeriesDetails(item);
      } else {
        // For movies, go directly to the player
        router.push({ name: 'Watch', params: { id: item.Id } });
      }
    };

    const playEpisode = (episode) => {
      // Close series modal and play episode
      selectedSeries.value = null;
      router.push({ name: 'Watch', params: { id: episode.Id } });
    };

    const showItemInfo = async (item) => {
      if (item.Type === 'Series') {
        showSeriesDetails(item);
      } else {
        try {
          // Load full item details for movies
          const details = await jellyfinService.getItemDetails(item.Id);
          selectedItem.value = details;
        } catch (error) {
          console.error('Failed to load item details:', error);
          // Fallback to basic item info
          selectedItem.value = item;
        }
      }
    };

    const showSeriesDetails = async (series) => {
      try {
        // Load full series details
        const details = await jellyfinService.getItemDetails(series.Id);
        selectedSeries.value = details;
      } catch (error) {
        console.error('Failed to load series details:', error);
        // Fallback to basic info
        selectedSeries.value = series;
      }
    };

    const loadMyList = async () => {
      currentView.value = 'mylist';
      try {
        await loadWatchlist();
        // Map watchlist items to Jellyfin items format
        myListItems.value = await Promise.all(
          watchlist.value.map(async (item) => {
            // Try to get full item details from Jellyfin
            try {
              const details = await jellyfinService.getItemDetails(item.itemId);
              return details;
            } catch (error) {
              // Fallback to stored data
              return {
                Id: item.itemId,
                Name: item.itemTitle,
                Type: item.itemType,
                ...item.itemData,
              };
            }
          })
        );
      } catch (error) {
        console.error('Failed to load my list:', error);
        myListItems.value = [];
      }
    };

    const loadGenresView = async () => {
      currentView.value = 'genres';
      selectedGenre.value = null;
      genreItems.value = [];

      if (genres.value.length === 0) {
        try {
          loading.value = true;
          genres.value = await jellyfinService.getGenres();
        } catch (error) {
          console.error('Failed to load genres:', error);
          genres.value = [];
        } finally {
          loading.value = false;
        }
      }
    };

    const loadGenreContent = async (genreName) => {
      selectedGenre.value = genreName;
      try {
        loading.value = true;
        genreItems.value = await jellyfinService.getItemsByGenre(genreName);
      } catch (error) {
        console.error('Failed to load genre content:', error);
        genreItems.value = [];
      } finally {
        loading.value = false;
      }
    };

    const logout = () => {
      authStore.logout();
      router.push({ name: 'Login' });
    };

    const handleScroll = () => {
      scrolled.value = window.scrollY > 50;
    };

    onMounted(() => {
      loadContent();
      window.addEventListener('scroll', handleScroll);
    });

    return {
      scrolled,
      showProfileMenu,
      loading,
      selectedItem,
      selectedSeries,
      currentView,
      serverUrl,
      featuredItem,
      continueWatching,
      latestMovies,
      latestSeries,
      popularItems,
      myListItems,
      genres,
      selectedGenre,
      genreItems,
      currentProfile,
      playItem,
      playEpisode,
      showItemInfo,
      showSeriesDetails,
      loadMyList,
      loadGenresView,
      loadGenreContent,
      logout,
    };
  },
};
</script>
