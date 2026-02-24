export function requireStation(event: any) {
  const config = useRuntimeConfig()
  const env = event.context.cloudflare?.env as Record<string, string> | undefined
  const stationPassword = env?.NUXT_STATION_PASSWORD ?? config.stationPassword ?? ''

  const headerPassword =
    getHeader(event, 'x-station-password') || getHeader(event, 'X-Station-Password')

  if (!stationPassword || headerPassword !== stationPassword) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}

