<template>
  <div class="min-h-screen bg-dark">
    <nav class="fixed top-0 w-full bg-gradient-to-b from-dark to-transparent z-50 p-6">
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold text-primary">QbitStream</h1>
        <div class="flex items-center gap-6">
          <router-link to="/search" class="text-white hover:text-gray-300">Buscar</router-link>
          <router-link to="/account" class="text-white hover:text-gray-300">Mi Cuenta</router-link>
          <button @click="logout" class="text-white hover:text-gray-300">Salir</button>
        </div>
      </div>
    </nav>

    <div class="pt-24 px-8">
      <h2 class="text-4xl font-bold mb-8">Explorar Contenido</h2>
      <p class="text-gray-400">Esta vista mostrará el contenido de Jellyfin con estilo Netflix</p>
      <p class="text-gray-400 mt-2">Categorías, carruseles, hero banner, etc.</p>
    </div>
  </div>
</template>

<script>
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';

export default {
  name: 'Browse',
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();

    const logout = () => {
      authStore.logout();
      router.push({ name: 'Login' });
    };

    return { logout };
  },
};
</script>
