<template>
  <div class="layout-default min-h-screen bg-gray-100">
    <div class="pt-6">
      <div class="flex justify-center">
        <div class="flex flex-col items-center gap-2">
          <img
            src="/brody-logo.png"
            alt="Brody Country Club logo"
            class="max-h-24 w-auto object-contain"
          />
        </div>
      </div>
    </div>
    <main class="max-w-7xl mx-auto px-4 py-6">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
</script>
