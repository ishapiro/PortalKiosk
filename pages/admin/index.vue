<template>
  <div v-if="!authenticated" class="admin-gate p-6 max-w-sm mx-auto">
    <h2 class="text-lg font-semibold mb-4">Admin</h2>
    <form @submit.prevent="submitPassword" class="space-y-3">
      <input
        v-model="password"
        type="password"
        placeholder="Password"
        class="w-full px-3 py-2 border rounded"
        autocomplete="current-password"
      />
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      <button type="submit" class="w-full py-2 bg-gray-800 text-white rounded">Enter</button>
    </form>
  </div>
  <div v-else class="admin-page">
    <h1 class="text-xl font-semibold mb-4">Admin</h1>
    <p class="text-gray-600">Product classes, products, customizations, and station config will go here.</p>
  </div>
</template>

<script setup lang="ts">
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
