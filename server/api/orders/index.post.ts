interface OrderItemBody {
  product_id: number
  product_class_id: number
  quantity?: number
  customizations?: Record<string, string[]>
}

interface CreateOrderBody {
  customer_name: string
  items: OrderItemBody[]
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CreateOrderBody>(event)
  const customerName = body?.customer_name?.trim()
  const items = body?.items

  if (!customerName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Customer name is required',
    })
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'At least one item is required',
    })
  }

  // At most one item per product class (one parfait, one beverage)
  const classIds = items.map((i) => i.product_class_id)
  const uniqueClasses = new Set(classIds)
  if (uniqueClasses.size !== items.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Only one item per category (e.g. one parfait, one beverage)',
    })
  }

  const db = event.context.cloudflare?.env?.DB as D1Database | undefined
  if (!db) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Database not configured',
    })
  }

  // One order per name: reject if this name already has an order not delivered/cancelled
  const existing = await db
    .prepare(
      `SELECT id FROM orders 
       WHERE LOWER(TRIM(customer_name)) = LOWER(?) 
       AND status NOT IN ('delivered', 'cancelled')`,
    )
    .bind(customerName)
    .first()

  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'You already have an order in progress. Pick it up or wait until it is delivered.',
    })
  }

  // Generate next order_number (unique)
  const maxResult = await db
    .prepare('SELECT COALESCE(MAX(order_number), 0) AS max_num FROM orders')
    .first<{ max_num: number }>()
  const orderNumber = (maxResult?.max_num ?? 0) + 1

  // Insert order
  const orderInsert = await db
    .prepare(
      `INSERT INTO orders (customer_name, order_number, status) 
       VALUES (?, ?, 'new')`,
    )
    .bind(customerName, orderNumber)
    .run()

  const orderId = orderInsert.meta?.last_row_id != null ? Number(orderInsert.meta.last_row_id) : undefined
  if (orderId == null) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create order',
    })
  }

  // Insert order items
  const itemStmt = db.prepare(
    `INSERT INTO order_items (order_id, product_id, product_class_id, quantity, customizations_json)
     VALUES (?, ?, ?, ?, ?)`,
  )

  for (const item of items) {
    const productId = Number(item.product_id)
    const productClassId = Number(item.product_class_id)
    const quantity = Math.max(1, Math.min(99, Number(item.quantity) || 1))
    const customizationsJson = item.customizations
      ? JSON.stringify(item.customizations)
      : null

    if (!Number.isFinite(productId) || !Number.isFinite(productClassId)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid item (product_id or product_class_id)',
      })
    }

    await itemStmt.bind(orderId, productId, productClassId, quantity, customizationsJson).run()
  }

  return {
    order_id: orderId,
    order_number: orderNumber,
  }
})
