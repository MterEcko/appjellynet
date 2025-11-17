<template>
  <div class="min-h-screen bg-dark p-8">
    <h1 class="text-4xl font-bold mb-8">Panel de Administración</h1>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-dark-lighter p-6 rounded-lg">
        <h3 class="text-xl font-semibold mb-2">Cuentas</h3>
        <p class="text-3xl font-bold text-primary">1,250</p>
      </div>
      <div class="bg-dark-lighter p-6 rounded-lg">
        <h3 class="text-xl font-semibold mb-2">Anuncios</h3>
        <p class="text-3xl font-bold text-primary">25</p>
      </div>
      <div class="bg-dark-lighter p-6 rounded-lg">
        <h3 class="text-xl font-semibold mb-2">Servidores</h3>
        <p class="text-3xl font-bold text-primary">5</p>
      </div>
    </div>
    <p class="text-gray-400">Panel de administración completo con gestión de cuentas, ads, servidores, etc.</p>
  </div>
</template>

<script>
export default {
  name: 'Admin',
};
</script>
