import { requireAdmin } from '~/server/utils/adminAuth'
import { sendOrderReadyEmail } from '~/server/utils/orderEmails'

export default defineEventHandler(async (event: any) => {
  requireAdmin(event)

  const db = event.context.cloudflare?.env?.DB as D1Database | undefined
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database not configured' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isFinite(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const row = await db
    .prepare(
      `SELECT order_number, customer_name, customer_email, status
       FROM orders
       WHERE id = ?`,
    )
    .bind(id)
    .first()

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Order not found' })
  }

  const status = (row as any).status as string
  const email = (row as any).customer_email as string | null
  const orderNumber = (row as any).order_number as number | null
  const customerName = (row as any).customer_name as string

  if (status !== 'ready') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Order is not marked as ready for pickup',
    })
  }

  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Order does not have a customer email',
    })
  }

  const env = event.context.cloudflare?.env as { RESEND_API_KEY?: string } | undefined
  await sendOrderReadyEmail(env, email, orderNumber, customerName)

  return { ok: true }
})

