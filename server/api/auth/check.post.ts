export default defineEventHandler(async (event) => {
  const body = await readBody<{ role: 'admin' | 'station'; password: string }>(event)
  if (!body?.role || !body?.password) {
    return { ok: false }
  }

  const config = useRuntimeConfig()
  const env = event.context.cloudflare?.env as Record<string, string> | undefined
  const adminPassword = env?.NUXT_ADMIN_PASSWORD ?? config.adminPassword ?? ''
  const stationPassword = env?.NUXT_STATION_PASSWORD ?? config.stationPassword ?? ''

  if (body.role === 'admin' && body.password === adminPassword) return { ok: true }
  if (body.role === 'station' && body.password === stationPassword) return { ok: true }
  return { ok: false }
})
