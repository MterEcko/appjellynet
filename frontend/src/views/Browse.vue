<template>
  <div class="min-h-screen bg-dark">
    <!-- Navigation Bar -->
    <nav class="fixed top-0 w-full z-50 transition-all duration-300" :class="{ 'bg-dark': scrolled, 'bg-gradient-to-b from-black/80 to-transparent': !scrolled }">
      <div class="flex items-center justify-between px-8 py-4">
        <!-- Logo -->
        <div class="flex items-center gap-8">
          <h1 class="text-3xl font-bold text-primary">QbitStream</h1>

          <!-- Navigation Links -->
          <div class="hidden md:flex gap-6 text-sm">
            <a href="#" class="hover:text-gray-300 transition-colors">Inicio</a>
            <a href="#" class="hover:text-gray-300 transition-colors">Películas</a>
            <a href="#" class="hover:text-gray-300 transition-colors">Series</a>
            <a href="#" class="hover:text-gray-300 transition-colors">Mi Lista</a>
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
      v-if="featuredItem"
      :featured-item="featuredItem"
      :server-url="serverUrl"
      @play="playItem"
      @info="showItemInfo"
    />

    <!-- Content Rows -->
    <div class="-mt-32 relative z-20">
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
import jellyfinService from '@/services/jellyfin';

export default {
  name: 'Browse',
  components: {
    HeroBanner,
    ContentRow,
  },
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();

    const scrolled = ref(false);
    const showProfileMenu = ref(false);
    const loading = ref(true);

    const serverUrl = ref('');
    const featuredItem = ref(null);
    const continueWatching = ref([]);
    const latestMovies = ref([]);
    const latestSeries = ref([]);
    const popularItems = ref([]);

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
      router.push({ name: 'Watch', params: { id: item.Id } });
    };

    const showItemInfo = (item) => {
      // TODO: Show item details modal
      console.log('Show info for:', item);
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
      serverUrl,
      featuredItem,
      continueWatching,
      latestMovies,
      latestSeries,
      popularItems,
      currentProfile,
      playItem,
      showItemInfo,
      logout,
    };
  },
};
</script>
