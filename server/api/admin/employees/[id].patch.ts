import { requireAdmin } from '~/server/utils/adminAuth'

interface UpdateEmployeeBody {
  name?: string
  active?: boolean
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

  const body = await readBody<UpdateEmployeeBody>(event)

  const name = body?.name?.trim()
  const hasName = typeof name === 'string' && name.length > 0
  const hasActive = typeof body?.active === 'boolean'

  if (!hasName && !hasActive) {
    return { ok: true }
  }

  const fields: string[] = []
  const values: any[] = []

  if (hasName) {
    fields.push('name = ?')
    values.push(name)
  }

  if (hasActive) {
    fields.push('active = ?')
    values.push(body!.active ? 1 : 0)
  }

  fields.push("updated_at = datetime('now')")

  const sql = `UPDATE employees SET ${fields.join(', ')} WHERE id = ? RETURNING id, name, active`
  values.push(id)

  const { results } = await db.prepare(sql).bind(...values).all()

  if (!results || !results[0]) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  return results[0]
})

