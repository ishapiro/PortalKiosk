import { requireAdmin } from '~/server/utils/adminAuth'

export default defineEventHandler(async (event: any) => {
  requireAdmin(event)

  const db = event.context.cloudflare?.env?.DB as D1Database | undefined
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database not configured' })
  }

  // Delete all order_items before deleting orders to satisfy foreign key constraints.
  await db.prepare('DELETE FROM order_items').run()
  await db.prepare('DELETE FROM orders').run()

  return { ok: true }
})

