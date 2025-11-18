<template>
  <div class="min-h-screen flex items-center justify-center bg-dark">
    <div class="text-center">
      <h1 class="text-5xl font-bold mb-12">¿Quién está viendo?</h1>

      <div v-if="loading" class="flex justify-center">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>

      <div v-else class="flex flex-wrap justify-center gap-8 mb-12">
        <div
          v-for="profile in profiles"
          :key="profile.id"
          @click="selectProfile(profile)"
          class="cursor-pointer group"
        >
          <div class="w-32 h-32 mb-4 rounded-lg overflow-hidden border-4 border-transparent group-hover:border-white transition-all">
            <img
              :src="profile.avatar || '/default-avatar.png'"
              :alt="profile.name"
              class="w-full h-full object-cover"
            />
          </div>
          <p class="text-xl text-gray-400 group-hover:text-white transition-colors">
            {{ profile.name }}
          </p>
        </div>

        <div
          v-if="canAddProfile"
          @click="showAddProfile = true"
          class="cursor-pointer group"
        >
          <div class="w-32 h-32 mb-4 rounded-lg overflow-hidden border-4 border-transparent group-hover:border-white transition-all bg-dark-lighter flex items-center justify-center">
            <svg class="w-16 h-16 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p class="text-xl text-gray-400 group-hover:text-white transition-colors">
            Agregar Perfil
          </p>
        </div>
      </div>

      <button
        @click="handleManageProfiles"
        class="btn-secondary"
      >
        Administrar Perfiles
      </button>
    </div>

    <!-- Add Profile Modal -->
    <div
      v-if="showAddProfile"
      class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
      @click.self="showAddProfile = false"
    >
      <div class="bg-dark-lighter p-8 rounded-lg max-w-md w-full">
        <h2 class="text-2xl font-bold mb-6">Agregar Perfil</h2>
        <form @submit.prevent="handleAddProfile">
          <div class="mb-6">
            <label class="block text-sm font-medium mb-2">Nombre del Perfil</label>
            <input
              v-model="newProfileName"
              type="text"
              required
              class="w-full px-4 py-2 bg-dark border border-gray-600 rounded focus:outline-none focus:border-primary"
              placeholder="Ej: Juan"
            />
          </div>
          <div class="flex gap-4">
            <button type="submit" class="flex-1 btn-primary">
              Crear
            </button>
            <button type="button" @click="showAddProfile = false" class="flex-1 btn-secondary">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import api from '@/services/api';

export default {
  name: 'Profiles',
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();

    const profiles = ref([]);
    const loading = ref(true);
    const showAddProfile = ref(false);
    const newProfileName = ref('');

    const canAddProfile = computed(() => {
      const plan = authStore.user?.plan;
      const limits = {
        BASIC: 3,
        PREMIUM: 5,
        FAMILY: 8,
      };
      return profiles.value.length < (limits[plan] || 3);
    });

    const loadProfiles = async () => {
      try {
        loading.value = true;
        const response = await api.get('/profiles');
        profiles.value = response.data.data || [];
      } catch (error) {
        console.error('Error loading profiles:', error);
        profiles.value = [];
      } finally {
        loading.value = false;
      }
    };

    const selectProfile = (profile) => {
      authStore.setCurrentProfile(profile);
      router.push({ name: 'Browse' });
    };

    const handleAddProfile = async () => {
      try {
        const response = await api.post('/profiles', {
          name: newProfileName.value,
        });
        profiles.value.push(response.data.data.profile);
        showAddProfile.value = false;
        newProfileName.value = '';
      } catch (error) {
        console.error('Error creating profile:', error);
        alert(error.response?.data?.error?.message || 'Error al crear perfil');
      }
    };

    const handleManageProfiles = () => {
      router.push({ name: 'Account' });
    };

    onMounted(() => {
      loadProfiles();
    });

    return {
      profiles,
      loading,
      showAddProfile,
      newProfileName,
      canAddProfile,
      selectProfile,
      handleAddProfile,
      handleManageProfiles,
    };
  },
};
</script>
