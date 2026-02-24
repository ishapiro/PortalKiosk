import { requireAdmin } from '~/server/utils/adminAuth'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const db = event.context.cloudflare?.env?.DB as D1Database | undefined
  if (!db) {
    return []
  }

  const { results } = await db
    .prepare('SELECT id, name, active FROM employees ORDER BY name ASC')
    .all()

  return results ?? []
})

