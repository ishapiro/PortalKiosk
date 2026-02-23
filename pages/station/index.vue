<template>
  <div
    v-if="!authenticated"
    class="station-gate max-w-md mx-auto mt-10 px-4"
  >
    <div
      class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4"
    >
      <div class="space-y-1">
        <h2 class="text-lg font-semibold text-gray-900 tracking-tight">
          Station access
        </h2>
        <p class="text-sm text-gray-600">
          Enter the station password to view and manage the live order queue.
        </p>
      </div>

      <form @submit.prevent="submitPassword" class="space-y-3">
        <div class="space-y-1.5">
          <label class="block text-xs font-medium text-gray-700 uppercase tracking-wide">
            Password
          </label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
            autocomplete="current-password"
          />
        </div>

        <p v-if="error" class="text-sm text-red-600">
          {{ error }}
        </p>

        <button
          type="submit"
          class="w-full inline-flex items-center justify-center py-2.5 px-3 rounded-lg bg-brand text-sm font-medium text-white shadow-sm hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 focus:ring-offset-white transition-colors"
        >
          Enter station view
        </button>
      </form>
    </div>
  </div>

  <div
    v-else
    class="station-page max-w-4xl mx-auto mt-8 px-4"
  >
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
      <h1 class="text-xl font-semibold text-gray-900 tracking-tight">
        Order queue
      </h1>
      <p class="text-sm text-gray-600 leading-relaxed">
        Incoming kiosk orders will appear here, grouped by product class so the bar and kitchen
        can quickly see what to prepare and mark items as ready.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
declare const definePageMeta: (meta: any) => void

definePageMeta({
  layout: 'default',
})

const password = ref('')
const error = ref('')
const authenticated = ref(false)

async function submitPassword() {
  error.value = ''
  const res = await $fetch<{ ok: boolean }>('/api/auth/check', {
    method: 'POST',
    body: { role: 'station', password: password.value },
  })
  if (res.ok) {
    useStationAuth().setAuthenticated()
    authenticated.value = true
  } else {
    error.value = 'Incorrect password'
  }
}

onMounted(() => {
  try {
    authenticated.value = !!useStationAuth().isAuthenticated()
  } catch {
    authenticated.value = false
  }
})
</script>
