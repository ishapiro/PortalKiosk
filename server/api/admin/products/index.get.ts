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
    'SELECT id, product_class_id, name, description, price_cents, sort_order FROM products'
  const params: any[] = []

  if (typeof productClassId === 'number' && Number.isFinite(productClassId)) {
    sql += ' WHERE product_class_id = ?'
    params.push(productClassId)
  }

  sql += ' ORDER BY sort_order, id'

  const stmt = db.prepare(sql)
  const { results } = params.length
    ? await stmt.bind(...params).all()
    : await stmt.all()

  return results ?? []
})

