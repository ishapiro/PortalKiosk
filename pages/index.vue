<template>
  <div
    class="kiosk-page max-w-md mx-auto mt-6 mb-8 px-4"
  >
    <div
      class="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3"
    >
      <h1 class="text-2xl font-semibold text-gray-900 tracking-tight">
        Place your order
      </h1>
      <p class="text-sm text-gray-600 leading-relaxed">
        A touch-friendly menu will appear here so guests can quickly customize
        drinks and snacks from the kiosk screen.
      </p>
      <div class="mt-2 h-32 rounded-xl border border-dashed border-emerald-200 bg-emerald-50/60 flex items-center justify-center">
        <span class="text-xs font-medium text-emerald-700 uppercase tracking-wide">
          Order flow coming soon
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
declare const definePageMeta: (meta: any) => void

definePageMeta({
  layout: 'kiosk',
})
</script>
