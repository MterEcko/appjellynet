<template>
  <div class="min-h-screen bg-black flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-4xl font-bold mb-4">Video Player</h1>
      <p class="text-gray-400">Aquí irá el reproductor de video con integración de ads</p>
      <p class="text-gray-400 mt-2">Video ID: {{ $route.params.id }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Watch',
};
</script>
