# Portal Kiosk — Design & Implementation Plan

Unified design and implementation plan. **Completed** steps are marked so you can see progress; remaining phases are for implementing and manually testing one at a time.

---

## Part A — Design

### A.1 Product model

- **Level 1 — Top categories:** **Parfait** and **Beverage**. Each customer can order **one parfait and one beverage** (one of each; both, or just one).
- **Level 2 — Primary item:** Under Parfait: e.g. “Parfait”; under Beverage: “Lemonade”, “Iced tea”, “Water with mint/strawberry”, “Water with lemon”, etc.
- **Level 3 — Customizations (by product class):**
  - **Parfait:** **Toppings** — multi, choose up to 3 (e.g. Dubai chocolate with kadaif, strawberries, granola, Oreo, peanut butter, silan, apples, bananas, M&Ms).
  - **Beverage:** Optional modifiers (e.g. sugar, ice). All products in that class share the same customization options.

**Rules:**  
- One parfait and one beverage per customer (one of each; can order both or just one).  
- **One order per name:** Order is tied to a customer name; that name may have only one order at a time until it is delivered (or cancelled). UI collects name before placing order.

### A.2 Database (target shape)

| Table | Role |
|-------|------|
| `product_classes` | **Parfait**, **Beverage**. `sort_order` for menu order. |
| `products` | Primary items per class. Parfait (one or more); Beverage: Lemonade, Iced tea, etc. |
| `customization_options` | One group per product class. Parfait → **Toppings** (multi, max 3); Beverage → e.g. Sugar. `product_class_id` only; `product_id` null. |
| `orders` | One per customer order. Needs `customer_name`, `order_number` (unique), `status` (`new` → `preparing` → `ready` → `delivered`), optional `delivered_at`. |
| `order_items` | One row per item. `customizations_json` e.g. `{"Toppings":["A","B","C"]}` or `{"Sugar":"Yes"}`. |
| `stations`, `station_product_classes` | Which stations see which product classes (for future bar/kitchen split). |

**Schema changes still needed (migration):**  
- `customization_options`: add `max_selections INTEGER` (nullable).  
- `orders`: add `customer_name TEXT NOT NULL`, `order_number` (unique), optionally `delivered_at TEXT`.

---

## Part B — Completed steps

Use this checklist to see what’s done; implement and test remaining phases in order.

### Foundation (done)

- [x] **Project setup** — Nuxt 3, Tailwind, Cloudflare (Nitro preset, wrangler), D1 binding.
- [x] **Initial migration** — `0000_initial.sql`: `product_classes`, `products`, `customization_options`, `stations`, `station_product_classes`, `orders`, `order_items`. (Orders table does not yet have `customer_name` or `order_number`.)
- [x] **Public read APIs** — `GET /api/product-classes`, `GET /api/products` (read from D1).
- [x] **Auth** — `POST /api/auth/check` (admin/station password); composables `useAdminAuth`, `useStationAuth` (localStorage).
- [x] **Layouts** — `default` (admin/station), `kiosk` (customer); Brody logo, brand colors.
- [x] **Pages (shells)** — `pages/index.vue` (customer placeholder), `pages/admin/index.vue` (password gate only), `pages/station/index.vue` (password gate only).
- [x] **Config** — `wrangler.toml` (D1 binding, vars for passwords); `nuxt.config.ts` (runtimeConfig for admin/station passwords).

### Not yet done

- [ ] Schema migration for `customer_name`, `order_number`, `delivered_at`, `max_selections`.
- [ ] Admin APIs (product-classes, products, customization-options) and admin UI.
- [ ] Menu API and customer menu/cart flow.
- [ ] Place-order API and one-order-per-name check.
- [ ] Station queue and status updates (preparing/ready).
- [ ] Delivery flow (mark delivered).
- [ ] Polish (hide admin/station from kiosk, validation, UX).

---

## Part C — Phased implementation (remaining)

Implement each phase, then **manually test** before moving on.

---

### Phase 1 — Schema and admin: product classes  
**Status:** Not started

**Goal:** DB has new columns; admin can list and create/edit product classes (Parfait, Beverage).

1. Add migration (e.g. `0001_customizations_and_orders.sql`): `customer_name`, `order_number` (unique), optional `delivered_at` on `orders`; `max_selections` on `customization_options`.
2. API: `GET /api/admin/product-classes`, `POST /api/admin/product-classes`, `PATCH /api/admin/product-classes/:id`. Protect with admin auth (e.g. token/header after password check).
3. Admin UI: Section for product classes — list, “Add class” (name, sort_order), edit. No delete for v1.

**Test:** Add **Parfait** and **Beverage**, edit sort order, refresh and confirm persistence.

---

### Phase 2 — Admin: products  
**Status:** Not started

**Goal:** Admin can add and edit products under Parfait or Beverage.

1. API: `GET /api/admin/products` (by `product_class_id`), `POST /api/admin/products`, `PATCH /api/admin/products/:id`. Admin auth.
2. Admin UI: Choose class (Parfait or Beverage), list products, “Add product” (name, description, price_cents, sort_order), edit.

**Test:** Add “Parfait” under Parfait; under Beverage add Lemonade, Iced tea, Water with mint/strawberry, Water with lemon. Confirm list and persistence.

---

### Phase 3 — Admin: customization options (by product class)  
**Status:** Not started

**Goal:** Admin defines customizations per product class. Parfait → Toppings; Beverage → e.g. Sugar.

1. Store options in `customization_options.options_json` (array of strings). One row per group; `product_class_id` set, `product_id` null. Parfait: “Toppings” (multi, max 3); Beverage: “Sugar” (optional).
2. API: `GET /api/admin/customization-options` (by `product_class_id`), `POST`, `PATCH`. Admin auth.
3. Admin UI: Select product class (Parfait or Beverage), list groups, “Add customization” (label, kind, max_selections, options list). Edit/delete as needed.

**Test:** Parfait class: add Toppings (multi, max 3, full option list). Beverage class: add Sugar (optional). Confirm they load and are shared by all products in that class.

---

### Phase 4 — Public menu and customer cart (no submit)  
**Status:** Not started

**Goal:** Customer sees Parfait and Beverage; can build cart (one parfait + one beverage + customizations). No “Place order” yet.

1. API: `GET /api/menu` — product classes with `customizations` and `products`. No auth. Each product inherits its class’s customizations.
2. Customer UI (kiosk layout): Home shows **Parfait** and **Beverage**; tap category → products; tap product → show class customizations (Toppings up to 3, or beverage modifiers); add to cart; cart summary (no submit).

**Test:** Select Parfait + 3 toppings, Lemonade + sugar; confirm cart. Refresh → cart empty.

---

### Phase 5 — Place order and order number  
**Status:** Not started

**Goal:** Customer submits order with name; order stored with order number; one order per name enforced.

1. API: `POST /api/orders` — body: `{ customer_name, items: [ { product_id, product_class_id, quantity, customizations } ] }`. Require non-empty `customer_name`. Validate at most one parfait and one beverage. **One order per name:** reject if name already has an order not `delivered`/`cancelled`. Generate `order_number`, insert `orders` + `order_items`, return `{ order_id, order_number }`.
2. Customer UI: Cart asks “Your name”, then “Place order”. Success → show order number; on “already have an order” show message, keep name.

**Test:** Place order; check DB; try same name again → rejected; after marking first delivered, same name can order again.

---

### Phase 6 — Station: queue and preparing/ready  
**Status:** Not started

**Goal:** Station sees queue; can mark order “preparing” then “ready”.

1. API: `GET /api/station/orders` (new/preparing/ready; order_number, customer_name, items). `PATCH /api/station/orders/:id` (status: preparing | ready). Station auth.
2. Station UI: List orders (new first); tap for detail (order number, name, items, customizations); “Start” → preparing, “Mark ready” → ready.

**Test:** Place order from kiosk; station sees it; mark preparing then ready; confirm in DB.

---

### Phase 7 — Delivery: mark delivered  
**Status:** Not started

**Goal:** Delivery view shows ready orders; staff marks order delivered.

1. API: `GET /api/station/orders?status=ready` (or `/api/delivery/orders`). `PATCH` order: `status: 'delivered'`, set `delivered_at`.
2. UI: “Ready for delivery” list; tap order → “Mark delivered”. Optional lookup by order number.

**Test:** Mark order ready; in delivery view mark delivered; confirm `status` and `delivered_at` in DB.

---

### Phase 8 — Polish  
**Status:** Not started

**Goal:** Production-ready behavior and UX.

- Hide Admin/Station links on kiosk home (or long-press/dev only).
- Confirmation: large, copy-friendly order number; optional “Show my order” by number.
- Validation: enforce max one parfait, max one beverage; customization rules (e.g. max 3 toppings) in API.
- Optional: filter station queue by `station_product_classes` (bar vs kitchen).

---

## Part D — Reference

### File/structure

- **Migrations:** `migrations/0000_initial.sql` (done), `migrations/0001_customizations_and_orders.sql` (Phase 1).
- **Server:**  
  - Existing: `server/api/product-classes/index.get.ts`, `server/api/products/index.get.ts`, `server/api/auth/check.post.ts`.  
  - Add: `server/api/menu/*`, `server/api/orders/*`, `server/api/admin/*` (product-classes, products, customization-options), `server/api/station/orders.*`, `server/utils/auth.ts` (optional).
- **Pages:** `index.vue` (customer menu + cart), `admin/index.vue` (dashboard: classes, products, customizations), `station/index.vue` (queue + delivery).
- **Composables:** `useAdminAuth`, `useStationAuth` (done); add `useMenu()`, `useCart()` for customer flow.

### Auth for admin/station APIs

Current: password check + localStorage. For API protection use either: (A) send password or short-lived token in header each request, or (B) set HTTP-only cookie after login. Option A is enough for manual testing.

---

## Part E — Progress summary

| Phase | Description | Status |
|-------|-------------|--------|
| Foundation | Project, DB schema (initial), read APIs, auth, layouts, page shells | **Done** |
| 1 | Schema migration + admin product classes | Not started |
| 2 | Admin products | Not started |
| 3 | Admin customization options | Not started |
| 4 | Menu API + customer cart (no submit) | Not started |
| 5 | Place order + order number + one per name | Not started |
| 6 | Station queue (preparing/ready) | Not started |
| 7 | Delivery (mark delivered) | Not started |
| 8 | Polish | Not started |

Stop after each phase to manually test before implementing the next.
