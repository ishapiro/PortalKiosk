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

  const { meta } = await db.prepare('DELETE FROM customization_options WHERE id = ?').bind(id).run()

  if (meta.changes === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  return { ok: true }
})
