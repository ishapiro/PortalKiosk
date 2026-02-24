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
    class="station-page max-w-5xl mx-auto mt-8 px-4 space-y-4"
  >
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="space-y-1">
          <h1 class="text-xl font-semibold text-gray-900 tracking-tight">
            Order queue
          </h1>
          <p class="text-sm text-gray-600 leading-relaxed">
            Incoming kiosk orders will appear here so the bar and kitchen can quickly see what to prepare and mark items as ready.
          </p>
        </div>
        <NuxtLink
          to="/"
          class="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Home
        </NuxtLink>
      </div>
    </div>

    <section class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="space-y-1">
          <h2 class="text-base font-semibold text-gray-900 tracking-tight">
            Who is at this station?
          </h2>
          <p class="text-xs text-gray-600">
            Choose your name so we can show which orders you are working on.
          </p>
        </div>
      </div>

      <div v-if="employeesLoading" class="text-sm text-gray-500">
        Loading employees…
      </div>
      <div
        v-else-if="employeesError"
        class="text-sm text-red-600"
      >
        {{ employeesError }}
      </div>
      <div
        v-else-if="!employees.length"
        class="text-sm text-gray-500"
      >
        No employees configured yet. Add employees from the Admin dashboard.
      </div>
      <div v-else class="space-y-3">
        <div
          v-if="!currentEmployeeId"
          class="flex flex-wrap items-center gap-3"
        >
          <label class="text-xs font-medium text-gray-700 uppercase tracking-wide">
            Your name
          </label>
          <select
            v-model.number="currentEmployeeId"
            class="px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
          >
            <option :value="0">
              Select your name
            </option>
            <option
              v-for="emp in employees"
              :key="emp.id"
              :value="emp.id"
            >
              {{ emp.name }}
            </option>
          </select>
          <button
            type="button"
            class="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-brand text-xs font-medium text-white shadow-sm hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 focus:ring-offset-white"
            @click="confirmEmployeeSelection"
          >
            Continue
          </button>
        </div>
        <div
          v-else
          class="flex flex-wrap items-center justify-between gap-3"
        >
          <p class="text-sm text-gray-800">
            Signed in as
            <span class="font-semibold text-gray-900">
              {{ currentEmployeeName }}
            </span>
          </p>
          <button
            type="button"
            class="text-xs text-gray-500 hover:text-gray-700"
            @click="currentEmployeeId = null"
          >
            Change name
          </button>
        </div>
      </div>
    </section>

    <section
      v-if="currentEmployeeId"
      class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-4"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="space-y-1">
          <h2 class="text-base font-semibold text-gray-900 tracking-tight">
            My current order
          </h2>
          <p class="text-xs text-gray-600">
            See the order you are working on, and take a new one when you are ready.
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-brand text-xs font-medium text-white shadow-sm hover:bg-brand-light focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 focus:ring-offset-white disabled:opacity-60"
          :disabled="loading"
          @click="refresh"
        >
          Refresh
        </button>
      </div>

      <div v-if="errorMessage" class="text-sm text-red-600">
        {{ errorMessage }}
      </div>

      <div v-if="loading" class="text-sm text-gray-500">
        Loading orders…
      </div>

      <div
        v-else-if="orders.length === 0"
        class="text-sm text-gray-500"
      >
        No active orders yet.
      </div>

      <div
        v-else
        class="space-y-3"
      >
        <article
          v-if="myCurrentOrder"
          class="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 space-y-2"
        >
          <header class="flex items-center justify-between gap-2">
            <div>
              <p class="text-sm font-semibold text-gray-900">
                <span v-if="myCurrentOrder.order_number">#{{ myCurrentOrder.order_number }}</span>
                <span v-else>Order {{ myCurrentOrder.id }}</span>
              </p>
              <p class="text-xs text-gray-700">
                {{ myCurrentOrder.customer_name }}
              </p>
              <p class="text-[11px] text-gray-500">
                Employee: <span class="font-medium text-gray-800">{{ currentEmployeeName }}</span>
              </p>
            </div>
            <span
              class="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold"
              :class="{
                'bg-blue-100 text-blue-800': myCurrentOrder.status === 'preparing',
                'bg-emerald-100 text-emerald-800': myCurrentOrder.status === 'ready',
              }"
            >
              {{ myCurrentOrder.status }}
            </span>
          </header>

          <p class="text-xs text-gray-500">
            {{ formatOrderDate(myCurrentOrder.created_at) }}
          </p>

          <ul class="space-y-1.5">
            <li
              v-for="(item, idx) in myCurrentOrder.items"
              :key="idx"
              class="text-xs text-gray-800"
            >
              <span class="font-semibold">
                {{ item.quantity }}× {{ item.product_name }}
              </span>
              <span class="text-gray-500">
                ({{ item.product_class_name }})
              </span>
              <div
                v-if="item.customizations && Object.keys(item.customizations).length"
                class="mt-0.5 text-[11px] text-gray-600"
              >
                {{ formatItemCustomizations(item.customizations) }}
              </div>
            </li>
          </ul>

          <div class="pt-2 flex justify-end">
            <button
              type="button"
              class="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-emerald-600 text-[11px] font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 focus:ring-offset-gray-50"
              @click="finishMyOrder"
            >
              Finished
            </button>
          </div>
        </article>

        <p
          v-else
          class="text-sm text-gray-600"
        >
          You do not have an active order. Take a new one from the lists below.
        </p>
      </div>
    </section>

    <section
      v-if="currentEmployeeId"
      class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-3"
    >
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-base font-semibold text-gray-900 tracking-tight">
          Active orders
        </h2>
        <p class="text-xs text-gray-600">
          Showing all orders; yours are highlighted.
        </p>
      </div>
      <div
        v-if="!orders.some((o) => o.preparing_employee_id != null)"
        class="text-sm text-gray-500"
      >
        No active orders yet.
      </div>
      <ul
        v-else
        class="space-y-1.5 text-sm"
      >
        <li
          v-for="ord in orders.filter((o) => o.preparing_employee_id != null)"
          :key="ord.id"
          :class="ord.preparing_employee_id && currentEmployeeId && ord.preparing_employee_id === currentEmployeeId
            ? 'font-semibold text-emerald-800'
            : 'text-gray-800'"
        >
          <span>
            #{{ ord.order_number ?? ord.id }}
          </span>
          <span class="text-gray-500">
            — {{ ord.preparing_employee_name || 'Unassigned' }}
          </span>
        </li>
      </ul>
    </section>

    <section
      v-if="currentEmployeeId"
      class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-4"
    >
      <div class="space-y-4">
        <div class="space-y-2">
          <h3 class="text-xs font-semibold text-gray-900 uppercase tracking-wide">
            Waiting for packing
          </h3>
          <div class="space-y-2">
            <article
              v-for="ord in orders.filter((o) => o.status === 'new' && !o.preparing_employee_id)"
              :key="ord.id"
              class="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 space-y-2"
            >
              <header class="flex items-center justify-between gap-2">
                <div>
                  <p class="text-sm font-semibold text-gray-900">
                    <span v-if="ord.order_number">#{{ ord.order_number }}</span>
                    <span v-else>Order {{ ord.id }}</span>
                  </p>
                  <p class="text-xs text-gray-700">
                    {{ ord.customer_name }}
                  </p>
                </div>
              </header>

              <div class="flex items-center justify-between gap-2">
                <p class="text-xs text-gray-500">
                  {{ formatOrderDate(ord.created_at) }}
                </p>
                <button
                  type="button"
                  class="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-[11px] font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 focus:ring-offset-gray-50"
                  :class="hasOwnPreparingOrder
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500'"
                  :disabled="hasOwnPreparingOrder"
                  @click="takeOrder(ord)"
                >
                  Got it
                </button>
              </div>
            </article>
            <p
              v-if="!orders.some((o) => o.status === 'new' && !o.preparing_employee_id)"
              class="text-xs text-gray-500"
            >
              No orders waiting to be packed.
            </p>
          </div>
        </div>

        <div class="space-y-2">
          <h3 class="text-xs font-semibold text-gray-900 uppercase tracking-wide">
            Waiting for delivery
          </h3>
          <div class="space-y-2">
            <article
              v-for="ord in orders.filter((o) => o.status === 'ready' && !o.preparing_employee_id)"
              :key="ord.id"
              class="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 space-y-2"
            >
              <header class="flex items-center justify-between gap-2">
                <div>
                  <p class="text-sm font-semibold text-gray-900">
                    <span v-if="ord.order_number">#{{ ord.order_number }}</span>
                    <span v-else>Order {{ ord.id }}</span>
                  </p>
                  <p class="text-xs text-gray-700">
                    {{ ord.customer_name }}
                  </p>
                </div>
              </header>

              <div class="flex items-center justify-between gap-2">
                <p class="text-xs text-gray-500">
                  {{ formatOrderDate(ord.created_at) }}
                </p>
                <button
                  type="button"
                  class="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-[11px] font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 focus:ring-offset-gray-50"
                  :class="hasOwnPreparingOrder
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500'"
                  :disabled="hasOwnPreparingOrder"
                  @click="takeOrder(ord)"
                >
                  Got it
                </button>
              </div>
            </article>
            <p
              v-if="!orders.some((o) => o.status === 'ready' && !o.preparing_employee_id)"
              class="text-xs text-gray-500"
            >
              No orders waiting for delivery.
            </p>
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
const stationPassword = ref('')
const router = useRouter()

type StationOrderStatus = 'new' | 'preparing' | 'ready' | 'delivered'

interface StationOrderItem {
  product_name: string
  product_class_name: string
  quantity: number
  customizations: Record<string, string[]> | null
}

interface StationOrder {
  id: number
  order_number: number | null
  customer_name: string
  status: StationOrderStatus
  created_at: string
  preparing_employee_id: number | null
  preparing_employee_name: string | null
  items: StationOrderItem[]
}

const orders = ref<StationOrder[]>([])
const loading = ref(false)
const errorMessage = ref('')

interface StationEmployee {
  id: number
  name: string
  active: number
}

const employees = ref<StationEmployee[]>([])
const employeesLoading = ref(false)
const employeesError = ref('')
const currentEmployeeId = ref<number | null>(null)

const currentEmployeeName = computed(() => {
  if (currentEmployeeId.value == null) return ''
  const emp = employees.value.find((e) => e.id === currentEmployeeId.value)
  return emp ? emp.name : ''
})

const myCurrentOrder = computed(() =>
  currentEmployeeId.value == null
    ? null
    : orders.value.find(
        (o) =>
          o.preparing_employee_id === currentEmployeeId.value &&
          o.status !== 'delivered' &&
          o.status !== 'cancelled',
      ) ?? null,
)

const hasOwnPreparingOrder = computed(() => myCurrentOrder.value != null)

function formatOrderDate(iso: string) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function formatItemCustomizations(customizations: Record<string, string[]>): string {
  const parts: string[] = []
  for (const [key, values] of Object.entries(customizations)) {
    if (!values || !values.length) continue
    parts.push(`${key}: ${values.join(', ')}`)
  }
  return parts.join(' · ')
}

async function updateStatus(id: number, status: StationOrderStatus) {
  if (!stationPassword.value) {
    try {
      useStationAuth().clearAuthenticated()
    } catch {
      // ignore
    }
    authenticated.value = false
    password.value = ''
    stationPassword.value = ''
    error.value = ''
    errorMessage.value = ''
    router.push('/')
    return
  }

  errorMessage.value = ''
  try {
    if (status === 'preparing' && currentEmployeeId.value == null) {
      errorMessage.value = 'Select your name before taking an order.'
      return
    }

    if (status === 'preparing' && hasOwnPreparingOrder.value) {
      errorMessage.value = 'You already have an active order in progress.'
      return
    }

    const headers: Record<string, string> = {}
    if (stationPassword.value) {
      headers['x-station-password'] = stationPassword.value
    }

    const body: any = { status }
    if ((status === 'preparing' || status === 'ready') && currentEmployeeId.value != null) {
      body.employee_id = currentEmployeeId.value
    }

    await $fetch(`/api/station/orders/${id}`, {
      method: 'PATCH',
      headers,
      body,
    })

    await refresh()
  } catch (e: any) {
    errorMessage.value = e?.data?.statusMessage || e?.message || 'Failed to update order'
  }
}

function takeOrder(ord: StationOrder) {
  if (hasOwnPreparingOrder.value) return
  if (ord.preparing_employee_id) return

  if (ord.status === 'new') {
    updateStatus(ord.id, 'preparing')
  } else if (ord.status === 'ready') {
    updateStatus(ord.id, 'ready')
  }
}

async function finishMyOrder() {
  const ord = myCurrentOrder.value
  if (!ord) return

  if (ord.status === 'preparing') {
    await updateStatus(ord.id, 'ready')
  } else if (ord.status === 'ready') {
    await updateStatus(ord.id, 'delivered')
  }
}

async function submitPassword() {
  error.value = ''
  const res = await $fetch<{ ok: boolean }>('/api/auth/check', {
    method: 'POST',
    body: { role: 'station', password: password.value },
  })
  if (res.ok) {
    useStationAuth().setAuthenticated()
    authenticated.value = true
    stationPassword.value = password.value
    await loadEmployees()
  } else {
    error.value = 'Incorrect password'
  }
}

async function refresh() {
  if (!stationPassword.value) {
    // Password is missing; clear any saved auth and send the user back to the main screen.
    try {
      useStationAuth().clearAuthenticated()
    } catch {
      // ignore
    }
    authenticated.value = false
    password.value = ''
    stationPassword.value = ''
    error.value = ''
    errorMessage.value = ''
    router.push('/')
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    const headers: Record<string, string> = {}
    if (stationPassword.value) {
      headers['x-station-password'] = stationPassword.value
    }

    const data = await $fetch<{ orders: StationOrder[] }>('/api/station/orders', { headers })
    orders.value = data.orders ?? []
  } catch (e: any) {
    errorMessage.value = e?.data?.statusMessage || e?.message || 'Failed to load orders'
  } finally {
    loading.value = false
  }
}

async function loadEmployees() {
  employeesError.value = ''
  employeesLoading.value = true
  try {
    const headers: Record<string, string> = {}
    if (stationPassword.value) {
      headers['x-station-password'] = stationPassword.value
    }

    const data = await $fetch<StationEmployee[]>('/api/station/employees', {
      headers,
    })
    employees.value = Array.isArray(data) ? data : []
  } catch (e: any) {
    employeesError.value = e?.data?.statusMessage || e?.message || 'Failed to load employees'
  } finally {
    employeesLoading.value = false
  }
}

function confirmEmployeeSelection() {
  if (currentEmployeeId.value == null) {
    employeesError.value = 'Select your name to continue.'
    return
  }
  employeesError.value = ''
  refresh()
}

watch(
  () => currentEmployeeId.value,
  (val) => {
    if (val && typeof val === 'number' && Number.isFinite(val)) {
      employeesError.value = ''
      refresh()
    }
  },
)

onMounted(() => {
  // Always require password on each visit to the station page.
  try {
    useStationAuth().clearAuthenticated()
  } catch {
    // ignore
  }
  authenticated.value = false
  password.value = ''
  stationPassword.value = ''
})
// No extra components needed for the simplified debug table view.
</script>
