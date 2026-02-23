import { requireAdmin } from '~/server/utils/adminAuth'

interface UpdateProductClassBody {
  name?: string
  sort_order?: number
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

  const body = await readBody<UpdateProductClassBody>(event)

  const name = body?.name?.trim()
  const hasName = typeof name === 'string' && name.length > 0
  const hasSortOrder = typeof body?.sort_order === 'number' && Number.isFinite(body.sort_order)

  if (!hasName && !hasSortOrder) {
    // nothing to update
    return { ok: true }
  }

  const fields: string[] = []
  const values: any[] = []

  if (hasName) {
    fields.push('name = ?')
    values.push(name)
  }

  if (hasSortOrder) {
    fields.push('sort_order = ?')
    values.push(Number(body!.sort_order))
  }

  const sql = `UPDATE product_classes SET ${fields.join(', ')}, updated_at = datetime('now') WHERE id = ? RETURNING id, name, sort_order`
  values.push(id)

  const { results } = await db.prepare(sql).bind(...values).all()

  if (!results || !results[0]) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  return results[0]
})

