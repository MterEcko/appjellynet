<template>
  <div class="min-h-screen bg-dark">
    <!-- Navigation Bar -->
    <nav class="fixed top-0 w-full z-50 bg-dark border-b border-gray-800">
      <div class="flex items-center justify-between px-8 py-4">
        <h1 class="text-2xl font-bold text-primary">Panel de Administración</h1>
        <div class="flex items-center gap-4">
          <router-link to="/" class="hover:text-gray-300 transition-colors">
            Volver al Sitio
          </router-link>
          <div class="w-8 h-8 bg-primary rounded overflow-hidden">
            <span class="flex items-center justify-center h-full text-sm">{{ currentProfile?.name?.[0] || 'A' }}</span>
          </div>
        </div>
      </div>
    </nav>

    <div class="pt-20 p-8">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-dark-lighter p-6 rounded-lg border border-gray-800">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-medium text-gray-400">Total Cuentas</h3>
            <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p class="text-3xl font-bold">{{ stats.totalAccounts || 0 }}</p>
          <p class="text-xs text-gray-500 mt-1">{{ stats.activeAccounts || 0 }} activas</p>
        </div>

        <div class="bg-dark-lighter p-6 rounded-lg border border-gray-800">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-medium text-gray-400">Perfiles</h3>
            <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p class="text-3xl font-bold">{{ stats.totalProfiles || 0 }}</p>
          <p class="text-xs text-gray-500 mt-1">Perfiles creados</p>
        </div>

        <div class="bg-dark-lighter p-6 rounded-lg border border-gray-800">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-medium text-gray-400">Suspendidas</h3>
            <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <p class="text-3xl font-bold">{{ stats.suspendedAccounts || 0 }}</p>
          <p class="text-xs text-gray-500 mt-1">Cuentas suspendidas</p>
        </div>

        <div class="bg-dark-lighter p-6 rounded-lg border border-gray-800">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-medium text-gray-400">Nuevas (30d)</h3>
            <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p class="text-3xl font-bold">{{ stats.newAccountsThisMonth || 0 }}</p>
          <p class="text-xs text-gray-500 mt-1">Este mes</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="mb-6">
        <div class="border-b border-gray-800">
          <nav class="-mb-px flex space-x-8">
            <button
              @click="activeTab = 'accounts'"
              :class="{
                'border-primary text-primary': activeTab === 'accounts',
                'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300': activeTab !== 'accounts',
              }"
              class="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
            >
              Cuentas
            </button>
            <button
              @click="activeTab = 'plans'"
              :class="{
                'border-primary text-primary': activeTab === 'plans',
                'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300': activeTab !== 'plans',
              }"
              class="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
            >
              Planes
            </button>
            <button
              @click="activeTab = 'ads'"
              :class="{
                'border-primary text-primary': activeTab === 'ads',
                'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300': activeTab !== 'ads',
              }"
              class="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
            >
              Anuncios
            </button>
            <button
              @click="activeTab = 'logs'"
              :class="{
                'border-primary text-primary': activeTab === 'logs',
                'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300': activeTab !== 'logs',
              }"
              class="py-4 px-1 border-b-2 font-medium text-sm transition-colors"
            >
              Logs de Auditoría
            </button>
          </nav>
        </div>
      </div>

      <!-- Plans Tab -->
      <div v-if="activeTab === 'plans'">
        <AdminPlans />
      </div>

      <!-- Ads Tab -->
      <div v-if="activeTab === 'ads'">
        <AdminAds />
      </div>

      <!-- Accounts Tab -->
      <div v-if="activeTab === 'accounts'" class="bg-dark-lighter rounded-lg border border-gray-800">
        <!-- Toolbar -->
        <div class="p-6 border-b border-gray-800 flex items-center justify-between">
          <div class="flex-1 max-w-md">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar por email..."
              class="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg focus:outline-none focus:border-primary text-white"
            />
          </div>
          <button
            @click="showCreateModal = true"
            class="ml-4 px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            + Nueva Cuenta
          </button>
        </div>

        <!-- Accounts Table -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-dark border-b border-gray-800">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plan</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Estado</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Perfiles</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Creada</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-800">
              <tr v-for="account in filteredAccounts" :key="account.id" class="hover:bg-dark transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium">{{ account.email }}</div>
                  <div v-if="account.isAdmin" class="text-xs text-primary">Admin</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="{
                    'bg-purple-500/20 text-purple-400': account.plan === 'PREMIUM',
                    'bg-blue-500/20 text-blue-400': account.plan === 'BASIC',
                    'bg-green-500/20 text-green-400': account.plan === 'FAMILY',
                    'bg-gray-500/20 text-gray-400': account.plan === 'DEMO',
                  }" class="px-2 py-1 text-xs font-semibold rounded">
                    {{ account.plan }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="{
                    'bg-green-500/20 text-green-400': account.status === 'ACTIVE',
                    'bg-red-500/20 text-red-400': account.status === 'SUSPENDED',
                    'bg-yellow-500/20 text-yellow-400': account.status === 'GRACE_PERIOD',
                    'bg-gray-500/20 text-gray-400': account.status === 'CANCELLED',
                  }" class="px-2 py-1 text-xs font-semibold rounded">
                    {{ account.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {{ account.profiles?.length || 0 }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {{ formatDate(account.createdAt) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <div class="flex items-center gap-2">
                    <button
                      @click="viewAccount(account)"
                      class="text-blue-400 hover:text-blue-300"
                      title="Ver detalles"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      v-if="account.status === 'ACTIVE'"
                      @click="suspendAccount(account)"
                      class="text-red-400 hover:text-red-300"
                      title="Suspender"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    </button>
                    <button
                      v-if="account.status === 'SUSPENDED'"
                      @click="reactivateAccount(account)"
                      class="text-green-400 hover:text-green-300"
                      title="Reactivar"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="pagination.totalPages > 1" class="p-6 border-t border-gray-800 flex items-center justify-between">
          <div class="text-sm text-gray-400">
            Mostrando {{ ((pagination.currentPage - 1) * pagination.limit) + 1 }} a {{ Math.min(pagination.currentPage * pagination.limit, pagination.total) }} de {{ pagination.total }} cuentas
          </div>
          <div class="flex gap-2">
            <button
              @click="loadAccounts(pagination.currentPage - 1)"
              :disabled="pagination.currentPage === 1"
              :class="{ 'opacity-50 cursor-not-allowed': pagination.currentPage === 1 }"
              class="px-4 py-2 bg-dark border border-gray-700 rounded hover:bg-gray-800 transition-colors disabled:hover:bg-dark"
            >
              Anterior
            </button>
            <button
              @click="loadAccounts(pagination.currentPage + 1)"
              :disabled="pagination.currentPage === pagination.totalPages"
              :class="{ 'opacity-50 cursor-not-allowed': pagination.currentPage === pagination.totalPages }"
              class="px-4 py-2 bg-dark border border-gray-700 rounded hover:bg-gray-800 transition-colors disabled:hover:bg-dark"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      <!-- Audit Logs Tab -->
      <div v-if="activeTab === 'logs'" class="bg-dark-lighter rounded-lg border border-gray-800">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-dark border-b border-gray-800">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fecha</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Acción</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Entidad</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Usuario</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">IP</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-800">
              <tr v-for="log in auditLogs" :key="log.id" class="hover:bg-dark transition-colors">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {{ formatDateTime(log.createdAt) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 py-1 text-xs font-semibold rounded bg-blue-500/20 text-blue-400">
                    {{ log.action }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {{ log.entity }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {{ log.userId || 'Sistema' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                  {{ log.ipAddress || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="logsPagination.totalPages > 1" class="p-6 border-t border-gray-800 flex items-center justify-between">
          <div class="text-sm text-gray-400">
            Mostrando {{ ((logsPagination.currentPage - 1) * logsPagination.limit) + 1 }} a {{ Math.min(logsPagination.currentPage * logsPagination.limit, logsPagination.total) }} de {{ logsPagination.total }} logs
          </div>
          <div class="flex gap-2">
            <button
              @click="loadAuditLogs(logsPagination.currentPage - 1)"
              :disabled="logsPagination.currentPage === 1"
              :class="{ 'opacity-50 cursor-not-allowed': logsPagination.currentPage === 1 }"
              class="px-4 py-2 bg-dark border border-gray-700 rounded hover:bg-gray-800 transition-colors disabled:hover:bg-dark"
            >
              Anterior
            </button>
            <button
              @click="loadAuditLogs(logsPagination.currentPage + 1)"
              :disabled="logsPagination.currentPage === logsPagination.totalPages"
              :class="{ 'opacity-50 cursor-not-allowed': logsPagination.currentPage === logsPagination.totalPages }"
              class="px-4 py-2 bg-dark border border-gray-700 rounded hover:bg-gray-800 transition-colors disabled:hover:bg-dark"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Account Details Modal -->
    <div v-if="selectedAccount" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="selectedAccount = null">
      <div class="absolute inset-0 bg-black/80" @click="selectedAccount = null"></div>
      <div class="relative bg-dark-lighter rounded-lg max-w-2xl w-full p-6 border border-gray-800">
        <button
          @click="selectedAccount = null"
          class="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 class="text-2xl font-bold mb-6">Detalles de Cuenta</h2>

        <div class="space-y-4">
          <div>
            <label class="text-sm text-gray-400">Email</label>
            <p class="text-white">{{ selectedAccount.email }}</p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm text-gray-400">Plan</label>
              <p class="text-white">{{ selectedAccount.plan }}</p>
            </div>
            <div>
              <label class="text-sm text-gray-400">Estado</label>
              <p class="text-white">{{ selectedAccount.status }}</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm text-gray-400">Tipo de Cuenta</label>
              <p class="text-white">{{ selectedAccount.accountType }}</p>
            </div>
            <div>
              <label class="text-sm text-gray-400">Perfiles</label>
              <p class="text-white">{{ selectedAccount.profiles?.length || 0 }}</p>
            </div>
          </div>
          <div>
            <label class="text-sm text-gray-400">Creada</label>
            <p class="text-white">{{ formatDateTime(selectedAccount.createdAt) }}</p>
          </div>
          <div v-if="selectedAccount.lastLogin">
            <label class="text-sm text-gray-400">Último acceso</label>
            <p class="text-white">{{ formatDateTime(selectedAccount.lastLogin) }}</p>
          </div>
          <div v-if="selectedAccount.suspendedAt">
            <label class="text-sm text-gray-400">Suspendida el</label>
            <p class="text-white">{{ formatDateTime(selectedAccount.suspendedAt) }}</p>
          </div>
          <div v-if="selectedAccount.suspensionReason">
            <label class="text-sm text-gray-400">Razón de suspensión</label>
            <p class="text-white">{{ selectedAccount.suspensionReason }}</p>
          </div>

          <div v-if="selectedAccount.profiles && selectedAccount.profiles.length > 0" class="pt-4 border-t border-gray-800">
            <label class="text-sm text-gray-400 mb-2 block">Perfiles</label>
            <div class="space-y-2">
              <div v-for="profile in selectedAccount.profiles" :key="profile.id" class="flex items-center gap-2">
                <div class="w-8 h-8 bg-primary rounded flex items-center justify-center text-sm font-semibold">
                  {{ profile.name[0] }}
                </div>
                <span>{{ profile.name }}</span>
                <span v-if="profile.isPrimary" class="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Principal</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Account Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="showCreateModal = false">
      <div class="absolute inset-0 bg-black/80" @click="showCreateModal = false"></div>
      <div class="relative bg-dark-lighter rounded-lg max-w-md w-full p-6 border border-gray-800">
        <h2 class="text-2xl font-bold mb-6">Nueva Cuenta</h2>

        <form @submit.prevent="createAccount" class="space-y-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1">Email</label>
            <input
              v-model="newAccount.email"
              type="email"
              required
              class="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg focus:outline-none focus:border-primary text-white"
            />
          </div>

          <div>
            <label class="block text-sm text-gray-400 mb-1">Contraseña</label>
            <input
              v-model="newAccount.password"
              type="password"
              required
              class="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg focus:outline-none focus:border-primary text-white"
            />
          </div>

          <div>
            <label class="block text-sm text-gray-400 mb-1">Plan</label>
            <select
              v-model="newAccount.plan"
              class="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg focus:outline-none focus:border-primary text-white"
            >
              <option value="DEMO">Demo</option>
              <option value="BASIC">Basic</option>
              <option value="PREMIUM">Premium</option>
              <option value="FAMILY">Family</option>
            </select>
          </div>

          <div>
            <label class="block text-sm text-gray-400 mb-1">Tipo de Cuenta</label>
            <select
              v-model="newAccount.accountType"
              class="w-full px-4 py-2 bg-dark border border-gray-700 rounded-lg focus:outline-none focus:border-primary text-white"
            >
              <option value="MONTHLY">Mensual</option>
              <option value="WEEKLY">Semanal</option>
              <option value="DEMO">Demo</option>
              <option value="WISP">WISP</option>
            </select>
          </div>

          <div class="flex gap-2 pt-4">
            <button
              type="button"
              @click="showCreateModal = false"
              class="flex-1 px-4 py-2 bg-dark border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Crear Cuenta
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/store/auth';
import api from '@/services/api';
import AdminAds from '@/components/AdminAds.vue';
import AdminPlans from '@/components/AdminPlans.vue';

export default {
  name: 'Admin',
  components: {
    AdminAds,
    AdminPlans,
  },
  setup() {
    const authStore = useAuthStore();
    const currentProfile = computed(() => authStore.currentProfile);

    const activeTab = ref('accounts');
    const accounts = ref([]);
    const auditLogs = ref([]);
    const stats = ref({});
    const searchQuery = ref('');
    const selectedAccount = ref(null);
    const showCreateModal = ref(false);

    const pagination = ref({
      currentPage: 1,
      totalPages: 1,
      total: 0,
      limit: 20,
    });

    const logsPagination = ref({
      currentPage: 1,
      totalPages: 1,
      total: 0,
      limit: 50,
    });

    const newAccount = ref({
      email: '',
      password: '',
      plan: 'BASIC',
      accountType: 'MONTHLY',
    });

    const filteredAccounts = computed(() => {
      if (!searchQuery.value) return accounts.value;
      const query = searchQuery.value.toLowerCase();
      return accounts.value.filter(account =>
        account.email.toLowerCase().includes(query)
      );
    });

    const loadStats = async () => {
      try {
        const response = await api.get('/admin/stats');
        stats.value = response.data.data;
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    };

    const loadAccounts = async (page = 1) => {
      try {
        const response = await api.get(`/admin/accounts?page=${page}&limit=20`);
        accounts.value = response.data.data;

        if (response.data.pagination) {
          pagination.value = response.data.pagination;
        }
      } catch (error) {
        console.error('Failed to load accounts:', error);
      }
    };

    const loadAuditLogs = async (page = 1) => {
      try {
        const response = await api.get(`/admin/audit-logs?page=${page}&limit=50`);
        auditLogs.value = response.data.data;

        if (response.data.pagination) {
          logsPagination.value = response.data.pagination;
        }
      } catch (error) {
        console.error('Failed to load audit logs:', error);
      }
    };

    const viewAccount = async (account) => {
      try {
        const response = await api.get(`/admin/accounts/${account.id}`);
        selectedAccount.value = response.data.data;
      } catch (error) {
        console.error('Failed to load account details:', error);
        selectedAccount.value = account;
      }
    };

    const suspendAccount = async (account) => {
      const reason = prompt('Razón de suspensión:');
      if (!reason) return;

      try {
        await api.post(`/admin/accounts/${account.id}/suspend`, { reason });
        await loadAccounts(pagination.value.currentPage);
        await loadStats();
        alert('Cuenta suspendida exitosamente');
      } catch (error) {
        console.error('Failed to suspend account:', error);
        alert('Error al suspender la cuenta');
      }
    };

    const reactivateAccount = async (account) => {
      if (!confirm('¿Reactivar esta cuenta?')) return;

      try {
        await api.post(`/admin/accounts/${account.id}/reactivate`);
        await loadAccounts(pagination.value.currentPage);
        await loadStats();
        alert('Cuenta reactivada exitosamente');
      } catch (error) {
        console.error('Failed to reactivate account:', error);
        alert('Error al reactivar la cuenta');
      }
    };

    const createAccount = async () => {
      try {
        await api.post('/admin/accounts', newAccount.value);
        showCreateModal.value = false;
        newAccount.value = {
          email: '',
          password: '',
          plan: 'BASIC',
          accountType: 'MONTHLY',
        };
        await loadAccounts(1);
        await loadStats();
        alert('Cuenta creada exitosamente');
      } catch (error) {
        console.error('Failed to create account:', error);
        alert('Error al crear la cuenta: ' + (error.response?.data?.message || error.message));
      }
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES');
    };

    const formatDateTime = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleString('es-ES');
    };

    onMounted(() => {
      loadStats();
      loadAccounts();
      loadAuditLogs();
    });

    return {
      activeTab,
      accounts,
      auditLogs,
      stats,
      searchQuery,
      selectedAccount,
      showCreateModal,
      newAccount,
      pagination,
      logsPagination,
      filteredAccounts,
      currentProfile,
      loadAccounts,
      loadAuditLogs,
      viewAccount,
      suspendAccount,
      reactivateAccount,
      createAccount,
      formatDate,
      formatDateTime,
    };
  },
};
</script>
