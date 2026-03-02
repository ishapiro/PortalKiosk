import { requireStation } from '~/server/utils/stationAuth'
import { sendOrderReadyEmail } from '~/server/utils/orderEmails'

const ALLOWED_STATUSES = ['new', 'preparing', 'ready', 'delivered'] as const

type AllowedStatus = (typeof ALLOWED_STATUSES)[number]

interface UpdateStationOrderBody {
  status: AllowedStatus
  employee_id?: number
}

export default defineEventHandler(async (event) => {
  requireStation(event)

  const db = event.context.cloudflare?.env?.DB as D1Database | undefined
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database not configured' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const body = await readBody<UpdateStationOrderBody>(event)
  const nextStatus = body?.status
  const employeeId =
    typeof body?.employee_id === 'number' && Number.isFinite(body.employee_id)
      ? Number(body.employee_id)
      : undefined

  if (!nextStatus || !(ALLOWED_STATUSES as readonly string[]).includes(nextStatus)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid status' })
  }

  // Only allow transitions:
  // new -> preparing
  // preparing -> ready
  const current = await db
    .prepare('SELECT status FROM orders WHERE id = ?')
    .bind(id)
    .first<{ status: string }>()

  if (!current) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  }

  const currentStatus = current.status

  let result

  if (currentStatus === 'new' && nextStatus === 'preparing') {
    if (employeeId == null) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Employee is required when starting an order',
      })
    }

    result = await db
      .prepare(
        `UPDATE orders 
         SET status = ?, preparing_employee_id = ?, updated_at = datetime('now') 
         WHERE id = ? 
         RETURNING id, order_number, customer_name, status, created_at`,
      )
      .bind(nextStatus, employeeId, id)
      .all()
  } else if (currentStatus === 'preparing' && nextStatus === 'ready') {
    // Prep finished: mark ready and clear assignment so delivery can pick it up
    result = await db
      .prepare(
        `UPDATE orders 
         SET status = 'ready', preparing_employee_id = NULL, updated_at = datetime('now') 
         WHERE id = ? 
         RETURNING id, order_number, customer_name, customer_email, status, created_at`,
      )
      .bind(id)
      .all()
  } else if (currentStatus === 'ready' && nextStatus === 'ready') {
    // Delivery person claims a ready order: assign employee only
    if (employeeId == null) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Employee is required when claiming a ready order',
      })
    }

    result = await db
      .prepare(
        `UPDATE orders 
         SET preparing_employee_id = ?, updated_at = datetime('now') 
         WHERE id = ? 
         RETURNING id, order_number, customer_name, status, created_at`,
      )
      .bind(employeeId, id)
      .all()
  } else if (currentStatus === 'ready' && nextStatus === 'delivered') {
    // Delivery finished
    result = await db
      .prepare(
        `UPDATE orders 
         SET status = 'delivered', preparing_employee_id = NULL, updated_at = datetime('now') 
         WHERE id = ? 
         RETURNING id, order_number, customer_name, status, created_at`,
      )
      .bind(id)
      .all()
  } else {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid status transition',
    })
  }

  const row =
    (result.results as {
      id: number
      order_number: number | null
      customer_name: string
      customer_email?: string | null
      status: AllowedStatus
      created_at: string
    }[])?.[0]

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found after update' })
  }

  // When an order moves into "ready" from "preparing", send the ready-for-pickup email.
  if (currentStatus === 'preparing' && row.status === 'ready' && row.customer_email) {
    const env = event.context.cloudflare?.env as { RESEND_API_KEY?: string } | undefined
    await sendOrderReadyEmail(env, row.customer_email, row.order_number ?? null, row.customer_name)
  }

  return row
})

