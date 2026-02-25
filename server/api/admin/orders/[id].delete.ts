import { requireAdmin } from '~/server/utils/adminAuth'

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

  // Delete order items first to avoid foreign key issues
  await db.prepare('DELETE FROM order_items WHERE order_id = ?').bind(id).run()

  const { meta } = await db.prepare('DELETE FROM orders WHERE id = ?').bind(id).run()

  if (meta.changes === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  }

  return { ok: true }
})

