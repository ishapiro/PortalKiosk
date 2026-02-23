<template>
  <div class="layout-kiosk min-h-screen flex flex-col bg-gray-50">
    <div class="pt-6">
      <div class="flex justify-center">
        <div class="flex flex-col items-center gap-2">
          <img
            src="/brody-logo.png"
            alt="Brody Country Club logo"
            class="max-h-[7.5rem] md:max-h-48 w-auto object-contain"
          />
        </div>
      </div>
    </div>

    <main class="flex-1 overflow-auto pb-20">
      <slot />
    </main>

    <footer class="fixed bottom-0 left-0 right-0 flex gap-2 p-3 bg-white border-t border-gray-200 safe-area-pb">
      <NuxtLink
        to="/admin"
        class="flex-1 py-2 text-center text-sm text-gray-700 border border-gray-300 rounded-lg hover:border-brand hover:text-brand transition-colors"
      >
        Admin
      </NuxtLink>
      <NuxtLink
        to="/station"
        class="flex-1 py-2 text-center text-sm text-gray-700 border border-gray-300 rounded-lg hover:border-brand hover:text-brand transition-colors"
      >
        Fulfillment
      </NuxtLink>
    </footer>
  </div>
</template>

<script setup lang="ts">
</script>
