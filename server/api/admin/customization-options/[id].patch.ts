import { requireAdmin } from '~/server/utils/adminAuth'

interface UpdateCustomizationBody {
  label?: string
  kind?: string
  max_selections?: number | null
  options?: string[] | unknown
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

  const db = event.context.cloudflare?.env?.DB as D1Database | undefined
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database not configured' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const body = await readBody<UpdateCustomizationBody>(event)

  const fields: string[] = []
  const values: unknown[] = []

  if (typeof body?.label === 'string') {
    const label = body.label.trim()
    if (!label) {
      throw createError({ statusCode: 400, statusMessage: 'Label cannot be empty' })
    }
    fields.push('label = ?')
    values.push(label)
  }

  if (body?.kind === 'multi' || body?.kind === 'single') {
    fields.push('kind = ?')
    values.push(body.kind)
  }

  if (body?.max_selections !== undefined) {
    fields.push('max_selections = ?')
    values.push(
      typeof body.max_selections === 'number' && Number.isFinite(body.max_selections)
        ? Math.max(0, Math.round(body.max_selections))
        : null,
    )
  }

  if (body?.options !== undefined) {
    const options = parseOptionsJson(body.options)
    fields.push('options_json = ?')
    values.push(JSON.stringify(options))
  }

  if (!fields.length) {
    return { ok: true }
  }

  const sql = `UPDATE customization_options SET ${fields.join(
    ', ',
  )}, updated_at = datetime('now') WHERE id = ? RETURNING id, product_class_id, product_id, label, kind, options_json, max_selections`
  values.push(id)

  const { results } = await db.prepare(sql).bind(...values).all()

  const row = results?.[0] as Record<string, unknown> | undefined
  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  return {
    ...row,
    options: parseOptionsJson(row.options_json),
  }
})
