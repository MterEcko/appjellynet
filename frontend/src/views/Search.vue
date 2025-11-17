<template>
  <div class="min-h-screen bg-dark p-8">
    <h1 class="text-4xl font-bold mb-8">Buscar Contenido</h1>
    <input
      type="text"
      placeholder="Buscar películas, series..."
      class="w-full max-w-2xl px-6 py-4 bg-dark-lighter border border-gray-600 rounded-lg focus:outline-none focus:border-primary text-white text-lg"
    />
    <p class="text-gray-400 mt-8">Resultados de búsqueda aparecerán aquí</p>
  </div>
</template>

<script>
export default {
  name: 'Search',
};
</script>
