import { ref } from 'vue';
import api from '@/services/api';

export function useFavorites() {
  const favorites = ref([]);
  const loading = ref(false);

  /**
   * Add item to favorites
   */
  const addToFavorites = async (item) => {
    try {
      loading.value = true;
      await api.post('/favorites', {
        itemId: item.Id,
        itemType: item.Type,
        itemTitle: item.Name,
        itemData: {
          ImageTags: item.ImageTags,
          ProductionYear: item.ProductionYear,
          Overview: item.Overview,
          Genres: item.Genres,
        },
      });

      // Reload favorites
      await loadFavorites();
      return true;
    } catch (error) {
      console.error('Failed to add to favorites:', error);
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Remove item from favorites
   */
  const removeFromFavorites = async (itemId) => {
    try {
      loading.value = true;
      await api.delete(`/favorites/${itemId}`);

      // Reload favorites
      await loadFavorites();
      return true;
    } catch (error) {
      console.error('Failed to remove from favorites:', error);
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Toggle favorite status
   */
  const toggleFavorite = async (item) => {
    const isFav = await isFavorited(item.Id);
    if (isFav) {
      return await removeFromFavorites(item.Id);
    } else {
      return await addToFavorites(item);
    }
  };

  /**
   * Check if item is favorited
   */
  const isFavorited = async (itemId) => {
    try {
      const response = await api.get(`/favorites/check/${itemId}`);
      return response.data.data.isFavorited;
    } catch (error) {
      console.error('Failed to check favorite:', error);
      return false;
    }
  };

  /**
   * Load user's favorites
   */
  const loadFavorites = async () => {
    try {
      loading.value = true;
      const response = await api.get('/favorites');
      favorites.value = response.data.data;
    } catch (error) {
      console.error('Failed to load favorites:', error);
      favorites.value = [];
    } finally {
      loading.value = false;
    }
  };

  return {
    favorites,
    loading,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorited,
    loadFavorites,
  };
}
