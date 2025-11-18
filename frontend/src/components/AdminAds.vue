<template>
  <div class="admin-ads">
    <div class="header">
      <h2>Gestión de Anuncios</h2>
      <button @click="showCreateModal = true" class="btn-primary">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Nuevo Anuncio
      </button>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Anuncios</div>
        <div class="stat-value">{{ ads.length }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Anuncios Activos</div>
        <div class="stat-value">{{ activeAds }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Impresiones</div>
        <div class="stat-value">{{ totalImpressions }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Tasa de Completado</div>
        <div class="stat-value">{{ completionRate }}%</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <select v-model="filterType" class="filter-select">
        <option value="">Todos los tipos</option>
        <option value="PREROLL">Pre-roll</option>
        <option value="MIDROLL">Mid-roll</option>
        <option value="PAUSEROLL">Pause-roll</option>
      </select>
      <select v-model="filterStatus" class="filter-select">
        <option value="">Todos los estados</option>
        <option value="active">Activos</option>
        <option value="inactive">Inactivos</option>
      </select>
    </div>

    <!-- Ads Table -->
    <div class="table-container">
      <table class="ads-table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Tipo</th>
            <th>Campaña</th>
            <th>Duración</th>
            <th>Peso</th>
            <th>Impresiones</th>
            <th>Completados</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ad in filteredAds" :key="ad.id">
            <td>
              <div class="ad-title">
                <img v-if="ad.thumbnailPath" :src="getThumbnailUrl(ad.thumbnailPath)" alt="" class="ad-thumbnail">
                {{ ad.title }}
              </div>
            </td>
            <td><span class="badge" :class="`badge-${ad.type.toLowerCase()}`">{{ ad.type }}</span></td>
            <td>{{ ad.campaignName || '-' }}</td>
            <td>{{ ad.duration }}s</td>
            <td>{{ ad.weight }}/10</td>
            <td>{{ ad.impressions }}</td>
            <td>{{ ad.completions }} ({{ getCompletionRate(ad) }}%)</td>
            <td>
              <span class="status-badge" :class="ad.isActive ? 'status-active' : 'status-inactive'">
                {{ ad.isActive ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td>
              <div class="actions">
                <button @click="toggleAdStatus(ad)" class="btn-icon" :title="ad.isActive ? 'Desactivar' : 'Activar'">
                  <svg v-if="ad.isActive" xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button @click="editAd(ad)" class="btn-icon" title="Editar">
                  <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button @click="viewAnalytics(ad)" class="btn-icon" title="Analytics">
                  <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </button>
                <button @click="deleteAd(ad)" class="btn-icon btn-danger" title="Eliminar">
                  <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="filteredAds.length === 0" class="empty-state">
        No hay anuncios que mostrar
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal || editingAd" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editingAd ? 'Editar Anuncio' : 'Nuevo Anuncio' }}</h3>
          <button @click="closeModal" class="btn-close">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="saveAd">
            <div class="form-group">
              <label>Título *</label>
              <input v-model="form.title" type="text" required class="form-input" placeholder="Nombre del anuncio">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Tipo de Anuncio *</label>
                <select v-model="form.type" required class="form-input">
                  <option value="PREROLL">Pre-roll (antes del contenido)</option>
                  <option value="MIDROLL">Mid-roll (durante el contenido)</option>
                  <option value="PAUSEROLL">Pause-roll (al pausar)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Campaña</label>
                <input v-model="form.campaignName" type="text" class="form-input" placeholder="Nombre de campaña">
              </div>
            </div>

            <div class="form-group">
              <label>Video del Anuncio *</label>
              <div class="file-upload">
                <input
                  ref="videoInput"
                  type="file"
                  accept="video/*"
                  @change="handleVideoUpload"
                  class="file-input"
                  :required="!editingAd"
                >
                <div class="file-upload-label">
                  <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span v-if="!uploadedVideo">Seleccionar video</span>
                  <span v-else>{{ uploadedVideo.name }}</span>
                </div>
              </div>
              <div v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
                </div>
                <span>{{ uploadProgress }}%</span>
              </div>
            </div>

            <div class="form-group">
              <label>Miniatura (opcional)</label>
              <div class="file-upload">
                <input
                  ref="thumbnailInput"
                  type="file"
                  accept="image/*"
                  @change="handleThumbnailUpload"
                  class="file-input"
                >
                <div class="file-upload-label">
                  <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span v-if="!form.thumbnailPath">Seleccionar miniatura</span>
                  <span v-else>Miniatura seleccionada</span>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Duración (segundos) *</label>
                <input v-model.number="form.duration" type="number" required min="1" class="form-input" placeholder="30">
              </div>
              <div class="form-group">
                <label>Permitir saltar después de (segundos)</label>
                <input v-model.number="form.skipAfter" type="number" min="0" class="form-input" placeholder="5">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Peso (1-10) *</label>
                <input v-model.number="form.weight" type="number" required min="1" max="10" class="form-input" value="5">
                <small>Mayor peso = mayor prioridad de reproducción</small>
              </div>
              <div class="form-group">
                <label>URL de clic (para pause-roll)</label>
                <input v-model="form.clickUrl" type="url" class="form-input" placeholder="https://example.com">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Fecha de inicio</label>
                <input v-model="form.startDate" type="date" class="form-input">
              </div>
              <div class="form-group">
                <label>Fecha de fin</label>
                <input v-model="form.endDate" type="date" class="form-input">
              </div>
            </div>

            <div class="modal-actions">
              <button type="button" @click="closeModal" class="btn-secondary">Cancelar</button>
              <button type="submit" class="btn-primary" :disabled="uploading">
                {{ uploading ? 'Subiendo...' : (editingAd ? 'Actualizar' : 'Crear') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Analytics Modal -->
    <div v-if="showAnalytics" class="modal-overlay" @click.self="showAnalytics = null">
      <div class="modal">
        <div class="modal-header">
          <h3>Analytics - {{ showAnalytics.title }}</h3>
          <button @click="showAnalytics = null" class="btn-close">×</button>
        </div>
        <div class="modal-body">
          <div v-if="analytics" class="analytics-grid">
            <div class="analytics-card">
              <div class="analytics-label">Impresiones</div>
              <div class="analytics-value">{{ analytics.impressions }}</div>
            </div>
            <div class="analytics-card">
              <div class="analytics-label">Completados</div>
              <div class="analytics-value">{{ analytics.completions }}</div>
            </div>
            <div class="analytics-card">
              <div class="analytics-label">Saltos</div>
              <div class="analytics-value">{{ analytics.skips }}</div>
            </div>
            <div class="analytics-card">
              <div class="analytics-label">Clics</div>
              <div class="analytics-value">{{ analytics.clicks }}</div>
            </div>
            <div class="analytics-card">
              <div class="analytics-label">Tasa de Completado</div>
              <div class="analytics-value">{{ analytics.completionRate }}%</div>
            </div>
            <div class="analytics-card">
              <div class="analytics-label">CTR</div>
              <div class="analytics-value">{{ analytics.clickThroughRate }}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api from '@/services/api';

const ads = ref([]);
const showCreateModal = ref(false);
const editingAd = ref(null);
const showAnalytics = ref(null);
const analytics = ref(null);
const filterType = ref('');
const filterStatus = ref('');
const uploading = ref(false);
const uploadProgress = ref(0);
const uploadedVideo = ref(null);
const videoInput = ref(null);
const thumbnailInput = ref(null);

const form = ref({
  title: '',
  type: 'PREROLL',
  campaignName: '',
  filePath: '',
  url: '',
  thumbnailPath: '',
  duration: 30,
  skipAfter: 5,
  weight: 5,
  clickUrl: '',
  startDate: '',
  endDate: '',
});

const activeAds = computed(() => ads.value.filter(ad => ad.isActive).length);
const totalImpressions = computed(() => ads.value.reduce((sum, ad) => sum + ad.impressions, 0));
const completionRate = computed(() => {
  const total = ads.value.reduce((sum, ad) => sum + ad.impressions, 0);
  const completed = ads.value.reduce((sum, ad) => sum + ad.completions, 0);
  return total > 0 ? Math.round((completed / total) * 100) : 0;
});

const filteredAds = computed(() => {
  return ads.value.filter(ad => {
    if (filterType.value && ad.type !== filterType.value) return false;
    if (filterStatus.value === 'active' && !ad.isActive) return false;
    if (filterStatus.value === 'inactive' && ad.isActive) return false;
    return true;
  });
});

const loadAds = async () => {
  try {
    const response = await api.get('/ads?includeInactive=true');
    ads.value = response.data.data;
  } catch (error) {
    console.error('Error loading ads:', error);
  }
};

const handleVideoUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  uploadedVideo.value = file;

  // Upload video
  const formData = new FormData();
  formData.append('video', file);

  try {
    uploading.value = true;
    uploadProgress.value = 0;

    const response = await api.post('/upload/ad-video', formData, {
      onUploadProgress: (progressEvent) => {
        uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
      },
    });

    form.value.filePath = response.data.data.filePath;
    form.value.url = response.data.data.url;
    console.log('Video uploaded successfully:', response.data.data);
  } catch (error) {
    console.error('Error uploading video:', error);
    const errorMsg = error.response?.data?.message || error.message || 'Error desconocido';
    alert(`Error al subir el video: ${errorMsg}`);
    uploadedVideo.value = null;
    uploadProgress.value = 0;
  } finally {
    uploading.value = false;
  }
};

const handleThumbnailUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('thumbnail', file);

  try {
    const response = await api.post('/upload/ad-thumbnail', formData);

    form.value.thumbnailPath = response.data.data.filePath;
    console.log('Thumbnail uploaded successfully:', response.data.data);
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    const errorMsg = error.response?.data?.message || error.message || 'Error desconocido';
    alert(`Error al subir la miniatura: ${errorMsg}`);
  }
};

const saveAd = async () => {
  try {
    const data = {
      ...form.value,
      startDate: form.value.startDate ? new Date(form.value.startDate).toISOString() : null,
      endDate: form.value.endDate ? new Date(form.value.endDate).toISOString() : null,
    };

    if (editingAd.value) {
      await api.put(`/ads/${editingAd.value.id}`, data);
    } else {
      await api.post('/ads', data);
    }

    await loadAds();
    closeModal();
  } catch (error) {
    console.error('Error saving ad:', error);
    alert('Error al guardar el anuncio');
  }
};

const editAd = (ad) => {
  editingAd.value = ad;
  form.value = {
    title: ad.title,
    type: ad.type,
    campaignName: ad.campaignName || '',
    filePath: ad.filePath || '',
    url: ad.url || '',
    thumbnailPath: ad.thumbnailPath || '',
    duration: ad.duration,
    skipAfter: ad.skipAfter || 0,
    weight: ad.weight,
    clickUrl: ad.clickUrl || '',
    startDate: ad.startDate ? new Date(ad.startDate).toISOString().split('T')[0] : '',
    endDate: ad.endDate ? new Date(ad.endDate).toISOString().split('T')[0] : '',
  };
};

const toggleAdStatus = async (ad) => {
  try {
    await api.post(`/ads/${ad.id}/toggle-status`);
    await loadAds();
  } catch (error) {
    console.error('Error toggling ad status:', error);
  }
};

const deleteAd = async (ad) => {
  if (!confirm(`¿Estás seguro de eliminar el anuncio "${ad.title}"?`)) return;

  try {
    await api.delete(`/ads/${ad.id}`);
    await loadAds();
  } catch (error) {
    console.error('Error deleting ad:', error);
  }
};

const viewAnalytics = async (ad) => {
  try {
    showAnalytics.value = ad;
    const response = await api.get(`/ads/${ad.id}/analytics`);
    analytics.value = response.data.data;
  } catch (error) {
    console.error('Error loading analytics:', error);
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  editingAd.value = null;
  uploadedVideo.value = null;
  uploadProgress.value = 0;
  form.value = {
    title: '',
    type: 'PREROLL',
    campaignName: '',
    filePath: '',
    url: '',
    thumbnailPath: '',
    duration: 30,
    skipAfter: 5,
    weight: 5,
    clickUrl: '',
    startDate: '',
    endDate: '',
  };
};

const getThumbnailUrl = (path) => {
  if (path.startsWith('http')) return path;
  return `${import.meta.env.VITE_API_URL.replace('/api', '')}${path}`;
};

const getCompletionRate = (ad) => {
  return ad.impressions > 0 ? Math.round((ad.completions / ad.impressions) * 100) : 0;
};

onMounted(() => {
  loadAds();
});
</script>

<style scoped>
.admin-ads {
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

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: #1a1a1a;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #333;
}

.stat-label {
  color: #999;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  color: #fff;
  font-size: 32px;
  font-weight: bold;
}

.filters {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.filter-select {
  background: #1a1a1a;
  border: 1px solid #333;
  color: #fff;
  padding: 10px 15px;
  border-radius: 6px;
  font-size: 14px;
}

.table-container {
  background: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #333;
}

.ads-table {
  width: 100%;
  border-collapse: collapse;
}

.ads-table thead {
  background: #0a0a0a;
}

.ads-table th {
  padding: 15px;
  text-align: left;
  color: #999;
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  border-bottom: 1px solid #333;
}

.ads-table td {
  padding: 15px;
  color: #fff;
  border-bottom: 1px solid #222;
}

.ads-table tbody tr:hover {
  background: #222;
}

.ad-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ad-thumbnail {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.badge-preroll { background: #e50914; color: #fff; }
.badge-midroll { background: #0080ff; color: #fff; }
.badge-pauseroll { background: #ffa500; color: #000; }

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.status-active {
  background: #10b981;
  color: #fff;
}

.status-inactive {
  background: #6b7280;
  color: #fff;
}

.actions {
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
  border-color: #666;
}

.btn-icon.btn-danger:hover {
  background: #dc2626;
  border-color: #dc2626;
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

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #666;
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
  max-width: 800px;
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

.form-group small {
  display: block;
  color: #999;
  font-size: 12px;
  margin-top: 4px;
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
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.file-upload {
  position: relative;
}

.file-input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.file-upload-label {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 30px;
  background: #0a0a0a;
  border: 2px dashed #333;
  border-radius: 6px;
  text-align: center;
  color: #999;
  cursor: pointer;
  transition: all 0.2s;
  justify-content: center;
}

.file-upload:hover .file-upload-label {
  border-color: #e50914;
  color: #fff;
}

.upload-progress {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #333;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #e50914;
  transition: width 0.3s;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #333;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.analytics-card {
  background: #0a0a0a;
  padding: 20px;
  border-radius: 6px;
  text-align: center;
  border: 1px solid #333;
}

.analytics-label {
  color: #999;
  font-size: 12px;
  margin-bottom: 8px;
}

.analytics-value {
  color: #fff;
  font-size: 28px;
  font-weight: bold;
}
</style>
