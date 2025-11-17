<template>
  <div class="hero-banner relative h-screen">
    <!-- Background Image with Gradient -->
    <div class="absolute inset-0">
      <img
        v-if="featuredItem"
        :src="backdropUrl"
        :alt="featuredItem.Name"
        class="w-full h-full object-cover"
      />
      <div class="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent"></div>
      <div class="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent"></div>
    </div>

    <!-- Content -->
    <div class="relative z-10 h-full flex items-center px-8 md:px-16">
      <div class="max-w-2xl">
        <!-- Logo or Title -->
        <h1 class="text-6xl font-bold mb-4">
          {{ featuredItem?.Name || 'QbitStream' }}
        </h1>

        <!-- Metadata -->
        <div v-if="featuredItem" class="flex items-center gap-4 mb-4 text-sm">
          <span v-if="featuredItem.CommunityRating" class="text-green-400 font-semibold">
            {{ Math.round(featuredItem.CommunityRating * 10) }}% Match
          </span>
          <span v-if="featuredItem.ProductionYear">{{ featuredItem.ProductionYear }}</span>
          <span v-if="featuredItem.OfficialRating" class="border border-gray-400 px-2 py-0.5">
            {{ featuredItem.OfficialRating }}
          </span>
          <span v-if="featuredItem.RunTimeTicks">
            {{ formatRuntime(featuredItem.RunTimeTicks) }}
          </span>
        </div>

        <!-- Overview -->
        <p v-if="featuredItem?.Overview" class="text-lg mb-6 line-clamp-3">
          {{ featuredItem.Overview }}
        </p>

        <!-- Genres -->
        <div v-if="featuredItem?.Genres" class="flex gap-2 mb-8 text-sm">
          <span
            v-for="genre in featuredItem.Genres.slice(0, 3)"
            :key="genre"
            class="text-gray-400"
          >
            {{ genre }}
          </span>
        </div>

        <!-- Actions -->
        <div class="flex gap-4">
          <button
            @click="$emit('play', featuredItem)"
            class="flex items-center gap-2 bg-white text-black px-8 py-3 rounded font-semibold text-lg hover:bg-gray-200 transition-colors"
          >
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Reproducir
          </button>

          <button
            @click="$emit('info', featuredItem)"
            class="flex items-center gap-2 bg-gray-700/80 text-white px-8 py-3 rounded font-semibold text-lg hover:bg-gray-600/80 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Más información
          </button>
        </div>
      </div>
    </div>

    <!-- Scroll indicator -->
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
      <svg class="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'HeroBanner',
  props: {
    featuredItem: {
      type: Object,
      default: null,
    },
    serverUrl: {
      type: String,
      required: true,
    },
  },
  emits: ['play', 'info'],
  setup(props) {
    const backdropUrl = computed(() => {
      if (!props.featuredItem?.BackdropImageTags?.length) return '';
      return `${props.serverUrl}/Items/${props.featuredItem.Id}/Images/Backdrop/0?maxWidth=1920&tag=${props.featuredItem.BackdropImageTags[0]}`;
    });

    const formatRuntime = (ticks) => {
      const minutes = Math.floor(ticks / 600000000);
      if (minutes < 60) return `${minutes} min`;
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}min`;
    };

    return {
      backdropUrl,
      formatRuntime,
    };
  },
};
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
