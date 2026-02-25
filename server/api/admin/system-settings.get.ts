import { requireAdmin } from '~/server/utils/adminAuth'

type SystemSettings = {
  kiosk_thank_you_html: string | null
  kiosk_thank_you_link_url: string | null
  kiosk_thank_you_link_label: string | null
}

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const db = event.context.cloudflare?.env?.DB as D1Database | undefined
  if (!db) {
    return {
      kiosk_thank_you_html: null,
      kiosk_thank_you_link_url: null,
      kiosk_thank_you_link_label: null,
    } satisfies SystemSettings
  }

  const keys = [
    'kiosk_thank_you_html',
    'kiosk_thank_you_link_url',
    'kiosk_thank_you_link_label',
  ]

  const placeholders = keys.map(() => '?').join(',')
  const { results } = await db
    .prepare(
      `SELECT key, value FROM system_settings WHERE key IN (${placeholders})`,
    )
    .bind(...keys)
    .all<(SystemSettings & { key: string; value: string })>()

  const map = new Map<string, string>()
  for (const row of results ?? []) {
    if (row && typeof row.key === 'string') {
      map.set(row.key, String(row.value ?? ''))
    }
  }

  const settings: SystemSettings = {
    kiosk_thank_you_html: map.get('kiosk_thank_you_html') ?? null,
    kiosk_thank_you_link_url: map.get('kiosk_thank_you_link_url') ?? null,
    kiosk_thank_you_link_label: map.get('kiosk_thank_you_link_label') ?? null,
  }

  return settings
})

