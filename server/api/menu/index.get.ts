export default defineEventHandler(async (event) => {
  const db = event.context.cloudflare?.env?.DB as D1Database | undefined
  if (!db) {
    return { classes: [] }
  }

  const [classesResult, productsResult, customizationsResult] = await Promise.all([
    db
      .prepare(
        'SELECT id, name, sort_order, kind FROM product_classes ORDER BY sort_order, id',
      )
      .all(),
    db
      .prepare(
        'SELECT id, product_class_id, name, description, price_cents, sort_order FROM products ORDER BY sort_order, id',
      )
      .all(),
    db
      .prepare(
        "SELECT id, product_class_id, label, kind, options_json, max_selections FROM customization_options WHERE product_id IS NULL ORDER BY id",
      )
      .all(),
  ])

  const classRows =
    (classesResult.results as {
      id: number
      name: string
      sort_order: number
      kind: string | null
    }[]) ?? []
  const productRows =
    (productsResult.results as {
      id: number
      product_class_id: number
      name: string
      description: string | null
      price_cents: number
      sort_order: number
    }[]) ?? []
  const customizationRows =
    (customizationsResult.results as {
      id: number
      product_class_id: number
      label: string
      kind: string
      options_json: string | null
      max_selections: number | null
    }[]) ?? []

  const customizationsByClass = new Map<
    number,
    {
      id: number
      label: string
      kind: 'single' | 'multi'
      options: string[]
      max_selections: number | null
    }[]
  >()

  for (const row of customizationRows) {
    let options: string[] = []
    if (typeof row.options_json === 'string') {
      try {
        const parsed = JSON.parse(row.options_json) as unknown
        options = Array.isArray(parsed)
          ? parsed.filter((x): x is string => typeof x === 'string')
          : []
      } catch {
        options = []
      }
    }

    const entry = {
      id: row.id,
      label: row.label,
      kind: row.kind === 'multi' ? 'multi' : ('single' as 'single' | 'multi'),
      options,
      max_selections: row.max_selections,
    }

    const list = customizationsByClass.get(row.product_class_id) ?? []
    list.push(entry)
    customizationsByClass.set(row.product_class_id, list)
  }

  const productsByClass = new Map<
    number,
    {
      id: number
      product_class_id: number
      name: string
      description: string | null
      price_cents: number
      sort_order: number
    }[]
  >()

  for (const p of productRows) {
    const list = productsByClass.get(p.product_class_id) ?? []
    list.push(p)
    productsByClass.set(p.product_class_id, list)
  }

  const classes = classRows.map((cls) => {
    const classCustomizations = customizationsByClass.get(cls.id) ?? []
    const classProducts = (productsByClass.get(cls.id) ?? []).map((p) => ({
      ...p,
      customizations: classCustomizations,
    }))

    return {
      id: cls.id,
      name: cls.name,
      sort_order: cls.sort_order,
      kind: cls.kind || 'other',
      customizations: classCustomizations,
      products: classProducts,
    }
  })

  return { classes }
})

