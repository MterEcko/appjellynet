import { ref } from 'vue';
import api from '@/services/api';

export function useWatchlist() {
  const watchlist = ref([]);
  const loading = ref(false);

  /**
   * Add item to watchlist
   */
  const addToWatchlist = async (item) => {
    try {
      loading.value = true;
      await api.post('/watchlist', {
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

      // Reload watchlist
      await loadWatchlist();
      return true;
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Remove item from watchlist
   */
  const removeFromWatchlist = async (itemId) => {
    try {
      loading.value = true;
      await api.delete(`/watchlist/${itemId}`);

      // Reload watchlist
      await loadWatchlist();
      return true;
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Toggle watchlist status
   */
  const toggleWatchlist = async (item) => {
    const isInList = await isInWatchlist(item.Id);
    if (isInList) {
      return await removeFromWatchlist(item.Id);
    } else {
      return await addToWatchlist(item);
    }
  };

  /**
   * Check if item is in watchlist
   */
  const isInWatchlist = async (itemId) => {
    try {
      const response = await api.get(`/watchlist/check/${itemId}`);
      return response.data.data.isInWatchlist;
    } catch (error) {
      console.error('Failed to check watchlist:', error);
      return false;
    }
  };

  /**
   * Load user's watchlist
   */
  const loadWatchlist = async () => {
    try {
      loading.value = true;
      const response = await api.get('/watchlist');
      watchlist.value = response.data.data;
    } catch (error) {
      console.error('Failed to load watchlist:', error);
      watchlist.value = [];
    } finally {
      loading.value = false;
    }
  };

  return {
    watchlist,
    loading,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    isInWatchlist,
    loadWatchlist,
  };
}
