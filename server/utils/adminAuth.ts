export function requireAdmin(event: any) {
  const config = useRuntimeConfig()
  const env = event.context.cloudflare?.env as Record<string, string> | undefined
  const adminPassword = env?.NUXT_ADMIN_PASSWORD ?? config.adminPassword ?? ''

  const headerPassword =
    getHeader(event, 'x-admin-password') || getHeader(event, 'X-Admin-Password')

  if (!adminPassword || headerPassword !== adminPassword) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}

