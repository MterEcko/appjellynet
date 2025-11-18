<template>
  <div class="admin-plans">
    <div class="header">
      <h2>Gestión de Planes</h2>
      <div class="header-actions">
        <button @click="initializeDefaults" class="btn-secondary">
          Inicializar Planes por Defecto
        </button>
        <button @click="showCreateModal = true" class="btn-primary">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Plan
        </button>
      </div>
    </div>

    <!-- Plans Grid -->
    <div class="plans-grid">
      <div v-for="plan in activePlans" :key="plan.id" class="plan-card" :class="`plan-${plan.planType.toLowerCase()}`">
        <div class="plan-header">
          <div>
            <h3>{{ plan.name }}</h3>
            <p class="plan-type">{{ plan.planType }}</p>
          </div>
          <div class="plan-status">
            <span v-if="plan.isActive" class="status-active">Activo</span>
            <span v-else class="status-inactive">Inactivo</span>
          </div>
        </div>

        <div class="plan-price">
          <div v-if="plan.monthlyPrice">
            <span class="price">${{ plan.monthlyPrice }}</span>
            <span class="period">/ mes</span>
          </div>
          <div v-if="plan.weeklyPrice" class="price-alt">
            <span class="price-small">${{ plan.weeklyPrice }}</span>
            <span class="period">/ semana</span>
          </div>
        </div>

        <div class="plan-description">
          {{ plan.description || 'Sin descripción' }}
        </div>

        <div class="plan-features">
          <div class="feature">
            <svg class="feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {{ plan.maxProfiles }} {{ plan.maxProfiles === 1 ? 'Perfil' : 'Perfiles' }}
          </div>
          <div class="feature">
            <svg class="feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {{ plan.maxDevices }} {{ plan.maxDevices === 1 ? 'Dispositivo' : 'Dispositivos' }}
          </div>
          <div class="feature">
            <svg class="feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ plan.maxConcurrentStreams }} {{ plan.maxConcurrentStreams === 1 ? 'Stream' : 'Streams' }} simultáneos
          </div>
          <div class="feature">
            <svg class="feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            Calidad {{ plan.maxVideoQuality }}
          </div>
          <div class="feature">
            <svg v-if="plan.allowDownload" class="feature-icon text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else class="feature-icon text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Descargas {{ plan.allowDownload ? 'permitidas' : 'no permitidas' }}
          </div>
          <div class="feature">
            <svg v-if="!plan.allowAds" class="feature-icon text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else class="feature-icon text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {{ plan.allowAds ? 'Con anuncios' : 'Sin anuncios' }}
          </div>
        </div>

        <div class="plan-actions">
          <button @click="editPlan(plan)" class="btn-edit">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar
          </button>
          <button @click="togglePlan(plan)" :class="plan.isActive ? 'btn-deactivate' : 'btn-activate'">
            {{ plan.isActive ? 'Desactivar' : 'Activar' }}
          </button>
        </div>
      </div>

      <div v-if="inactivePlans.length > 0" class="inactive-section">
        <h3>Planes Inactivos</h3>
        <div class="inactive-plans">
          <div v-for="plan in inactivePlans" :key="plan.id" class="inactive-plan">
            <div>
              <strong>{{ plan.name }}</strong>
              <span class="plan-type-small">{{ plan.planType }}</span>
            </div>
            <div class="inline-actions">
              <button @click="editPlan(plan)" class="btn-icon">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button @click="togglePlan(plan)" class="btn-icon">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button @click="deletePlan(plan)" class="btn-icon text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal || editingPlan" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editingPlan ? 'Editar Plan' : 'Nuevo Plan' }}</h3>
          <button @click="closeModal" class="btn-close">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="savePlan">
            <div class="form-row">
              <div class="form-group">
                <label>Nombre *</label>
                <input v-model="form.name" type="text" required class="form-input" placeholder="Plan Premium">
              </div>
              <div class="form-group">
                <label>Tipo de Plan *</label>
                <select v-model="form.planType" required class="form-input">
                  <option value="BASIC">BASIC</option>
                  <option value="PREMIUM">PREMIUM</option>
                  <option value="FAMILY">FAMILY</option>
                  <option value="DEMO">DEMO</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Descripción</label>
              <textarea v-model="form.description" class="form-input" rows="3" placeholder="Descripción del plan..."></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Precio Mensual (USD)</label>
                <input v-model.number="form.monthlyPrice" type="number" step="0.01" class="form-input" placeholder="9.99">
              </div>
              <div class="form-group">
                <label>Precio Semanal (USD)</label>
                <input v-model.number="form.weeklyPrice" type="number" step="0.01" class="form-input" placeholder="2.99">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Máx. Perfiles *</label>
                <input v-model.number="form.maxProfiles" type="number" required min="1" class="form-input" placeholder="1">
              </div>
              <div class="form-group">
                <label>Máx. Dispositivos *</label>
                <input v-model.number="form.maxDevices" type="number" required min="1" class="form-input" placeholder="1">
              </div>
              <div class="form-group">
                <label>Máx. Streams Simultáneos *</label>
                <input v-model.number="form.maxConcurrentStreams" type="number" required min="1" class="form-input" placeholder="1">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Calidad Máxima de Video *</label>
                <select v-model="form.maxVideoQuality" required class="form-input">
                  <option value="480p">480p (SD)</option>
                  <option value="720p">720p (HD)</option>
                  <option value="1080p">1080p (Full HD)</option>
                  <option value="4K">4K (Ultra HD)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Moneda</label>
                <input v-model="form.currency" type="text" class="form-input" placeholder="USD">
              </div>
            </div>

            <div class="form-checkboxes">
              <label class="checkbox-label">
                <input v-model="form.allowDownload" type="checkbox">
                <span>Permitir descargas</span>
              </label>
              <label class="checkbox-label">
                <input v-model="form.allowAds" type="checkbox">
                <span>Mostrar anuncios</span>
              </label>
              <label class="checkbox-label">
                <input v-model="form.skipAdsEnabled" type="checkbox" :disabled="!form.allowAds">
                <span>Permitir saltar anuncios</span>
              </label>
            </div>

            <div class="modal-actions">
              <button type="button" @click="closeModal" class="btn-secondary">Cancelar</button>
              <button type="submit" class="btn-primary">
                {{ editingPlan ? 'Actualizar' : 'Crear' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '@/services/api';

const plans = ref([]);
const showCreateModal = ref(false);
const editingPlan = ref(null);

const form = ref({
  planType: 'BASIC',
  name: '',
  description: '',
  monthlyPrice: null,
  weeklyPrice: null,
  currency: 'USD',
  maxProfiles: 1,
  maxDevices: 1,
  maxConcurrentStreams: 1,
  allowDownload: false,
  maxVideoQuality: '720p',
  allowAds: true,
  skipAdsEnabled: false,
});

const activePlans = computed(() => plans.value.filter(p => p.isActive));
const inactivePlans = computed(() => plans.value.filter(p => !p.isActive));

const loadPlans = async () => {
  try {
    const response = await api.get('/plans?includeInactive=true');
    plans.value = response.data.data;
  } catch (error) {
    console.error('Error loading plans:', error);
  }
};

const savePlan = async () => {
  try {
    const data = {
      ...form.value,
      monthlyPrice: form.value.monthlyPrice ? parseFloat(form.value.monthlyPrice) : null,
      weeklyPrice: form.value.weeklyPrice ? parseFloat(form.value.weeklyPrice) : null,
    };

    if (editingPlan.value) {
      await api.put(`/plans/${editingPlan.value.id}`, data);
    } else {
      await api.post('/plans', data);
    }

    await loadPlans();
    closeModal();
  } catch (error) {
    console.error('Error saving plan:', error);
    alert('Error al guardar el plan');
  }
};

const editPlan = (plan) => {
  editingPlan.value = plan;
  form.value = {
    planType: plan.planType,
    name: plan.name,
    description: plan.description || '',
    monthlyPrice: plan.monthlyPrice ? parseFloat(plan.monthlyPrice) : null,
    weeklyPrice: plan.weeklyPrice ? parseFloat(plan.weeklyPrice) : null,
    currency: plan.currency,
    maxProfiles: plan.maxProfiles,
    maxDevices: plan.maxDevices,
    maxConcurrentStreams: plan.maxConcurrentStreams,
    allowDownload: plan.allowDownload,
    maxVideoQuality: plan.maxVideoQuality,
    allowAds: plan.allowAds,
    skipAdsEnabled: plan.skipAdsEnabled,
  };
};

const togglePlan = async (plan) => {
  try {
    await api.post(`/plans/${plan.id}/toggle-status`);
    await loadPlans();
  } catch (error) {
    console.error('Error toggling plan:', error);
  }
};

const deletePlan = async (plan) => {
  if (!confirm(`¿Estás seguro de eliminar el plan "${plan.name}"?`)) return;

  try {
    await api.delete(`/plans/${plan.id}`);
    await loadPlans();
  } catch (error) {
    console.error('Error deleting plan:', error);
  }
};

const initializeDefaults = async () => {
  if (!confirm('¿Inicializar los planes por defecto? Esto creará los planes BASIC, PREMIUM, FAMILY y DEMO si no existen.')) return;

  try {
    await api.post('/plans/initialize');
    await loadPlans();
    alert('Planes por defecto inicializados correctamente');
  } catch (error) {
    console.error('Error initializing plans:', error);
    alert('Error al inicializar planes');
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  editingPlan.value = null;
  form.value = {
    planType: 'BASIC',
    name: '',
    description: '',
    monthlyPrice: null,
    weeklyPrice: null,
    currency: 'USD',
    maxProfiles: 1,
    maxDevices: 1,
    maxConcurrentStreams: 1,
    allowDownload: false,
    maxVideoQuality: '720p',
    allowAds: true,
    skipAdsEnabled: false,
  };
};

onMounted(() => {
  loadPlans();
});
</script>

<style scoped>
.admin-plans {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header h2 {
  margin: 0;
  color: #fff;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.plan-card {
  background: #1a1a1a;
  border-radius: 12px;
  padding: 24px;
  border: 2px solid #333;
  transition: all 0.3s;
}

.plan-card:hover {
  border-color: #666;
  transform: translateY(-4px);
}

.plan-basic { border-color: #3b82f6; }
.plan-premium { border-color: #8b5cf6; }
.plan-family { border-color: #10b981; }
.plan-demo { border-color: #6b7280; }

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 16px;
}

.plan-header h3 {
  margin: 0 0 4px 0;
  color: #fff;
  font-size: 20px;
}

.plan-type {
  color: #999;
  font-size: 12px;
  text-transform: uppercase;
  font-weight: 600;
}

.plan-status {
  display: flex;
  gap: 8px;
}

.status-active {
  padding: 4px 8px;
  background: #10b981;
  color: #fff;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.status-inactive {
  padding: 4px 8px;
  background: #6b7280;
  color: #fff;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.plan-price {
  margin-bottom: 16px;
}

.price {
  color: #fff;
  font-size: 32px;
  font-weight: bold;
}

.period {
  color: #999;
  font-size: 14px;
  margin-left: 4px;
}

.price-alt {
  margin-top: 8px;
  opacity: 0.7;
}

.price-small {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.plan-description {
  color: #ccc;
  font-size: 14px;
  margin-bottom: 20px;
  min-height: 40px;
}

.plan-features {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: #0a0a0a;
  border-radius: 8px;
}

.feature {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  font-size: 14px;
}

.feature-icon {
  width: 20px;
  height: 20px;
  color: #8b5cf6;
}

.plan-actions {
  display: flex;
  gap: 8px;
}

.btn-edit {
  flex: 1;
  background: #333;
  color: #fff;
  border: 1px solid #555;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-edit:hover {
  background: #444;
}

.btn-activate {
  flex: 1;
  background: #10b981;
  color: #fff;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-activate:hover {
  background: #059669;
}

.btn-deactivate {
  flex: 1;
  background: #6b7280;
  color: #fff;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-deactivate:hover {
  background: #4b5563;
}

.inactive-section {
  grid-column: 1 / -1;
  margin-top: 20px;
}

.inactive-section h3 {
  color: #999;
  margin-bottom: 16px;
}

.inactive-plans {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.inactive-plan {
  background: #1a1a1a;
  padding: 12px 16px;
  border-radius: 6px;
  border: 1px solid #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.inactive-plan strong {
  color: #fff;
  margin-right: 8px;
}

.plan-type-small {
  color: #666;
  font-size: 12px;
  text-transform: uppercase;
}

.inline-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: transparent;
  border: 1px solid #444;
  color: #fff;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #333;
}

.icon {
  width: 18px;
  height: 18px;
}

.btn-primary {
  background: #e50914;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #b20710;
}

.btn-secondary {
  background: #333;
  color: #fff;
  border: 1px solid #555;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: #444;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: #1a1a1a;
  border-radius: 8px;
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid #333;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #333;
}

.modal-header h3 {
  margin: 0;
  color: #fff;
}

.btn-close {
  background: transparent;
  border: none;
  color: #999;
  font-size: 32px;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
}

.btn-close:hover {
  color: #fff;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  background: #0a0a0a;
  border: 1px solid #333;
  color: #fff;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #e50914;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.form-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #333;
}

textarea.form-input {
  resize: vertical;
  min-height: 80px;
}
</style>
