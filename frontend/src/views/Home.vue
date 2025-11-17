<template>
  <div class="min-h-screen bg-dark">
    <h1 class="text-4xl font-bold text-center pt-20">Home / Landing Page</h1>
    <p class="text-center text-gray-400 mt-4">
      Esta será la página de inicio antes de autenticarse
    </p>
    <div class="text-center mt-8">
      <router-link to="/login" class="btn-primary">
        Iniciar Sesión
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home',
};
</script>
