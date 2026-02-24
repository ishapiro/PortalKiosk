import { requireAdmin } from '~/server/utils/adminAuth'

const DEFAULT_LIMIT = 25
const MAX_LIMIT = 100

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const db = event.context.cloudflare?.env?.DB as D1Database | undefined
  if (!db) {
    return { orders: [], total: 0, page: 1, limit: DEFAULT_LIMIT }
  }

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(query.limit) || DEFAULT_LIMIT),
  )
  const offset = (page - 1) * limit

  const [countResult, ordersResult] = await Promise.all([
    db.prepare('SELECT COUNT(*) AS total FROM orders').first<{ total: number }>(),
    db
      .prepare(
        `SELECT id, order_number, customer_name, status, created_at, delivered_at 
         FROM orders 
         ORDER BY id DESC 
         LIMIT ? OFFSET ?`,
      )
      .bind(limit, offset)
      .all(),
  ])

  const total = Number(countResult?.total ?? 0)
  const orders = (ordersResult.results ?? []) as Array<{
    id: number
    order_number: number | null
    customer_name: string
    status: string
    created_at: string
    delivered_at: string | null
  }>

  if (orders.length === 0) {
    return { orders: [], total, page, limit }
  }

  const orderIds = orders.map((o) => o.id)
  const placeholders = orderIds.map(() => '?').join(',')
  const itemsResult = await db
    .prepare(
      `SELECT oi.order_id, oi.product_id, oi.quantity, oi.customizations_json, p.name AS product_name
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id IN (${placeholders})
       ORDER BY oi.order_id, oi.id`,
    )
    .bind(...orderIds)
    .all()

  const items = (itemsResult.results ?? []) as Array<{
    order_id: number
    product_id: number
    quantity: number
    customizations_json: string | null
    product_name: string | null
  }>

  const itemsByOrderId = new Map<
    number,
    Array<{ product_name: string; quantity: number; customizations_json: string | null }>
  >()
  for (const row of items) {
    const list = itemsByOrderId.get(row.order_id) ?? []
    list.push({
      product_name: row.product_name ?? `Product #${row.product_id}`,
      quantity: row.quantity,
      customizations_json: row.customizations_json,
    })
    itemsByOrderId.set(row.order_id, list)
  }

  const ordersWithItems = orders.map((o) => ({
    id: o.id,
    order_number: o.order_number,
    customer_name: o.customer_name,
    status: o.status,
    created_at: o.created_at,
    delivered_at: o.delivered_at,
    items: itemsByOrderId.get(o.id) ?? [],
  }))

  return {
    orders: ordersWithItems,
    total,
    page,
    limit,
  }
})
