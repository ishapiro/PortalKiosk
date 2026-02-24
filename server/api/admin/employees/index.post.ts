import { requireAdmin } from '~/server/utils/adminAuth'

interface CreateEmployeeBody {
  name: string
  active?: boolean
}

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const body = await readBody<CreateEmployeeBody>(event)
  const name = body?.name?.trim()
  const active = body?.active !== false

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Name is required' })
  }

  const db = event.context.cloudflare?.env?.DB as D1Database | undefined
  if (!db) {
    throw createError({ statusCode: 500, statusMessage: 'Database not configured' })
  }

  // Ensure unique name
  const existing = await db
    .prepare('SELECT id FROM employees WHERE LOWER(name) = LOWER(?)')
    .bind(name)
    .first<{ id: number }>()

  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Employee with that name already exists' })
  }

  const { results } = await db
    .prepare(
      'INSERT INTO employees (name, active) VALUES (?, ?) RETURNING id, name, active',
    )
    .bind(name, active ? 1 : 0)
    .all()

  return results?.[0]
})

