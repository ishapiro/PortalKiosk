import { requireAdmin } from '~/server/utils/adminAuth'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const db = event.context.cloudflare?.env?.DB as D1Database | undefined
  if (!db) {
    return []
  }

  const query = getQuery(event)
  const productClassId = query.product_class_id
    ? Number(query.product_class_id)
    : undefined

  let sql =
    'SELECT id, product_class_id, product_id, label, kind, options_json, max_selections FROM customization_options WHERE product_id IS NULL'
  const params: number[] = []

  if (typeof productClassId === 'number' && Number.isFinite(productClassId)) {
    sql += ' AND product_class_id = ?'
    params.push(productClassId)
  }

  sql += ' ORDER BY id'

  const stmt = db.prepare(sql)
  const { results } = params.length
    ? await stmt.bind(...params).all()
    : await stmt.all()

  const rows = (results ?? []) as Array<Record<string, unknown> & { options_json?: string }>
  return rows.map((r) => {
    let options: string[] = []
    if (typeof r.options_json === 'string') {
      try {
        const parsed = JSON.parse(r.options_json) as unknown
        options = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
      } catch {
        // ignore
      }
    }
    const { options_json, ...rest } = r
    return { ...rest, options }
  })
})
