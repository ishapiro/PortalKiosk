<template>
  <div class="status-page h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
    <header class="py-3 border-b border-slate-800">
      <div class="max-w-6xl mx-auto px-4 flex items-center justify-between gap-3">
        <div class="flex items-center gap-4">
          <img
            src="/brody-logo.png"
            alt="Brody Country Club logo"
            class="h-10 w-auto object-contain drop-shadow-lg"
          />
          <div>
            <h1 class="text-xl sm:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-300 bg-clip-text text-transparent">
              Order Status Board
            </h1>
            <p class="text-[11px] sm:text-xs text-slate-300/80">
              Watch your order glide from placed → preparing → ready for pickup.
            </p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-[11px] uppercase tracking-[0.2em] text-slate-400">
            Live refresh
          </p>
          <p class="text-xs font-medium text-emerald-300">
            Every 5 seconds
          </p>
        </div>
      </div>
    </header>

    <main class="flex-1 py-3 overflow-hidden">
      <div class="max-w-6xl mx-auto px-4 space-y-3 h-full">
        <section
          v-if="!authed"
          class="flex-1 flex items-center justify-center"
        >
          <div class="max-w-sm w-full mx-auto rounded-2xl bg-slate-900/80 border border-slate-700 px-5 py-6 space-y-4 shadow-xl shadow-black/40">
            <div class="flex items-start justify-between gap-3">
              <div class="space-y-1">
                <h2 class="text-lg font-semibold text-slate-50 tracking-tight">
                  Admin access required
                </h2>
                <p class="text-xs text-slate-300/90">
                  Enter the admin password to view the live order status board.
                </p>
              </div>
              <button
                type="button"
                class="text-slate-500 hover:text-slate-200 text-sm"
                @click="goHome"
              >
                ✕
              </button>
            </div>
            <form
              class="space-y-3"
              @submit.prevent="submitPassword"
            >
              <div class="space-y-1.5">
                <label class="block text-xs font-medium text-slate-200 uppercase tracking-wide">
                  Admin password
                </label>
                <input
                  v-model="password"
                  type="password"
                  class="w-full px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-950/70 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400"
                  placeholder="••••••••"
                />
              </div>
              <p
                v-if="error"
                class="text-xs text-rose-300"
              >
                {{ error }}
              </p>
              <button
                type="submit"
                class="w-full inline-flex items-center justify-center px-3 py-2.5 rounded-lg bg-emerald-500 text-xs font-semibold text-slate-950 shadow-sm hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1 focus:ring-offset-slate-950"
              >
                Enter status board
              </button>
            </form>
          </div>
        </section>

        <section
          v-else
          class="rounded-3xl border border-slate-800/80 bg-gradient-to-r from-slate-900/70 via-slate-900/40 to-slate-900/70 px-3 sm:px-5 py-3 shadow-xl shadow-black/40"
        >
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex flex-wrap items-center gap-4">
              <div class="flex items-baseline gap-1.5">
                <span class="text-sm text-slate-300">Total</span>
                <span class="text-2xl sm:text-3xl font-extrabold text-emerald-300">
                  {{ totals.total }}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-2 text-[11px] sm:text-sm">
                <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/15 border border-amber-400/50 text-amber-200">
                  <span class="h-2 w-2 rounded-full bg-amber-300 animate-pulse" />
                  New: <strong>{{ totals.new }}</strong>
                </span>
                <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-sky-500/15 border border-sky-400/50 text-sky-200">
                  <span class="h-2 w-2 rounded-full bg-sky-300 animate-pulse" />
                  Preparing: <strong>{{ totals.preparing }}</strong>
                </span>
                <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/50 text-emerald-200">
                  <span class="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
                  Ready: <strong>{{ totals.ready }}</strong>
                </span>
                <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-700/40 border border-slate-500 text-slate-100">
                  <span class="h-2 w-2 rounded-full bg-slate-300" />
                  Total delivered: <strong>{{ totals.delivered }}</strong>
                </span>
              </div>
            </div>
            <div class="text-right text-xs text-slate-400">
              <p>Last update</p>
              <p class="font-mono text-slate-200">
                {{ lastUpdatedLabel }}
              </p>
            </div>
          </div>
        </section>

        <section
          v-if="authed && loading"
          class="flex-1 flex items-center justify-center"
        >
          <div class="flex flex-col items-center gap-3">
            <div class="flex gap-1">
              <span class="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-bounce" />
              <span class="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:120ms]" />
              <span class="h-2.5 w-2.5 rounded-full bg-sky-400 animate-bounce [animation-delay:240ms]" />
            </div>
            <p class="text-sm text-slate-300">
              Warming up the kitchen queue…
            </p>
          </div>
        </section>

        <section
          v-else-if="authed"
          class="grid gap-3 grid-cols-1 lg:grid-cols-3 h-[calc(100%-8rem)]"
        >
          <!-- New -->
          <div class="rounded-3xl border border-amber-500/40 bg-gradient-to-b from-amber-950/70 via-slate-950/50 to-slate-950/70 p-3 sm:p-3 space-y-2 shadow-lg shadow-amber-900/40 flex flex-col h-full">
            <header class="flex items-center justify-between gap-3">
              <div>
                <h2 class="text-sm font-semibold text-amber-100 tracking-tight">
                  Just ordered
                </h2>
                <p class="text-[11px] text-amber-200/80">
                  Orders we’re about to start.
                </p>
              </div>
              <span class="inline-flex items-center justify-center h-7 w-7 rounded-full bg-amber-500/20 border border-amber-400 text-xs font-semibold text-amber-200">
                {{ grouped.new.length }}
              </span>
            </header>
            <ul class="space-y-1.5 pr-1">
              <li
                v-for="ord in grouped.new"
                :key="ord.id"
                class="group rounded-2xl bg-slate-950/50 border border-slate-800/70 px-3 py-2 flex items-center justify-between gap-3 transition transform hover:-translate-y-0.5 hover:border-amber-400/80 hover:bg-slate-900/80"
              >
                <div class="space-y-0.5">
                  <button
                    type="button"
                    class="text-sm font-semibold text-slate-50 hover:underline"
                    @click="openOrderDetails(ord)"
                  >
                    #{{ ord.order_number ?? ord.id }}
                  </button>
                  <p class="text-xs text-slate-300">
                    {{ ord.customer_name }}
                  </p>
                </div>
                <div class="flex items-center gap-1.5 whitespace-nowrap">
                  <span class="text-[11px] font-medium text-amber-200">
                    In queue
                  </span>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center h-6 w-6 rounded-full border border-amber-400/70 bg-amber-500/10 text-xs font-semibold text-amber-100 hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="updatingIds.includes(ord.id)"
                    @click="advanceOrderStatus(ord.id, ord.status)"
                    aria-label="Move order to preparing"
                  >
                    →
                  </button>
                </div>
              </li>
              <li
                v-if="grouped.new.length === 0"
                class="text-xs text-amber-200/80"
              >
                Waiting for fresh orders…
              </li>
            </ul>
          </div>

          <!-- Preparing -->
          <div class="rounded-3xl border border-sky-500/40 bg-gradient-to-b from-sky-950/70 via-slate-950/50 to-slate-950/70 p-3 sm:p-3 space-y-2 shadow-lg shadow-sky-900/40 flex flex-col h-full">
            <header class="flex items-center justify-between gap-3">
              <div>
                <h2 class="text-sm font-semibold text-sky-100 tracking-tight">
                  Being prepared
                </h2>
                <p class="text-[11px] text-sky-200/80">
                  Our team is building these now.
                </p>
              </div>
              <span class="inline-flex items-center justify-center h-7 w-7 rounded-full bg-sky-500/20 border border-sky-400 text-xs font-semibold text-sky-100">
                {{ grouped.preparing.length }}
              </span>
            </header>
            <ul class="space-y-1.5 pr-1">
              <li
                v-for="ord in grouped.preparing"
                :key="ord.id"
                class="group rounded-2xl bg-slate-950/50 border border-slate-800/70 px-3 py-2 flex items-center justify-between gap-3 transition transform hover:-translate-y-0.5 hover:border-sky-400/80 hover:bg-slate-900/80"
              >
                <div>
                  <button
                    type="button"
                    class="text-sm font-semibold text-slate-50 hover:underline"
                    @click="openOrderDetails(ord)"
                  >
                    #{{ ord.order_number ?? ord.id }}
                  </button>
                  <p class="text-xs text-slate-300">
                    {{ ord.customer_name }}
                  </p>
                </div>
                <div class="flex items-center gap-1.5 text-[11px] text-sky-200 whitespace-nowrap">
                  <span class="h-1.5 w-8 rounded-full bg-sky-500/40 overflow-hidden">
                    <span class="block h-full w-1/2 bg-sky-300 animate-[pulse_1.4s_ease-in-out_infinite]" />
                  </span>
                  <span>Cooking</span>
                  <button
                    type="button"
                    class="ml-1 inline-flex items-center justify-center h-6 w-6 rounded-full border border-sky-400/70 bg-sky-500/10 text-xs font-semibold text-sky-100 hover:bg-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="updatingIds.includes(ord.id)"
                    @click="regressOrderStatus(ord.id, ord.status)"
                    aria-label="Move order back to new"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    class="ml-1 inline-flex items-center justify-center h-6 w-6 rounded-full border border-sky-400/70 bg-sky-500/10 text-xs font-semibold text-sky-100 hover:bg-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="updatingIds.includes(ord.id)"
                    @click="advanceOrderStatus(ord.id, ord.status)"
                    aria-label="Move order to ready"
                  >
                    →
                  </button>
                </div>
              </li>
              <li
                v-if="grouped.preparing.length === 0"
                class="text-xs text-sky-200/80"
              >
                Nothing in progress right now.
              </li>
            </ul>
          </div>

          <!-- Ready / Delivery -->
          <div class="rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-emerald-950/70 via-slate-950/50 to-slate-950/70 p-3 sm:p-3 space-y-2 shadow-lg shadow-emerald-900/40 flex flex-col h-full">
            <header class="flex items-center justify-between gap-3">
              <div>
                <h2 class="text-sm font-semibold text-emerald-100 tracking-tight">
                  Ready for pickup / Delivery
                </h2>
                <p class="text-[11px] text-emerald-200/80">
                  These orders are waiting at the counter.
                </p>
              </div>
              <span class="inline-flex items-center justify-center h-7 w-7 rounded-full bg-emerald-500/20 border border-emerald-400 text-xs font-semibold text-emerald-100">
                {{ grouped.ready.length }}
              </span>
            </header>
            <ul class="space-y-1.5 pr-1">
              <li
                v-for="ord in grouped.ready"
                :key="ord.id"
                class="group rounded-2xl bg-slate-950/50 border border-slate-800/70 px-3 py-2 flex items-center justify-between gap-3 transition transform hover:-translate-y-0.5 hover:border-emerald-400/80 hover:bg-slate-900/80"
              >
                <div>
                  <button
                    type="button"
                    class="text-sm font-semibold text-slate-50 hover:underline"
                    @click="openOrderDetails(ord)"
                  >
                    #{{ ord.order_number ?? ord.id }}
                  </button>
                  <p class="text-xs text-slate-300">
                    {{ ord.customer_name }}
                  </p>
                </div>
                <div class="flex items-center gap-1.5 whitespace-nowrap">
                  <button
                    type="button"
                    class="inline-flex items-center justify-center h-6 w-6 rounded-full border border-emerald-400/70 bg-emerald-500/10 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="updatingIds.includes(ord.id)"
                    @click="regressOrderStatus(ord.id, ord.status)"
                    aria-label="Move order back to preparing"
                  >
                    ←
                  </button>
                  <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-200">
                    <span class="h-2 w-2 rounded-full bg-emerald-300 animate-ping" />
                  </span>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center h-6 w-6 rounded-full border border-emerald-400/70 bg-emerald-500/10 text-[11px] font-semibold text-emerald-100 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="resendingIds.includes(ord.id)"
                    @click="resendReadyEmail(ord.id)"
                    aria-label="Resend ready for pickup email"
                  >
                    E
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center px-2 py-1 rounded-full border border-emerald-400/70 bg-emerald-500/15 text-[10px] font-semibold text-emerald-100 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="deliveringIds.includes(ord.id)"
                    @click="markOrderDelivered(ord.id)"
                  >
                    Mark delivered
                  </button>
                </div>
              </li>
              <li
                v-if="grouped.ready.length === 0"
                class="text-xs text-emerald-200/80"
              >
                Nothing ready just yet — almost there!
              </li>
            </ul>
          </div>
        </section>
      </div>
    </main>

    <!-- Order details modal -->
    <div
      v-if="selectedOrder"
      class="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 py-6"
      @click.self="closeOrderDetails"
    >
      <div class="max-w-md w-full rounded-2xl bg-slate-950 border border-slate-700 shadow-2xl px-5 py-6 space-y-4">
        <header class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-400">
              Order details
            </p>
            <p class="text-xl font-semibold text-slate-50">
              #{{ selectedOrder.order_number ?? selectedOrder.id }}
            </p>
            <p class="text-xs text-slate-300 mt-1">
              {{ selectedOrder.customer_name }}
            </p>
          </div>
          <button
            type="button"
            class="text-xs text-slate-400 hover:text-slate-100"
            @click="closeOrderDetails"
          >
            ✕
          </button>
        </header>

        <section class="space-y-2 max-h-64 overflow-y-auto rounded-xl bg-slate-900/80 border border-slate-800 px-3 py-3">
          <div
            v-for="(item, idx) in selectedOrder.items"
            :key="idx"
            class="space-y-1 border-b border-slate-800 last:border-b-0 pb-2 last:pb-0"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="text-sm font-medium text-slate-50">
                {{ item.product_name }}
              </p>
              <p class="text-xs text-slate-300">
                ×{{ item.quantity }}
              </p>
            </div>
            <div
              v-if="item.customizations && Object.keys(item.customizations).length"
              class="text-[11px] text-slate-300"
            >
              <div
                v-for="(values, label) in item.customizations"
                :key="label"
              >
                <span class="font-semibold">{{ label }}:</span>
                <span> {{ values.join(', ') }}</span>
              </div>
            </div>
          </div>
        </section>

        <div class="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            class="inline-flex items-center justify-center px-4 py-2 rounded-full bg-slate-800 text-xs font-semibold text-slate-100 hover:bg-slate-700"
            @click="closeOrderDetails"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>

    <!-- Email status modal -->
    <div
      v-if="showEmailStatusModal"
      class="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 py-6"
      @click.self="dismissEmailStatusModal"
    >
      <div class="max-w-sm w-full rounded-2xl bg-slate-950 border border-slate-700 shadow-2xl px-5 py-5 space-y-3">
        <div class="flex items-start gap-3">
          <div
            class="h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold"
            :class="emailStatusIsError ? 'bg-rose-500/20 text-rose-300 border border-rose-400/60' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/60'"
          >
            {{ emailStatusIsError ? '!' : 'E' }}
          </div>
          <div class="space-y-1">
            <p class="text-sm font-semibold" :class="emailStatusIsError ? 'text-rose-200' : 'text-emerald-100'">
              Delivery email status
            </p>
            <p class="text-xs text-slate-200">
              {{ emailStatusMessage }}
            </p>
          </div>
        </div>
        <div class="pt-2 flex items-center justify-end">
          <button
            type="button"
            class="inline-flex items-center justify-center px-4 py-2 rounded-full bg-slate-800 text-xs font-semibold text-slate-100 hover:bg-slate-700"
            @click="dismissEmailStatusModal"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
})

interface StatusOrderItem {
  product_name: string
  quantity: number
  customizations: Record<string, string[]> | null
}

interface StatusOrder {
  id: number
  order_number: number | null
  customer_name: string
  status: 'new' | 'preparing' | 'ready'
  created_at: string
  items: StatusOrderItem[]
}

const orders = ref<StatusOrder[]>([])
const loading = ref(true)
const lastUpdated = ref<Date | null>(null)
let intervalId: ReturnType<typeof setInterval> | null = null

const deliveringIds = ref<number[]>([])
const updatingIds = ref<number[]>([])
const resendingIds = ref<number[]>([])
const showEmailStatusModal = ref(false)
const emailStatusMessage = ref('')
const emailStatusIsError = ref(false)
const selectedOrder = ref<StatusOrder | null>(null)

const password = ref('')
const error = ref('')
const authed = ref(false)

const router = useRouter()

const totalOrders = ref(0)
const totalDelivered = ref(0)

const grouped = computed(() => {
  const byStatus = {
    new: [] as StatusOrder[],
    preparing: [] as StatusOrder[],
    ready: [] as StatusOrder[],
  }
  for (const o of orders.value) {
    if (o.status === 'new') byStatus.new.push(o)
    else if (o.status === 'preparing') byStatus.preparing.push(o)
    else if (o.status === 'ready') byStatus.ready.push(o)
  }
  return byStatus
})

const totals = computed(() => {
  const g = grouped.value
  return {
    total: totalOrders.value,
    new: g.new.length,
    preparing: g.preparing.length,
    ready: g.ready.length,
    delivered: totalDelivered.value,
  }
})

const lastUpdatedLabel = computed(() => {
  if (!lastUpdated.value) return '—'
  return lastUpdated.value.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
})

async function fetchStatusOrders() {
  try {
    if (!authed.value) return

    const headers: Record<string, string> = {}
    if (password.value) {
      headers['x-admin-password'] = password.value
    }

    const data = await $fetch<{
      orders: StatusOrder[]
      totals?: { total_orders: number; total_delivered: number }
    }>('/api/status/orders', {
      headers,
    })
    orders.value = data.orders ?? []
    totalOrders.value = data.totals?.total_orders ?? orders.value.length
    totalDelivered.value = data.totals?.total_delivered ?? 0
    lastUpdated.value = new Date()
  } catch {
    // keep previous data if fetch fails
  } finally {
    loading.value = false
  }
}

function openOrderDetails(order: StatusOrder) {
  selectedOrder.value = order
}

function closeOrderDetails() {
  selectedOrder.value = null
}

async function advanceOrderStatus(id: number, currentStatus: StatusOrder['status']) {
  if (updatingIds.value.includes(id)) return

  let nextStatus: StatusOrder['status'] | null = null
  if (currentStatus === 'new') {
    nextStatus = 'preparing'
  } else if (currentStatus === 'preparing') {
    nextStatus = 'ready'
  } else {
    return
  }

  updatingIds.value.push(id)
  try {
    const headers: Record<string, string> = {}
    if (password.value) {
      headers['x-admin-password'] = password.value
    }

    await $fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      body: { status: nextStatus },
      headers,
    })

    await fetchStatusOrders()
  } catch {
    // ignore, board will refresh on next poll
  } finally {
    updatingIds.value = updatingIds.value.filter((oid) => oid !== id)
  }
}

async function regressOrderStatus(id: number, currentStatus: StatusOrder['status']) {
  if (updatingIds.value.includes(id)) return

  let nextStatus: StatusOrder['status'] | null = null
  if (currentStatus === 'preparing') {
    nextStatus = 'new'
  } else if (currentStatus === 'ready') {
    nextStatus = 'preparing'
  } else {
    return
  }

  updatingIds.value.push(id)
  try {
    const headers: Record<string, string> = {}
    if (password.value) {
      headers['x-admin-password'] = password.value
    }

    await $fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      body: { status: nextStatus },
      headers,
    })

    await fetchStatusOrders()
  } catch {
    // ignore; board will refresh on next poll
  } finally {
    updatingIds.value = updatingIds.value.filter((oid) => oid !== id)
  }
}

async function markOrderDelivered(id: number) {
  if (deliveringIds.value.includes(id)) return

  deliveringIds.value.push(id)
  try {
    const headers: Record<string, string> = {}
    if (password.value) {
      headers['x-admin-password'] = password.value
    }

    await $fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      body: { status: 'delivered' },
      headers,
    })

    await fetchStatusOrders()
  } catch {
    // Ignore for now; board will refresh on next interval
  } finally {
    deliveringIds.value = deliveringIds.value.filter((oid) => oid !== id)
  }
}

async function resendReadyEmail(id: number) {
  if (resendingIds.value.includes(id)) return

  resendingIds.value.push(id)
  try {
    const headers: Record<string, string> = {}
    if (password.value) {
      headers['x-admin-password'] = password.value
    }

    const res = await $fetch<{ ok: boolean }> (`/api/admin/orders/${id}/ready-email`, {
      method: 'POST',
      headers,
    })

    emailStatusIsError.value = !res.ok
    emailStatusMessage.value = res.ok
      ? 'Ready-for-pickup email was sent successfully.'
      : 'Unable to send ready-for-pickup email.'
  } catch (e: any) {
    emailStatusIsError.value = true
    emailStatusMessage.value =
      e?.data?.statusMessage || e?.message || 'Failed to send ready-for-pickup email.'
  } finally {
    resendingIds.value = resendingIds.value.filter((oid) => oid !== id)
    showEmailStatusModal.value = true
  }
}

onMounted(() => {
  intervalId = setInterval(fetchStatusOrders, 5000)
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})

async function submitPassword() {
  error.value = ''
  loading.value = true
  try {
    const res = await $fetch<{ ok: boolean }>('/api/auth/check', {
      method: 'POST',
      body: { role: 'admin', password: password.value },
    })
    if (!res.ok) {
      error.value = 'Incorrect password'
      authed.value = false
      return
    }
    authed.value = true
    await fetchStatusOrders()
  } catch (e: any) {
    error.value = e?.data?.statusMessage || e?.message || 'Failed to verify password'
    authed.value = false
  } finally {
    loading.value = false
  }
}

function goHome() {
  router.push('/')
}

function dismissEmailStatusModal() {
  showEmailStatusModal.value = false
}
</script>


