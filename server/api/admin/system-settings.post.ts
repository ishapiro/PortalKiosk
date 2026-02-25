import { requireAdmin } from '~/server/utils/adminAuth'

type SystemSettingsInput = {
  kiosk_thank_you_html?: string | null
  kiosk_thank_you_link_url?: string | null
  kiosk_thank_you_link_label?: string | null
}

type SystemSettings = {
  kiosk_thank_you_html: string | null
  kiosk_thank_you_link_url: string | null
  kiosk_thank_you_link_label: string | null
}

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const db = event.context.cloudflare?.env?.DB as D1Database | undefined
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database not configured' })
  }

  const body = (await readBody<SystemSettingsInput>(event)) || {}

  const entries: Array<[string, string | null | undefined]> = [
    ['kiosk_thank_you_html', body.kiosk_thank_you_html],
    ['kiosk_thank_you_link_url', body.kiosk_thank_you_link_url],
    ['kiosk_thank_you_link_label', body.kiosk_thank_you_link_label],
  ]

  // Only upsert keys that are present on the body (even if null/empty string)
  for (const [key, value] of entries) {
    if (!(key in body)) continue

    const safeValue =
      value == null ? '' : typeof value === 'string' ? value : String(value)

    await db
      .prepare(
        `INSERT INTO system_settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
      )
      .bind(key, safeValue)
      .run()
  }

  // Return the updated settings via the same shape as GET
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

