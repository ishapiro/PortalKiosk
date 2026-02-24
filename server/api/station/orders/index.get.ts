import { requireStation } from '~/server/utils/stationAuth'

const ALLOWED_STATUSES = ['new', 'preparing', 'ready'] as const

type AllowedStatus = (typeof ALLOWED_STATUSES)[number]

export default defineEventHandler(async (event) => {
  requireStation(event)

  const db = event.context.cloudflare?.env?.DB as D1Database | undefined
  if (!db) {
    return { orders: [] }
  }

  const query = getQuery(event)
  const status = typeof query.status === 'string' ? query.status : undefined

  const baseSql = `
    SELECT o.id,
           o.order_number,
           o.customer_name,
           o.status,
           o.created_at,
           o.preparing_employee_id,
           e.name AS preparing_employee_name
    FROM orders o
    LEFT JOIN employees e ON e.id = o.preparing_employee_id
    WHERE o.status IN ('new', 'preparing', 'ready')
    ORDER BY 
      CASE o.status 
        WHEN 'new' THEN 0 
        WHEN 'preparing' THEN 1 
        WHEN 'ready' THEN 2 
        ELSE 3 
      END,
      o.created_at ASC,
      o.id ASC
  `

  let sql = baseSql
  const params: any[] = []

  if (status && (ALLOWED_STATUSES as readonly string[]).includes(status)) {
    sql = `
      SELECT o.id,
             o.order_number,
             o.customer_name,
             o.status,
             o.created_at,
             o.preparing_employee_id,
             e.name AS preparing_employee_name
      FROM orders o
      LEFT JOIN employees e ON e.id = o.preparing_employee_id
      WHERE o.status = ?
      ORDER BY o.created_at ASC, o.id ASC
    `
    params.push(status)
  }

  const ordersResult = params.length
    ? await db.prepare(sql).bind(...params).all()
    : await db.prepare(sql).all()

  const orderRows =
    (ordersResult.results as {
      id: number
      order_number: number | null
      customer_name: string
      status: AllowedStatus
      created_at: string
      preparing_employee_id: number | null
      preparing_employee_name: string | null
    }[]) ?? []

  // Temporary logging to help debug visibility in station view
  // eslint-disable-next-line no-console
  console.log('[station/orders] fetched orders', {
    count: orderRows.length,
    ids: orderRows.map((o) => o.id),
    statuses: Array.from(new Set(orderRows.map((o) => o.status))),
  })

  if (orderRows.length === 0) {
    return { orders: [] }
  }

  const orderIds = orderRows.map((o) => o.id)
  const placeholders = orderIds.map(() => '?').join(',')

  const itemsResult = await db
    .prepare(
      `SELECT oi.order_id,
              oi.product_id,
              oi.quantity,
              oi.customizations_json,
              p.name AS product_name,
              pc.name AS product_class_name
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       LEFT JOIN product_classes pc ON pc.id = oi.product_class_id
       WHERE oi.order_id IN (${placeholders})
       ORDER BY oi.order_id, oi.id`,
    )
    .bind(...orderIds)
    .all()

  const items =
    (itemsResult.results as {
      order_id: number
      product_id: number
      quantity: number
      customizations_json: string | null
      product_name: string | null
      product_class_name: string | null
    }[]) ?? []

  const itemsByOrderId = new Map<
    number,
    Array<{
      product_name: string
      product_class_name: string
      quantity: number
      customizations: Record<string, string[]> | null
    }>
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
      product_name: row.product_name ?? `Product #${row.product_id}`,
      product_class_name: row.product_class_name ?? 'Item',
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
    preparing_employee_id: o.preparing_employee_id ?? null,
    preparing_employee_name: o.preparing_employee_name ?? null,
    items: itemsByOrderId.get(o.id) ?? [],
  }))

  return { orders }
})

