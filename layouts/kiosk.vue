<template>
  <div class="layout-kiosk min-h-screen flex flex-col bg-gray-50">
    <header class="pt-4 pb-2">
      <div class="max-w-7xl mx-auto px-4 flex items-start justify-between gap-3">
        <div class="flex flex-col items-center gap-2 mx-auto">
          <img
            src="/brody-logo.png"
            alt="Brody Country Club logo"
            class="max-h-[7.5rem] md:max-h-48 w-auto object-contain"
          />
        </div>
        <button
          type="button"
          class="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full border border-gray-300 text-xs font-medium text-gray-600 hover:bg-gray-100"
          @click="showEmployeesModal = true"
        >
          Employees only
        </button>
      </div>
      <div class="px-4 sm:hidden flex justify-end max-w-7xl mx-auto mt-2">
        <button
          type="button"
          class="inline-flex items-center px-2.5 py-1.5 rounded-full border border-gray-300 text-[11px] font-medium text-gray-600 hover:bg-gray-100"
          @click="showEmployeesModal = true"
        >
          Employees only
        </button>
      </div>
    </header>

    <main class="flex-1 overflow-auto pb-6">
      <slot />
    </main>

    <teleport to="body">
      <div
        v-if="showEmployeesModal"
        class="fixed inset-0 z-40 flex items-center justify-center bg-black/40"
        @click.self="showEmployeesModal = false"
      >
        <div class="max-w-sm w-full mx-4 rounded-2xl bg-white shadow-xl border border-gray-200 p-5 space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-base font-semibold text-gray-900">
                Employees only
              </h2>
              <p class="mt-0.5 text-xs text-gray-600">
                Station staff and admins can enter their areas from here.
              </p>
            </div>
            <button
              type="button"
              class="text-gray-400 hover:text-gray-600"
              @click="showEmployeesModal = false"
            >
              ✕
            </button>
          </div>

          <div class="space-y-2">
            <NuxtLink
              to="/admin"
              class="block w-full text-center px-3 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-800 hover:border-brand hover:text-brand transition-colors"
              @click="showEmployeesModal = false"
            >
              Admin
            </NuxtLink>
            <NuxtLink
              to="/station"
              class="block w-full text-center px-3 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-800 hover:border-brand hover:text-brand transition-colors"
              @click="showEmployeesModal = false"
            >
              Order processing
            </NuxtLink>
            <NuxtLink
              to="/status"
              class="block w-full text-center px-3 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-800 hover:border-brand hover:text-brand transition-colors"
              @click="showEmployeesModal = false"
            >
              Status board
            </NuxtLink>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
const showEmployeesModal = ref(false)
</script>
