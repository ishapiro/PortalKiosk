interface OrderItemBody {
  product_id: number
  product_class_id: number
  quantity?: number
  customizations?: Record<string, string[]>
}

interface CreateOrderBody {
  customer_name: string
  customer_email: string
  items: OrderItemBody[]
}

export default defineEventHandler(async (event: any) => {
  const body = await readBody<CreateOrderBody>(event)
  const customerName = body?.customer_name?.trim()
  const customerEmail = body?.customer_email?.trim()
  const items = body?.items

  if (!customerName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Customer name is required',
    })
  }

  if (!customerEmail) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Customer email is required',
    })
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(customerEmail)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid email address',
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

  // Generate next order_number (unique, monotonic) using system_settings
  const seqKey = 'last_order_number'

  // First, try to atomically increment an existing counter row
  const updatedSeq = await db
    .prepare(
      `UPDATE system_settings
       SET value = CAST(value AS INTEGER) + 1,
           updated_at = datetime('now')
       WHERE key = ?
       RETURNING value`,
    )
    .bind(seqKey)
    .first()

  let orderNumber: number

  if (updatedSeq && updatedSeq.value != null) {
    orderNumber = Number(updatedSeq.value)

    // Safety check: if the sequence row ever got out of sync
    // (e.g. smaller than existing order_number values), bump it forward
    const maxResult = await db
      .prepare('SELECT COALESCE(MAX(order_number), 0) AS max_num FROM orders')
      .first()

    const currentMax = maxResult?.max_num ?? 0
    if (orderNumber <= currentMax || orderNumber <= 1134) {
      const base = Math.max(1134, currentMax)
      orderNumber = base + 1

      await db
        .prepare(
          `UPDATE system_settings
           SET value = ?, updated_at = datetime('now')
           WHERE key = ?`,
        )
        .bind(String(orderNumber), seqKey)
        .run()
    }
  } else {
    // No existing sequence row yet: initialize it based on current max(order_number)
    const maxResult = await db
      .prepare('SELECT COALESCE(MAX(order_number), 0) AS max_num FROM orders')
      .first()

    const base = Math.max(1134, maxResult?.max_num ?? 0)
    orderNumber = base + 1

    await db
      .prepare(
        `INSERT INTO system_settings (key, value, updated_at)
         VALUES (?, ?, datetime('now'))`,
      )
      .bind(seqKey, String(orderNumber))
      .run()
  }

  // Insert order with retry on UNIQUE(order_number) conflicts
  let orderId: number | undefined

  for (let attempt = 0; attempt < 5; attempt++) {
    // Debug: log the order number we're trying
    // eslint-disable-next-line no-console
    console.log('[orders] attempting insert with order_number', orderNumber, 'attempt', attempt + 1)

    try {
      const orderInsert = await db
        .prepare(
          `INSERT INTO orders (customer_name, order_number, status) 
           VALUES (?, ?, 'new')`,
        )
        .bind(customerName, orderNumber)
        .run()

      orderId =
        orderInsert.meta?.last_row_id != null
          ? Number(orderInsert.meta.last_row_id)
          : undefined

      if (orderId != null) {
        break
      }
    } catch (e: any) {
      const msg = String(e?.message ?? e) || ''
      if (msg.includes('UNIQUE constraint failed: orders.order_number')) {
        // Collision: bump the sequence forward and try again
        orderNumber += 1
        await db
          .prepare(
            `UPDATE system_settings
             SET value = ?, updated_at = datetime('now')
             WHERE key = ?`,
          )
          .bind(String(orderNumber), seqKey)
          .run()
        continue
      }

      throw e
    }
  }

  if (orderId == null) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create order after retries',
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

  const cfEnv = event.context.cloudflare?.env as { RESEND_API_KEY?: string } | undefined
  const resendApiKey = cfEnv?.RESEND_API_KEY

  if (resendApiKey && customerEmail) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'The Brody Country Club <countryclub@cogitations.com>',
          to: [customerEmail],
          subject: 'Your order from the Brody Country Club',
          html: `<p>Thank you for your order at The Brody Country Club.</p><p>Your order number is <strong>#${orderNumber}</strong>.</p><p>We will email you again when your order is ready for pickup.</p>`,
        }),
      })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[orders] Failed to send confirmation email', err)
    }
  }

  return {
    order_id: orderId,
    order_number: orderNumber,
  }
})
