<template>
  <div class="content-row mb-8">
    <h2 class="text-2xl font-bold mb-4 px-8">{{ title }}</h2>

    <div class="relative group">
      <!-- Scroll Left Button -->
      <button
        v-if="canScrollLeft"
        @click="scrollLeft"
        class="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black p-4 rounded-r opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- Content Carousel -->
      <div
        ref="carouselContainer"
        class="flex gap-2 overflow-x-auto scroll-smooth scrollbar-hide px-8"
        @scroll="updateScrollButtons"
      >
        <div
          v-for="item in items"
          :key="item.Id"
          class="flex-none w-72 cursor-pointer transform transition-transform duration-300 hover:scale-105 hover:z-10"
          @click="$emit('play', item)"
        >
          <div class="relative aspect-video bg-gray-800 rounded overflow-hidden">
            <img
              v-if="item.ImageTags?.Primary"
              :src="getImageUrl(item)"
              :alt="item.Name"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity">
              <div class="absolute bottom-0 left-0 right-0 p-4">
                <h3 class="font-bold text-lg mb-1">{{ item.Name }}</h3>
                <p class="text-sm text-gray-300 line-clamp-2">{{ item.Overview }}</p>
                <div class="flex items-center gap-2 mt-2 text-xs text-gray-400">
                  <span v-if="item.ProductionYear">{{ item.ProductionYear }}</span>
                  <span v-if="item.CommunityRating">⭐ {{ item.CommunityRating.toFixed(1) }}</span>
                  <span v-if="item.RunTimeTicks">{{ formatRuntime(item.RunTimeTicks) }}</span>
                </div>
                <div v-if="item.Genres && item.Genres.length > 0" class="mt-1 text-xs text-gray-400">
                  {{ item.Genres.slice(0, 3).join(', ') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Scroll Right Button -->
      <button
        v-if="canScrollRight"
        @click="scrollRight"
        class="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black p-4 rounded-l opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';

export default {
  name: 'ContentRow',
  props: {
    title: {
      type: String,
      required: true,
    },
    items: {
      type: Array,
      default: () => [],
    },
    serverUrl: {
      type: String,
      required: true,
    },
  },
  emits: ['play'],
  setup(props) {
    const carouselContainer = ref(null);
    const canScrollLeft = ref(false);
    const canScrollRight = ref(false);

    const getImageUrl = (item) => {
      if (!item.ImageTags?.Primary) return '';
      return `${props.serverUrl}/Items/${item.Id}/Images/Primary?maxHeight=300&tag=${item.ImageTags.Primary}`;
    };

    const formatRuntime = (ticks) => {
      const minutes = Math.floor(ticks / 600000000);
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    };

    const scrollLeft = () => {
      if (carouselContainer.value) {
        carouselContainer.value.scrollBy({ left: -600, behavior: 'smooth' });
      }
    };

    const scrollRight = () => {
      if (carouselContainer.value) {
        carouselContainer.value.scrollBy({ left: 600, behavior: 'smooth' });
      }
    };

    const updateScrollButtons = () => {
      if (!carouselContainer.value) return;

      const { scrollLeft, scrollWidth, clientWidth } = carouselContainer.value;
      canScrollLeft.value = scrollLeft > 0;
      canScrollRight.value = scrollLeft < scrollWidth - clientWidth - 10;
    };

    onMounted(() => {
      updateScrollButtons();
      window.addEventListener('resize', updateScrollButtons);
    });

    return {
      carouselContainer,
      canScrollLeft,
      canScrollRight,
      getImageUrl,
      formatRuntime,
      scrollLeft,
      scrollRight,
      updateScrollButtons,
    };
  },
};
</script>
