import { requireAdmin } from '~/server/utils/adminAuth'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const db = event.context.cloudflare?.env?.DB as D1Database | undefined
  if (!db) {
    return []
  }

  const { results } = await db
    .prepare(
      'SELECT id, name, sort_order, kind FROM product_classes ORDER BY sort_order, id',
    )
    .all()

  return results
})

