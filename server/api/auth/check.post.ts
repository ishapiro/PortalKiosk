export default defineEventHandler(async (event) => {
  const body = await readBody<{ role: 'admin' | 'station'; password: string }>(event)
  if (!body?.role || !body?.password) {
    return { ok: false }
  }

  const config = useRuntimeConfig()
  const env = event.context.cloudflare?.env as Record<string, string> | undefined
  const adminPassword = env?.NUXT_ADMIN_PASSWORD ?? config.adminPassword ?? ''
  const stationPassword = env?.NUXT_STATION_PASSWORD ?? config.stationPassword ?? ''

  // Temporary logging to verify passwords are loaded correctly
  // eslint-disable-next-line no-console
  console.log('[auth/check]', {
    role: body.role,
    incomingPassword: body.password,
    envAdminPassword: env?.NUXT_ADMIN_PASSWORD,
    configAdminPassword: config.adminPassword,
    envStationPassword: env?.NUXT_STATION_PASSWORD,
    configStationPassword: config.stationPassword,
  })

  if (body.role === 'admin' && body.password === adminPassword) return { ok: true }
  if (body.role === 'station' && body.password === stationPassword) return { ok: true }
  return { ok: false }
})
