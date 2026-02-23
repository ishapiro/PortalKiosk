import { requireAdmin } from '~/server/utils/adminAuth'

interface CreateCustomizationBody {
  product_class_id: number
  label: string
  kind?: string
  max_selections?: number | null
  options?: string[]
}

function parseOptionsJson(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((x): x is string => typeof x === 'string')
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
    } catch {
      return []
    }
  }
  return []
}

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const body = await readBody<CreateCustomizationBody>(event)
  const productClassId = Number(body?.product_class_id)
  const label = body?.label?.trim()

  if (!Number.isFinite(productClassId)) {
    throw createError({ statusCode: 400, statusMessage: 'product_class_id is required' })
  }
  if (!label) {
    throw createError({ statusCode: 400, statusMessage: 'Label is required' })
  }

  const kind = (body?.kind === 'multi' ? 'multi' : 'single') as string
  const maxSelections =
    typeof body?.max_selections === 'number' && Number.isFinite(body.max_selections)
      ? Math.max(0, Math.round(body.max_selections))
      : null
  const options = body?.options ? parseOptionsJson(body.options) : []
  const optionsJson = JSON.stringify(options)

  const db = event.context.cloudflare?.env?.DB as D1Database | undefined
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database not configured' })
  }

  const stmt = db.prepare(
    `INSERT INTO customization_options (product_class_id, product_id, label, kind, options_json, max_selections)
     VALUES (?, NULL, ?, ?, ?, ?)
     RETURNING id, product_class_id, product_id, label, kind, options_json, max_selections`,
  )

  const { results } = await stmt
    .bind(productClassId, label, kind, optionsJson, maxSelections)
    .all()

  const row = results?.[0] as Record<string, unknown> | undefined
  if (!row) return {}

  return {
    ...row,
    options: parseOptionsJson(row.options_json),
  }
})
