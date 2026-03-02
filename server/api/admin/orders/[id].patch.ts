import { requireAdmin } from '~/server/utils/adminAuth'
import { sendOrderReadyEmail } from '~/server/utils/orderEmails'

interface AdminUpdateOrderBody {
  action?: 'unassign'
  status?: string
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

  const body = await readBody<AdminUpdateOrderBody>(event)
  const action = body?.action
  const nextStatus = body?.status?.trim()

  if (!action && !nextStatus) {
    throw createError({ statusCode: 400, statusMessage: 'No update specified' })
  }

  const current = await db
    .prepare('SELECT status FROM orders WHERE id = ?')
    .bind(id)
    .first<{ status: string }>()

  if (!current) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  }

  let sql: string
  const params: any[] = []

  if (nextStatus) {
    // Direct status change from admin: set status and clear assignment
    sql =
      "UPDATE orders SET status = ?, preparing_employee_id = NULL, updated_at = datetime('now') WHERE id = ? RETURNING id, order_number, customer_name, customer_email, status, created_at, delivered_at"
    params.push(nextStatus, id)
  } else if (action === 'unassign') {
    // Only clear assignment; if currently preparing, also revert to new
    sql =
      "UPDATE orders SET preparing_employee_id = NULL, updated_at = datetime('now') WHERE id = ? RETURNING id, order_number, customer_name, customer_email, status, created_at, delivered_at"
    params.push(id)

    if (current.status === 'preparing') {
      sql =
        "UPDATE orders SET status = 'new', preparing_employee_id = NULL, updated_at = datetime('now') WHERE id = ? RETURNING id, order_number, customer_name, customer_email, status, created_at, delivered_at"
    }
  } else {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported action' })
  }

  const { results } = await db.prepare(sql).bind(...params).all()
  const row =
    (results as {
      id: number
      order_number: number | null
      customer_name: string
      customer_email?: string | null
      status: string
      created_at: string
      delivered_at: string | null
    }[])?.[0]

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found after update' })
  }

  // If this admin action changes the order into "ready" from a non-ready state, send the ready email.
  if (nextStatus === 'ready' && current.status !== 'ready' && row.customer_email) {
    const env = event.context.cloudflare?.env as { RESEND_API_KEY?: string } | undefined
    await sendOrderReadyEmail(env, row.customer_email, row.order_number ?? null, row.customer_name)
  }

  return row
})

