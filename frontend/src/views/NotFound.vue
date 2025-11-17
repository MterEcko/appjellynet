<template>
  <div class="min-h-screen bg-dark flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-9xl font-bold text-primary mb-4">404</h1>
      <p class="text-2xl text-gray-400 mb-8">Página no encontrada</p>
      <router-link to="/" class="btn-primary">
        Volver al Inicio
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFound',
};
</script>
