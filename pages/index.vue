<template>
  <div class="kiosk-page min-h-screen max-w-5xl mx-auto mt-4 mb-6 px-3 sm:px-4 space-y-4">
    <div
      class="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-emerald-100 p-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
    >
      <div class="space-y-3 max-w-xl">
        <div class="space-y-1">
          <h1 class="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">
            Build your order
          </h1>
          <p class="text-sm text-gray-600 leading-relaxed">
            Start by entering your name, then choose one parfait and one beverage. Tap a category, pick an item, then customize it before adding to your tray.
          </p>
        </div>
        <div class="space-y-1.5">
          <label
            for="customer-name-top"
            class="block text-xs font-medium text-gray-700 uppercase tracking-wide"
          >
            Your name
          </label>
          <input
            id="customer-name-top"
            v-model="customerName"
            type="text"
            placeholder="Enter your name"
            class="w-full max-w-xs px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            autocomplete="name"
          />
        </div>
      </div>
      <div class="mt-1 md:mt-0 flex items-center gap-3 text-xs sm:text-sm">
        <div class="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 min-w-[8rem]">
          <p class="font-medium text-gray-900">
            Your tray
          </p>
          <p class="text-gray-600 mt-0.5">
            <span v-if="cartItems.length === 0">No items yet</span>
            <span v-else>{{ cartItems.length }} item{{ cartItems.length === 1 ? '' : 's' }} · {{ formatPrice(cartTotal) }}</span>
          </p>
          <p class="text-gray-500 mt-1">
            See the tray list to the right (or below on mobile) to review or remove items. Refreshing the page clears it.
          </p>
        </div>
      </div>
    </div>

    <div class="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div class="space-y-4">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 space-y-3">
          <h2 class="text-base font-semibold text-gray-900 tracking-tight">
            Categories
          </h2>

          <div
            v-if="loading"
            class="text-sm text-gray-500"
          >
            Loading menu…
          </div>
          <div
            v-else-if="loadError"
            class="text-sm text-red-600"
          >
            {{ loadError }}
          </div>
          <div
            v-else
            class="flex flex-col sm:flex-row sm:flex-wrap gap-3"
          >
            <button
              v-for="cls in classes"
              :key="cls.id"
              type="button"
              class="inline-flex flex-col items-start px-4 py-3 rounded-2xl border text-left transition shadow-sm min-w-[9rem] w-full sm:w-auto"
              :class="selectedClassId === cls.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50'"
              @click="selectClass(cls.id)"
            >
              <span class="text-sm font-semibold text-gray-900">
                {{ cls.name }}
              </span>
              <span class="mt-0.5 text-xs text-gray-500">
                {{ (cls.products || []).length }} item{{ (cls.products || []).length === 1 ? '' : 's' }}
              </span>
            </button>
            <p
              v-if="classes.length === 0"
              class="text-sm text-gray-500"
            >
              No categories configured yet. Use the Admin dashboard to add product classes.
            </p>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 space-y-3 min-h-[14rem]">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-base font-semibold text-gray-900 tracking-tight">
              Products
            </h2>
            <p class="text-xs text-gray-500">
              Tap an item to customize it.
            </p>
          </div>

          <div
            v-if="!selectedClass"
            class="text-sm text-gray-500"
          >
            Choose a category first.
          </div>
          <div
            v-else-if="!selectedClass.products.length"
            class="text-sm text-gray-500"
          >
            No products yet for {{ selectedClass.name }}.
          </div>
          <div
            v-else
            class="grid gap-3 sm:grid-cols-2"
          >
            <button
              v-for="product in selectedClass.products"
              :key="product.id"
              type="button"
              class="w-full text-left rounded-2xl border px-4 py-3 transition shadow-sm bg-white"
              :class="selectedProductId === product.id ? 'border-emerald-500 ring-1 ring-emerald-200' : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/60'"
              @click="selectProduct(product.id)"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="space-y-0.5">
                  <p class="text-sm font-semibold text-gray-900">
                    {{ product.name }}
                  </p>
                  <p
                    v-if="product.description"
                    class="text-xs text-gray-500 line-clamp-2"
                  >
                    {{ product.description }}
                  </p>
                </div>
                <p class="text-sm font-semibold text-emerald-700">
                  {{ formatPrice(product.price_cents) }}
                </p>
              </div>
            </button>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 space-y-3">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-base font-semibold text-gray-900 tracking-tight">
              Customizations
            </h2>
            <p class="text-xs text-gray-500">
              Options change based on the item you pick.
            </p>
          </div>

          <div
            v-if="!selectedProduct || !selectedClass"
            class="text-sm text-gray-500"
          >
            Pick a product to customize it.
          </div>
          <div
            v-else-if="!selectedProduct.customizations.length"
            class="text-sm text-gray-500"
          >
            No extra options for this item.
          </div>
          <div
            v-else
            class="space-y-4"
          >
            <div
              v-for="group in selectedProduct.customizations"
              :key="group.id"
              class="space-y-2"
            >
              <div class="flex items-center justify-between gap-2">
                <div>
                  <p class="text-sm font-medium text-gray-900">
                    {{ group.label }}
                  </p>
                  <p class="text-xs text-gray-500">
                    <span v-if="group.kind === 'multi'">
                      Choose any
                      <span v-if="group.max_selections != null">
                        up to {{ group.max_selections }}
                      </span>
                      <span v-else>
                        number
                      </span>
                    </span>
                    <span v-else>
                      Choose one (optional)
                    </span>
                  </p>
                </div>
                <p
                  v-if="group.kind === 'multi' && group.max_selections != null"
                  class="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5"
                >
                  Max {{ group.max_selections }}
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <button
                  v-for="option in group.options"
                  :key="option"
                  type="button"
                  class="px-3 py-2 rounded-full border text-sm sm:text-xs font-medium transition bg-white"
                  :class="isOptionSelected(group.id, option)
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                    : 'border-gray-200 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50/60'"
                  @click="toggleOption(group, option)"
                >
                  {{ option }}
                </button>
              </div>
            </div>

            <div class="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                class="text-xs text-gray-500 hover:text-gray-700"
                @click="clearSelections"
              >
                Clear selections
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-600 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 focus:ring-offset-white disabled:opacity-60"
                :disabled="!selectedProduct"
                @click="addToCart"
              >
                Add to tray
              </button>
            </div>
          </div>
        </div>
      </div>

      <aside class="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 space-y-3 lg:sticky lg:top-4">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-semibold text-gray-900 tracking-tight">
            Your tray
          </h2>
          <button
            type="button"
            class="text-xs text-gray-500 hover:text-gray-700"
            @click="clearCart"
          >
            Clear all
          </button>
        </div>

        <div
          v-if="!cartItems.length"
          class="text-sm text-gray-500"
        >
          No items yet. Add a parfait or a beverage to your tray.
        </div>
        <div
          v-else
          class="space-y-3"
        >
          <div
            v-for="item in cartItems"
            :key="item.id"
            class="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2.5 space-y-1.5"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-sm font-semibold text-gray-900">
                  {{ item.productName }}
                  <span class="ml-1 text-[11px] font-medium text-gray-500">
                    ({{ item.className }})
                  </span>
                </p>
                <p class="text-xs text-gray-500">
                  {{ formatPrice(item.priceCents) }}
                </p>
              </div>
              <button
                type="button"
                class="text-xs text-gray-400 hover:text-gray-700"
                @click="removeFromCart(item.id)"
              >
                Remove
              </button>
            </div>

            <div
              v-if="Object.keys(item.customizations).length"
              class="border-t border-gray-200 pt-1.5 mt-1"
            >
              <dl class="space-y-1">
                <div
                  v-for="(values, label) in item.customizations"
                  :key="label"
                  class="flex items-start justify-between gap-2"
                >
                  <dt class="text-[11px] font-medium text-gray-500">
                    {{ label }}
                  </dt>
                  <dd class="text-[11px] text-gray-700 text-right">
                    {{ values.join(', ') }}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div class="pt-2 border-t border-gray-200 space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600">
                Total
              </span>
              <span class="font-semibold text-gray-900">
                {{ formatPrice(cartTotal) }}
              </span>
            </div>
            <p
              v-if="orderError"
              class="text-xs text-red-600"
            >
              {{ orderError }}
            </p>
            <button
              type="button"
              class="w-full inline-flex items-center justify-center py-3 px-4 rounded-xl bg-emerald-600 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"
              :disabled="placeOrderLoading || !customerName.trim() || cartItems.length === 0"
              @click="placeOrder"
            >
              {{ placeOrderLoading ? 'Placing order…' : 'Place order' }}
            </button>
          </div>
        </div>

        <div
          v-if="orderNumber != null"
          class="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 space-y-2"
        >
          <p class="text-sm font-medium text-emerald-800">
            Order placed
          </p>
          <p class="text-2xl font-bold text-emerald-900 tracking-tight">
            #{{ orderNumber }}
          </p>
          <p class="text-xs text-emerald-700">
            Show this number when you pick up your order.
          </p>
          <button
            type="button"
            class="text-xs font-medium text-emerald-700 hover:text-emerald-800 underline"
            @click="dismissOrderSuccess"
          >
            Dismiss
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
declare const definePageMeta: (meta: any) => void

definePageMeta({
  layout: 'kiosk',
})

type MenuCustomization = {
  id: number
  label: string
  kind: 'single' | 'multi'
  options: string[]
  max_selections: number | null
}

type MenuProduct = {
  id: number
  product_class_id: number
  name: string
  description: string | null
  price_cents: number
  sort_order: number
  customizations: MenuCustomization[]
}

type MenuClass = {
  id: number
  name: string
  sort_order: number
  customizations: MenuCustomization[]
  products: MenuProduct[]
}

type CartItem = {
  id: number
  productId: number
  productClassId: number
  className: string
  productName: string
  priceCents: number
  customizations: Record<string, string[]>
}

const loading = ref(true)
const loadError = ref('')
const classes = ref<MenuClass[]>([])

const selectedClassId = ref<number | null>(null)
const selectedProductId = ref<number | null>(null)
const selectionByCustomization = ref<Record<number, string[]>>({})

const cartItems = ref<CartItem[]>([])
const customerName = ref('')
const orderNumber = ref<number | null>(null)
const orderError = ref('')
const placeOrderLoading = ref(false)

const selectedClass = computed(() =>
  classes.value.find((c) => c.id === selectedClassId.value) ?? null,
)

const selectedProduct = computed<MenuProduct | null>(() => {
  if (!selectedClass.value) return null
  return (
    selectedClass.value.products.find((p) => p.id === selectedProductId.value) ?? null
  )
})

const cartTotal = computed(() =>
  cartItems.value.reduce((sum, item) => sum + item.priceCents, 0),
)

function formatPrice(priceCents: number) {
  const value = (priceCents || 0) / 100
  return `₪${value.toFixed(2)}`
}

function selectClass(id: number) {
  selectedClassId.value = id
  const cls = classes.value.find((c) => c.id === id)
  if (!cls) {
    selectedProductId.value = null
    selectionByCustomization.value = {}
    return
  }
  // Default to first product in class
  selectedProductId.value = cls.products[0]?.id ?? null
  selectionByCustomization.value = {}
}

function selectProduct(id: number) {
  selectedProductId.value = id
  selectionByCustomization.value = {}
}

function isOptionSelected(customizationId: number, option: string) {
  const list = selectionByCustomization.value[customizationId] ?? []
  return list.includes(option)
}

function toggleOption(group: MenuCustomization, option: string) {
  const current = selectionByCustomization.value[group.id] ?? []

  if (group.kind === 'single') {
    selectionByCustomization.value = {
      ...selectionByCustomization.value,
      [group.id]: current.includes(option) ? [] : [option],
    }
    return
  }

  // multi
  if (current.includes(option)) {
    selectionByCustomization.value = {
      ...selectionByCustomization.value,
      [group.id]: current.filter((o) => o !== option),
    }
    return
  }

  const next = [...current, option]
  if (group.max_selections != null && next.length > group.max_selections) {
    // Respect max selection; ignore extra taps
    return
  }

  selectionByCustomization.value = {
    ...selectionByCustomization.value,
    [group.id]: next,
  }
}

function clearSelections() {
  selectionByCustomization.value = {}
}

function addToCart() {
  if (!selectedClass.value || !selectedProduct.value) return

  const customizations: Record<string, string[]> = {}
  for (const group of selectedProduct.value.customizations) {
    const selected = selectionByCustomization.value[group.id] ?? []
    if (selected.length) {
      customizations[group.label] = selected
    }
  }

  // Enforce at most one item per product class (one parfait, one beverage)
  const existingIndex = cartItems.value.findIndex(
    (item) => item.productClassId === selectedClass.value!.id,
  )
  if (existingIndex !== -1) {
    cartItems.value.splice(existingIndex, 1)
  }

  const newItem: CartItem = {
    id: Date.now(),
    productId: selectedProduct.value.id,
    productClassId: selectedClass.value.id,
    className: selectedClass.value.name,
    productName: selectedProduct.value.name,
    priceCents: selectedProduct.value.price_cents,
    customizations,
  }

  cartItems.value.push(newItem)
}

function removeFromCart(id: number) {
  const idx = cartItems.value.findIndex((item) => item.id === id)
  if (idx !== -1) {
    cartItems.value.splice(idx, 1)
  }
}

function clearCart() {
  cartItems.value = []
  orderError.value = ''
}

async function placeOrder() {
  const name = customerName.value.trim()
  if (!name) {
    orderError.value = 'Enter your name above.'
    return
  }
  if (cartItems.value.length === 0) {
    orderError.value = 'Add at least one item to your tray.'
    return
  }
  orderError.value = ''
  placeOrderLoading.value = true
  try {
    const res = await $fetch<{ order_id: number; order_number: number }>('/api/orders', {
      method: 'POST',
      body: {
        customer_name: name,
        items: cartItems.value.map((item) => ({
          product_id: item.productId,
          product_class_id: item.productClassId,
          quantity: 1,
          customizations: item.customizations,
        })),
      },
    })
    orderNumber.value = res.order_number
    cartItems.value = []
  } catch (e: any) {
    const status = e?.statusCode ?? e?.status
    const message = e?.data?.statusMessage ?? e?.data?.message ?? e?.message ?? 'Failed to place order'
    orderError.value = message
    if (status === 409) {
      // One order per name — keep name, don't clear cart so they can fix and retry
    }
  } finally {
    placeOrderLoading.value = false
  }
}

function dismissOrderSuccess() {
  orderNumber.value = null
}

onMounted(async () => {
  loading.value = true
  loadError.value = ''
  try {
    const res = await $fetch<{ classes: MenuClass[] }>('/api/menu')
    classes.value = Array.isArray(res.classes) ? res.classes : []
    if (classes.value.length > 0) {
      selectClass(classes.value[0].id)
    }
  } catch (e: any) {
    loadError.value = e?.data?.message || e?.message || 'Failed to load menu'
  } finally {
    loading.value = false
  }
})
</script>
