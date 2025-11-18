<template>
  <div class="min-h-screen bg-dark">
    <!-- Navigation Bar -->
    <nav class="fixed top-0 w-full z-50 bg-dark border-b border-gray-800">
      <div class="flex items-center justify-between px-8 py-4">
        <h1 class="text-2xl font-bold text-primary">Configuración de Cuenta</h1>
        <router-link to="/" class="hover:text-gray-300 transition-colors">
          Volver al Sitio
        </router-link>
      </div>
    </nav>

    <div class="pt-20 p-8 max-w-4xl mx-auto">
      <!-- Account Info Card -->
      <div class="bg-dark-lighter rounded-lg border border-gray-800 p-6 mb-6">
        <h2 class="text-xl font-bold mb-4">Información de la Cuenta</h2>
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label class="text-sm text-gray-400">Email</label>
            <p class="text-white">{{ user?.email }}</p>
          </div>
          <div>
            <label class="text-sm text-gray-400">Plan</label>
            <p class="text-white">{{ user?.plan }}</p>
          </div>
          <div>
            <label class="text-sm text-gray-400">Estado</label>
            <p class="text-white">{{ user?.status }}</p>
          </div>
          <div>
            <label class="text-sm text-gray-400">Creada</label>
            <p class="text-white">{{ formatDate(user?.createdAt) }}</p>
          </div>
        </div>
      </div>

      <!-- Change Email -->
      <div class="bg-dark-lighter rounded-lg border border-gray-800 p-6 mb-6">
        <h2 class="text-xl font-bold mb-4">Cambiar Email</h2>
        <form @submit.prevent="changeEmail" class="space-y-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">Nuevo Email</label>
            <input
              v-model="emailForm.newEmail"
              type="email"
              required
              class="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg focus:outline-none focus:border-primary text-white"
              placeholder="nuevo@email.com"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Contraseña Actual</label>
            <input
              v-model="emailForm.currentPassword"
              type="password"
              required
              class="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg focus:outline-none focus:border-primary text-white"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            :disabled="emailLoading"
            class="px-6 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {{ emailLoading ? 'Actualizando...' : 'Actualizar Email' }}
          </button>
        </form>
      </div>

      <!-- Change Password -->
      <div class="bg-dark-lighter rounded-lg border border-gray-800 p-6 mb-6">
        <h2 class="text-xl font-bold mb-4">Cambiar Contraseña</h2>
        <form @submit.prevent="changePassword" class="space-y-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">Contraseña Actual</label>
            <input
              v-model="passwordForm.currentPassword"
              type="password"
              required
              class="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg focus:outline-none focus:border-primary text-white"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Nueva Contraseña</label>
            <input
              v-model="passwordForm.newPassword"
              type="password"
              required
              minlength="6"
              class="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg focus:outline-none focus:border-primary text-white"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-1">Confirmar Nueva Contraseña</label>
            <input
              v-model="passwordForm.confirmPassword"
              type="password"
              required
              minlength="6"
              class="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg focus:outline-none focus:border-primary text-white"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            :disabled="passwordLoading"
            class="px-6 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {{ passwordLoading ? 'Actualizando...' : 'Actualizar Contraseña' }}
          </button>
        </form>
      </div>

      <!-- Email Notifications -->
      <div class="bg-dark-lighter rounded-lg border border-gray-800 p-6 mb-6">
        <h2 class="text-xl font-bold mb-4">Notificaciones por Email</h2>
        <div class="space-y-3">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="notifications.newContent"
              type="checkbox"
              @change="saveNotificationPreferences"
              class="w-5 h-5 cursor-pointer"
            />
            <div>
              <div class="text-white font-medium">Nuevo Contenido</div>
              <div class="text-sm text-gray-400">Recibir notificaciones cuando se agregue nuevo contenido</div>
            </div>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="notifications.accountUpdates"
              type="checkbox"
              @change="saveNotificationPreferences"
              class="w-5 h-5 cursor-pointer"
            />
            <div>
              <div class="text-white font-medium">Actualizaciones de Cuenta</div>
              <div class="text-sm text-gray-400">Cambios en el plan, suspensión, etc.</div>
            </div>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="notifications.marketing"
              type="checkbox"
              @change="saveNotificationPreferences"
              class="w-5 h-5 cursor-pointer"
            />
            <div>
              <div class="text-white font-medium">Marketing y Promociones</div>
              <div class="text-sm text-gray-400">Ofertas especiales y novedades del servicio</div>
            </div>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/store/auth';
import api from '@/services/api';

const authStore = useAuthStore();
const user = computed(() => authStore.user);

const emailForm = ref({
  newEmail: '',
  currentPassword: '',
});

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const notifications = ref({
  newContent: true,
  accountUpdates: true,
  marketing: false,
});

const emailLoading = ref(false);
const passwordLoading = ref(false);

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES');
};

const changeEmail = async () => {
  try {
    emailLoading.value = true;

    await api.post('/account/change-email', {
      newEmail: emailForm.value.newEmail,
      currentPassword: emailForm.value.currentPassword,
    });

    alert('Email actualizado correctamente. Por favor, inicia sesión nuevamente.');
    authStore.logout();
  } catch (error) {
    console.error('Error changing email:', error);
    alert(error.response?.data?.message || 'Error al cambiar el email');
  } finally {
    emailLoading.value = false;
  }
};

const changePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    alert('Las contraseñas no coinciden');
    return;
  }

  try {
    passwordLoading.value = true;

    await api.post('/account/change-password', {
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword,
    });

    alert('Contraseña actualizada correctamente');
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
  } catch (error) {
    console.error('Error changing password:', error);
    alert(error.response?.data?.message || 'Error al cambiar la contraseña');
  } finally {
    passwordLoading.value = false;
  }
};

const saveNotificationPreferences = async () => {
  try {
    await api.post('/account/notification-preferences', notifications.value);
  } catch (error) {
    console.error('Error saving notification preferences:', error);
  }
};

const loadNotificationPreferences = async () => {
  try {
    const response = await api.get('/account/notification-preferences');
    if (response.data.data) {
      notifications.value = response.data.data;
    }
  } catch (error) {
    console.error('Error loading notification preferences:', error);
  }
};

onMounted(() => {
  loadNotificationPreferences();
});
</script>
