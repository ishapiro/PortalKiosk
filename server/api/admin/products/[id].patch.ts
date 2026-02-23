import { requireAdmin } from '~/server/utils/adminAuth'

interface UpdateProductBody {
  name?: string
  description?: string
  price_cents?: number
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

  const body = await readBody<UpdateProductBody>(event)

  const fields: string[] = []
  const values: any[] = []

  if (typeof body?.name === 'string') {
    const name = body.name.trim()
    if (!name) {
      throw createError({ statusCode: 400, statusMessage: 'Name cannot be empty' })
    }
    fields.push('name = ?')
    values.push(name)
  }

  if (typeof body?.description === 'string') {
    fields.push('description = ?')
    values.push(body.description.trim())
  }

  if (typeof body?.price_cents === 'number' && Number.isFinite(body.price_cents)) {
    fields.push('price_cents = ?')
    values.push(Math.max(0, Math.round(body.price_cents)))
  }

  if (typeof body?.sort_order === 'number' && Number.isFinite(body.sort_order)) {
    fields.push('sort_order = ?')
    values.push(Math.round(body.sort_order))
  }

  if (!fields.length) {
    return { ok: true }
  }

  const sql = `UPDATE products SET ${fields.join(
    ', ',
  )}, updated_at = datetime('now') WHERE id = ? RETURNING id, product_class_id, name, description, price_cents, sort_order`
  values.push(id)

  const { results } = await db.prepare(sql).bind(...values).all()

  if (!results || !results[0]) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  return results[0]
})

