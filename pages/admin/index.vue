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
    class="admin-page max-w-4xl mx-auto mt-8 px-4 space-y-4"
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

    <section class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="text-base font-semibold text-gray-900 tracking-tight">
            Product classes
          </h2>
          <p class="text-xs text-gray-600">
            Define high-level categories like Parfait and Beverage.
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-brand text-xs font-medium text-white shadow-sm hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 focus:ring-offset-white"
          @click="refreshClasses"
        >
          Refresh
        </button>
      </div>

      <div class="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]">
        <div class="space-y-2">
          <div
            v-if="classesLoading"
            class="text-sm text-gray-500"
          >
            Loading product classes…
          </div>
          <div
            v-else-if="classesError"
            class="text-sm text-red-600"
          >
            {{ classesError }}
          </div>
          <ul
            v-else
            class="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden bg-gray-50"
          >
            <li
              v-for="cls in productClasses"
              :key="cls.id"
              class="px-3 py-2.5 flex items-center justify-between gap-3"
            >
              <div>
                <p class="text-sm font-medium text-gray-900">
                  {{ cls.name }}
                </p>
                <p class="text-xs text-gray-500">
                  Sort order: {{ cls.sort_order }}
                </p>
              </div>
              <button
                type="button"
                class="text-xs font-medium text-brand hover:text-brand-light"
                @click="startEdit(cls)"
              >
                Edit
              </button>
            </li>
            <li
              v-if="productClasses.length === 0"
              class="px-3 py-4 text-sm text-gray-500 text-center"
            >
              No product classes yet. Use the form to add Parfait and Beverage.
            </li>
          </ul>
        </div>

        <div class="space-y-3">
          <h3 class="text-sm font-semibold text-gray-900">
            {{ editingId ? 'Edit class' : 'Add class' }}
          </h3>

          <form
            class="space-y-3"
            @submit.prevent="submitClass"
          >
            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                Name
              </label>
              <input
                v-model="formName"
                type="text"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                placeholder="Parfait"
              />
            </div>

            <div class="space-y-1.5">
              <label class="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                Sort order
              </label>
              <input
                v-model.number="formSortOrder"
                type="number"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                placeholder="0"
              />
            </div>

            <p
              v-if="formError"
              class="text-xs text-red-600"
            >
              {{ formError }}
            </p>

            <div class="flex items-center gap-3">
              <button
                type="submit"
                class="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-brand text-xs font-medium text-white shadow-sm hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 focus:ring-offset-white disabled:opacity-60"
                :disabled="formSubmitting"
              >
                {{ editingId ? 'Save changes' : 'Add class' }}
              </button>
              <button
                v-if="editingId"
                type="button"
                class="text-xs text-gray-500 hover:text-gray-700"
                @click="resetForm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>

    <section class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="text-base font-semibold text-gray-900 tracking-tight">
            Products
          </h2>
          <p class="text-xs text-gray-600">
            Manage items under each product class, including name, description, and price.
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-brand text-xs font-medium text-white shadow-sm hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 focus:ring-offset-white"
          @click="refreshProducts"
        >
          Refresh
        </button>
      </div>

      <div class="space-y-4">
        <div class="flex flex-wrap items-center gap-3">
          <label class="text-xs font-medium text-gray-700 uppercase tracking-wide">
            Product class
          </label>
          <select
            v-model.number="selectedClassId"
            class="px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          >
            <option
              disabled
              value="0"
            >
              Select a class
            </option>
            <option
              v-for="cls in productClasses"
              :key="cls.id"
              :value="cls.id"
            >
              {{ cls.name }}
            </option>
          </select>
        </div>

        <div
          v-if="!selectedClassId"
          class="text-sm text-gray-500"
        >
          Choose a product class to see and edit its products.
        </div>

        <div
          v-else
          class="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)]"
        >
          <div class="space-y-2">
            <div
              v-if="productsLoading"
              class="text-sm text-gray-500"
            >
              Loading products…
            </div>
            <div
              v-else-if="productsError"
              class="text-sm text-red-600"
            >
              {{ productsError }}
            </div>
            <ul
              v-else
              class="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden bg-gray-50"
            >
              <li
                v-for="product in products"
                :key="product.id"
                class="px-3 py-2.5 flex items-center justify-between gap-3"
              >
                <div>
                  <p class="text-sm font-medium text-gray-900">
                    {{ product.name }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ formatPrice(product.price_cents) }} · Sort: {{ product.sort_order }}
                  </p>
                  <p
                    v-if="product.description"
                    class="text-xs text-gray-500 mt-0.5"
                  >
                    {{ product.description }}
                  </p>
                </div>
                <button
                  type="button"
                  class="text-xs font-medium text-brand hover:text-brand-light"
                  @click="startEditProduct(product)"
                >
                  Edit
                </button>
              </li>
              <li
                v-if="products.length === 0"
                class="px-3 py-4 text-sm text-gray-500 text-center"
              >
                No products yet for this class. Use the form to add one.
              </li>
            </ul>
          </div>

          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-gray-900">
              {{ editingProductId ? 'Edit product' : 'Add product' }}
            </h3>

            <form
              class="space-y-3"
              @submit.prevent="submitProduct"
            >
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Name
                </label>
                <input
                  v-model="productName"
                  type="text"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                  placeholder="Parfait"
                />
              </div>

              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  v-model="productDescription"
                  rows="2"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                  placeholder="Optional description"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1.5">
                  <label class="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Price (₪)
                  </label>
                  <input
                    v-model.number="productPrice"
                    type="number"
                    min="0"
                    step="0.5"
                    class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                    placeholder="0"
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Sort order
                  </label>
                  <input
                    v-model.number="productSortOrder"
                    type="number"
                    class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                    placeholder="0"
                  />
                </div>
              </div>

              <p
                v-if="productFormError"
                class="text-xs text-red-600"
              >
                {{ productFormError }}
              </p>

              <div class="flex items-center gap-3">
                <button
                  type="submit"
                  class="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-brand text-xs font-medium text-white shadow-sm hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 focus:ring-offset-white disabled:opacity-60"
                  :disabled="productSubmitting"
                >
                  {{ editingProductId ? 'Save product' : 'Add product' }}
                </button>
                <button
                  v-if="editingProductId"
                  type="button"
                  class="text-xs text-gray-500 hover:text-gray-700"
                  @click="resetProductForm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
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

const productClasses = ref<{ id: number; name: string; sort_order: number }[]>([])
const classesLoading = ref(false)
const classesError = ref('')

const formName = ref('')
const formSortOrder = ref<number | null>(0)
const formError = ref('')
const formSubmitting = ref(false)
const editingId = ref<number | null>(null)

const selectedClassId = ref<number | null>(null)
const products = ref<
  {
    id: number
    product_class_id: number
    name: string
    description: string | null
    price_cents: number
    sort_order: number
  }[]
>([])
const productsLoading = ref(false)
const productsError = ref('')

const productName = ref('')
const productDescription = ref('')
const productPrice = ref<number | null>(0)
const productSortOrder = ref<number | null>(0)
const productFormError = ref('')
const productSubmitting = ref(false)
const editingProductId = ref<number | null>(null)

function adminHeaders() {
  return {
    'x-admin-password': password.value,
  }
}

async function refreshClasses() {
  classesError.value = ''
  classesLoading.value = true
  try {
    const data = await $fetch<
      { id: number; name: string; sort_order: number }[]
    >('/api/admin/product-classes', {
      headers: adminHeaders(),
    })
    productClasses.value = Array.isArray(data) ? data : []
  } catch (e: any) {
    classesError.value =
      e?.data?.message || e?.message || 'Failed to load product classes'
  } finally {
    classesLoading.value = false
  }
}

function startEdit(cls: { id: number; name: string; sort_order: number }) {
  editingId.value = cls.id
  formName.value = cls.name
  formSortOrder.value = cls.sort_order
  formError.value = ''
}

function resetForm() {
  editingId.value = null
  formName.value = ''
  formSortOrder.value = 0
  formError.value = ''
}

function resetProductForm() {
  editingProductId.value = null
  productName.value = ''
  productDescription.value = ''
  productPrice.value = 0
  productSortOrder.value = 0
  productFormError.value = ''
}

function formatPrice(priceCents: number) {
  const value = (priceCents || 0) / 100
  return `₪${value.toFixed(2)}`
}

async function refreshProducts() {
  productsError.value = ''
  if (!selectedClassId.value) {
    products.value = []
    return
  }
  productsLoading.value = true
  try {
    const data = await $fetch<
      {
        id: number
        product_class_id: number
        name: string
        description: string | null
        price_cents: number
        sort_order: number
      }[]
    >('/api/admin/products', {
      headers: adminHeaders(),
      query: { product_class_id: selectedClassId.value },
    })
    products.value = Array.isArray(data) ? data : []
  } catch (e: any) {
    productsError.value =
      e?.data?.message || e?.message || 'Failed to load products'
  } finally {
    productsLoading.value = false
  }
}

function startEditProduct(product: {
  id: number
  product_class_id: number
  name: string
  description: string | null
  price_cents: number
  sort_order: number
}) {
  editingProductId.value = product.id
  selectedClassId.value = product.product_class_id
  productName.value = product.name
  productDescription.value = product.description || ''
  productPrice.value = product.price_cents / 100
  productSortOrder.value = product.sort_order
  productFormError.value = ''
}

async function submitProduct() {
  productFormError.value = ''
  productSubmitting.value = true
  try {
    if (!selectedClassId.value) {
      productFormError.value = 'Select a product class first'
      return
    }

    const name = productName.value.trim()
    if (!name) {
      productFormError.value = 'Name is required'
      return
    }

    const priceShekels =
      typeof productPrice.value === 'number' ? productPrice.value : 0
    const priceCents = Math.max(0, Math.round(priceShekels * 100))
    const sortOrder =
      typeof productSortOrder.value === 'number' ? productSortOrder.value : 0

    if (editingProductId.value) {
      await $fetch(`/api/admin/products/${editingProductId.value}`, {
        method: 'PATCH',
        headers: adminHeaders(),
        body: {
          name,
          description: productDescription.value,
          price_cents: priceCents,
          sort_order: sortOrder,
        },
      })
    } else {
      await $fetch('/api/admin/products', {
        method: 'POST',
        headers: adminHeaders(),
        body: {
          product_class_id: selectedClassId.value,
          name,
          description: productDescription.value,
          price_cents: priceCents,
          sort_order: sortOrder,
        },
      })
    }

    resetProductForm()
    await refreshProducts()
  } catch (e: any) {
    productFormError.value =
      e?.data?.message || e?.message || 'Failed to save product'
  } finally {
    productSubmitting.value = false
  }
}

async function submitClass() {
  formError.value = ''
  formSubmitting.value = true
  try {
    const name = formName.value.trim()
    if (!name) {
      formError.value = 'Name is required'
      return
    }
    const sortOrder =
      typeof formSortOrder.value === 'number' ? formSortOrder.value : 0

    if (editingId.value) {
      const updated = await $fetch<{
        id: number
        name: string
        sort_order: number
      }>(`/api/admin/product-classes/${editingId.value}`, {
        method: 'PATCH',
        headers: adminHeaders(),
        body: { name, sort_order: sortOrder },
      })
      const idx = productClasses.value.findIndex((c) => c.id === updated.id)
      if (idx !== -1) {
        productClasses.value.splice(idx, 1, updated)
      }
    } else {
      const created = await $fetch<{
        id: number
        name: string
        sort_order: number
      }>('/api/admin/product-classes', {
        method: 'POST',
        headers: adminHeaders(),
        body: { name, sort_order: sortOrder },
      })
      productClasses.value.push(created)
    }

    resetForm()
    await refreshClasses()
  } catch (e: any) {
    formError.value =
      e?.data?.message || e?.message || 'Failed to save product class'
  } finally {
    formSubmitting.value = false
  }
}

async function submitPassword() {
  error.value = ''
  const res = await $fetch<{ ok: boolean }>('/api/auth/check', {
    method: 'POST',
    body: { role: 'admin', password: password.value },
  })
  if (res.ok) {
    useAdminAuth().setAuthenticated()
    authenticated.value = true
    await refreshClasses()
    // Default to the first class for convenience; don't let products load failure block dashboard
    if (productClasses.value.length > 0) {
      selectedClassId.value = productClasses.value[0].id
      try {
        await refreshProducts()
      } catch {
        // Products list may be empty; dashboard still shows classes
      }
    }
  } else {
    error.value = 'Incorrect password'
  }
}

// For now, always require the admin password on each page load
// so we can send it in headers for admin APIs.
</script>
