<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark via-dark-light to-dark">
    <div class="w-full max-w-md p-8 bg-dark-lighter rounded-lg shadow-2xl">
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-primary mb-2">QbitStream</h1>
        <p class="text-gray-400">Inicia sesión para continuar</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-300 mb-2">
            Email
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="w-full px-4 py-3 bg-dark border border-gray-600 rounded-lg focus:outline-none focus:border-primary text-white"
            placeholder="tu@email.com"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-300 mb-2">
            Contraseña
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="w-full px-4 py-3 bg-dark border border-gray-600 rounded-lg focus:outline-none focus:border-primary text-white"
            placeholder="••••••••"
          />
        </div>

        <div v-if="errorMessage" class="p-3 bg-red-900/50 border border-red-500 rounded-lg">
          <p class="text-sm text-red-200">{{ errorMessage }}</p>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <p class="text-sm text-gray-400">
          ¿Problemas para iniciar sesión?
          <a href="#" class="text-primary hover:underline">Contacta soporte</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';

export default {
  name: 'Login',
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();

    const email = ref('');
    const password = ref('');
    const loading = ref(false);
    const errorMessage = ref('');

    const handleLogin = async () => {
      loading.value = true;
      errorMessage.value = '';

      try {
        await authStore.login(email.value, password.value);
        router.push({ name: 'Profiles' });
      } catch (error) {
        errorMessage.value = error.response?.data?.error?.message || 'Error al iniciar sesión';
      } finally {
        loading.value = false;
      }
    };

    return {
      email,
      password,
      loading,
      errorMessage,
      handleLogin,
    };
  },
};
</script>
