<template>
  <div class="status-page h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
    <header class="pt-6 pb-4 border-b border-slate-800">
      <div class="max-w-6xl mx-auto px-4 flex items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <img
            src="/brody-logo.png"
            alt="Brody Country Club logo"
            class="hidden sm:block h-14 w-auto object-contain drop-shadow-lg"
          />
          <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-300 bg-clip-text text-transparent">
              Order Status Board
            </h1>
            <p class="text-xs sm:text-sm text-slate-300/80">
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

    <main class="flex-1 py-4 overflow-hidden">
      <div class="max-w-6xl mx-auto px-4 space-y-4 h-full overflow-hidden">
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
          class="rounded-3xl border border-slate-800/80 bg-gradient-to-r from-slate-900/70 via-slate-900/40 to-slate-900/70 px-4 sm:px-6 py-4 shadow-xl shadow-black/40"
        >
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex flex-wrap items-center gap-4">
              <div class="flex items-baseline gap-1.5">
                <span class="text-sm text-slate-300">Total</span>
                <span class="text-2xl sm:text-3xl font-extrabold text-emerald-300">
                  {{ totals.total }}
                </span>
              </div>
              <div class="flex items-center gap-3 text-xs sm:text-sm">
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
          v-else-if="authed && !orders.length"
          class="flex-1 flex items-center justify-center"
        >
          <div class="text-center space-y-3">
            <p class="text-xl font-semibold text-slate-100">
              No orders in the queue (yet!)
            </p>
            <p class="text-sm text-slate-400">
              Place an order at the kiosk and watch it appear here in real time.
            </p>
          </div>
        </section>

        <section
          v-else-if="authed"
          class="grid gap-4 lg:grid-cols-3 h-full"
        >
          <!-- New -->
          <div class="rounded-3xl border border-amber-500/40 bg-gradient-to-b from-amber-950/70 via-slate-950/50 to-slate-950/70 p-3 sm:p-4 space-y-3 shadow-lg shadow-amber-900/40 flex flex-col h-full">
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
            <ul class="space-y-2 flex-1 overflow-hidden pr-1">
              <li
                v-for="ord in grouped.new"
                :key="ord.id"
                class="group rounded-2xl bg-slate-950/50 border border-slate-800/70 px-3 py-2.5 flex items-center justify-between gap-3 transition transform hover:-translate-y-0.5 hover:border-amber-400/80 hover:bg-slate-900/80"
              >
                <div class="space-y-0.5">
                  <p class="text-sm font-semibold text-slate-50">
                    #{{ ord.order_number ?? ord.id }}
                  </p>
                  <p class="text-xs text-slate-300">
                    {{ ord.customer_name }}
                  </p>
                </div>
                <span class="text-[11px] font-medium text-amber-200">
                  In queue
                </span>
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
          <div class="rounded-3xl border border-sky-500/40 bg-gradient-to-b from-sky-950/70 via-slate-950/50 to-slate-950/70 p-3 sm:p-4 space-y-3 shadow-lg shadow-sky-900/40 flex flex-col h-full">
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
            <ul class="space-y-2 flex-1 overflow-hidden pr-1">
              <li
                v-for="ord in grouped.preparing"
                :key="ord.id"
                class="group rounded-2xl bg-slate-950/50 border border-slate-800/70 px-3 py-2.5 flex items-center justify-between gap-3 transition transform hover:-translate-y-0.5 hover:border-sky-400/80 hover:bg-slate-900/80"
              >
                <div>
                  <p class="text-sm font-semibold text-slate-50">
                    #{{ ord.order_number ?? ord.id }}
                  </p>
                  <p class="text-xs text-slate-300">
                    {{ ord.customer_name }}
                  </p>
                </div>
                <div class="flex items-center gap-1.5 text-[11px] text-sky-200">
                  <span class="h-1.5 w-8 rounded-full bg-sky-500/40 overflow-hidden">
                    <span class="block h-full w-1/2 bg-sky-300 animate-[pulse_1.4s_ease-in-out_infinite]" />
                  </span>
                  <span>Cooking</span>
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

          <!-- Ready -->
          <div class="rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-emerald-950/70 via-slate-950/50 to-slate-950/70 p-3 sm:p-4 space-y-3 shadow-lg shadow-emerald-900/40 flex flex-col h-full">
            <header class="flex items-center justify-between gap-3">
              <div>
                <h2 class="text-sm font-semibold text-emerald-100 tracking-tight">
                  Ready for pickup
                </h2>
                <p class="text-[11px] text-emerald-200/80">
                  These orders are waiting at the counter.
                </p>
              </div>
              <span class="inline-flex items-center justify-center h-7 w-7 rounded-full bg-emerald-500/20 border border-emerald-400 text-xs font-semibold text-emerald-100">
                {{ grouped.ready.length }}
              </span>
            </header>
            <ul class="space-y-2 flex-1 overflow-hidden pr-1">
              <li
                v-for="ord in grouped.ready"
                :key="ord.id"
                class="group rounded-2xl bg-slate-950/50 border border-slate-800/70 px-3 py-2.5 flex items-center justify-between gap-3 transition transform hover:-translate-y-0.5 hover:border-emerald-400/80 hover:bg-slate-900/80"
              >
                <div>
                  <p class="text-sm font-semibold text-slate-50">
                    #{{ ord.order_number ?? ord.id }}
                  </p>
                  <p class="text-xs text-slate-300">
                    {{ ord.customer_name }}
                  </p>
                </div>
                <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-200">
                  <span class="h-2 w-2 rounded-full bg-emerald-300 animate-ping" />
                  Pickup now
                </span>
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
  </div>
</template>

<script setup lang="ts">
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

const password = ref('')
const error = ref('')
const authed = ref(false)

const router = useRouter()

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
  const total = g.new.length + g.preparing.length + g.ready.length
  return {
    total,
    new: g.new.length,
    preparing: g.preparing.length,
    ready: g.ready.length,
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

    const data = await $fetch<{ orders: StatusOrder[] }>('/api/status/orders', {
      headers,
    })
    orders.value = data.orders ?? []
    lastUpdated.value = new Date()
  } catch {
    // keep previous data if fetch fails
  } finally {
    loading.value = false
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
</script>

