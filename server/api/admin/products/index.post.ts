import { requireAdmin } from '~/server/utils/adminAuth'

interface CreateProductBody {
  product_class_id: number
  name: string
  description?: string
  price_cents?: number
  sort_order?: number
}

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const body = await readBody<CreateProductBody>(event)
  const productClassId = Number(body?.product_class_id)
  const name = body?.name?.trim()

  if (!Number.isFinite(productClassId)) {
    throw createError({ statusCode: 400, statusMessage: 'product_class_id is required' })
  }
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Name is required' })
  }

  const description = body?.description?.trim() || ''
  const priceCents =
    typeof body?.price_cents === 'number' && Number.isFinite(body.price_cents)
      ? Math.max(0, Math.round(body.price_cents))
      : 0
  const sortOrder =
    typeof body?.sort_order === 'number' && Number.isFinite(body.sort_order)
      ? Math.round(body.sort_order)
      : 0

  const db = event.context.cloudflare?.env?.DB as D1Database | undefined
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database not configured' })
  }

  const stmt = db.prepare(
    `INSERT INTO products (product_class_id, name, description, price_cents, sort_order)
     VALUES (?, ?, ?, ?, ?)
     RETURNING id, product_class_id, name, description, price_cents, sort_order`,
  )

  const { results } = await stmt
    .bind(productClassId, name, description, priceCents, sortOrder)
    .all()

  return results?.[0]
})

