import { requireAdmin } from '~/server/utils/adminAuth'

interface CreateProductClassBody {
  name: string
  sort_order?: number
}

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const body = await readBody<CreateProductClassBody>(event)
  const name = body?.name?.trim()
  const sortOrder = Number.isFinite(body?.sort_order as number)
    ? Number(body.sort_order)
    : 0

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Name is required' })
  }

  const db = event.context.cloudflare?.env?.DB as D1Database | undefined
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database not configured' })
  }

  const stmt = db.prepare(
    'INSERT INTO product_classes (name, sort_order) VALUES (?, ?) RETURNING id, name, sort_order',
  )
  const { results } = await stmt.bind(name, sortOrder).all()

  return results?.[0]
})

