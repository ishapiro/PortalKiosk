import { requireAdmin } from '~/server/utils/adminAuth'

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const db = event.context.cloudflare?.env?.DB as D1Database | undefined
  if (!db) {
    return { orders: [] }
  }

  const ordersResult = await db
    .prepare(
      `SELECT id,
              order_number,
              customer_name,
              status,
              created_at
       FROM orders
       WHERE status IN ('new', 'preparing', 'ready')
       ORDER BY created_at ASC, id ASC`,
    )
    .all()

  const orderRows =
    (ordersResult.results as {
      id: number
      order_number: number | null
      customer_name: string
      status: string
      created_at: string
    }[]) ?? []

  if (orderRows.length === 0) {
    return { orders: [] }
  }

  const orderIds = orderRows.map((o) => o.id)
  const placeholders = orderIds.map(() => '?').join(',')

  const itemsResult = await db
    .prepare(
      `SELECT oi.order_id,
              oi.quantity,
              oi.customizations_json,
              p.name AS product_name
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id IN (${placeholders})
       ORDER BY oi.order_id, oi.id`,
    )
    .bind(...orderIds)
    .all()

  const items =
    (itemsResult.results as {
      order_id: number
      quantity: number
      customizations_json: string | null
      product_name: string | null
    }[]) ?? []

  const itemsByOrderId = new Map<
    number,
    Array<{ product_name: string; quantity: number; customizations: Record<string, string[]> | null }>
  >()

  for (const row of items) {
    let customizations: Record<string, string[]> | null = null
    if (row.customizations_json) {
      try {
        const parsed = JSON.parse(row.customizations_json) as unknown
        if (parsed && typeof parsed === 'object') {
          customizations = parsed as Record<string, string[]>
        }
      } catch {
        customizations = null
      }
    }

    const list = itemsByOrderId.get(row.order_id) ?? []
    list.push({
      product_name: row.product_name ?? 'Item',
      quantity: row.quantity,
      customizations,
    })
    itemsByOrderId.set(row.order_id, list)
  }

  const orders = orderRows.map((o) => ({
    id: o.id,
    order_number: o.order_number,
    customer_name: o.customer_name,
    status: o.status,
    created_at: o.created_at,
    items: itemsByOrderId.get(o.id) ?? [],
  }))

  return { orders }
})

