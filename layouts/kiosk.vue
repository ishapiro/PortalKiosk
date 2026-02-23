<template>
  <div class="layout-kiosk min-h-screen flex flex-col bg-gray-50">
    <main class="flex-1 overflow-auto pb-20">
      <slot />
    </main>
    <footer class="fixed bottom-0 left-0 right-0 flex gap-2 p-3 bg-white border-t border-gray-200 safe-area-pb">
      <NuxtLink
        to="/admin"
        class="flex-1 py-2 text-center text-sm text-gray-600 border border-gray-300 rounded-lg"
      >
        Admin
      </NuxtLink>
      <NuxtLink
        to="/station"
        class="flex-1 py-2 text-center text-sm text-gray-600 border border-gray-300 rounded-lg"
      >
        Fulfillment
      </NuxtLink>
    </footer>
  </div>
</template>

<script setup lang="ts">
</script>
