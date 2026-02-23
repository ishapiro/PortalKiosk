<template>
  <div
    v-if="!authenticated"
    class="admin-gate max-w-md mx-auto mt-10 px-4"
  >
    <div
      class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4"
    >
      <div class="space-y-1">
        <h2 class="text-lg font-semibold text-gray-900 tracking-tight">
          Admin access
        </h2>
        <p class="text-sm text-gray-600">
          Enter the admin password to manage products, classes, and station settings.
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
          Enter admin area
        </button>
      </form>
    </div>
  </div>

  <div
    v-else
    class="admin-page max-w-3xl mx-auto mt-8 px-4"
  >
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
      <h1 class="text-xl font-semibold text-gray-900 tracking-tight">
        Admin dashboard
      </h1>
      <p class="text-sm text-gray-600 leading-relaxed">
        Configure product classes, individual items, customizations, and station behavior.
        This dashboard will grow into the control center for your kiosk experience.
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
    body: { role: 'admin', password: password.value },
  })
  if (res.ok) {
    useAdminAuth().setAuthenticated()
    authenticated.value = true
  } else {
    error.value = 'Incorrect password'
  }
}

onMounted(() => {
  try {
    authenticated.value = !!useAdminAuth().isAuthenticated()
  } catch {
    authenticated.value = false
  }
})
</script>
