export default defineEventHandler(async (event) => {
  const db = event.context.cloudflare?.env?.DB as D1Database | undefined
  if (!db) {
    return []
  }
  const { results } = await db.prepare('SELECT id, product_class_id, name, description, price_cents, sort_order FROM products ORDER BY sort_order, id').all()
  return results
})
