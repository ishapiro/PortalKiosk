# Portal Kiosk — Application & Deployment Documentation

This document describes the capabilities of the Portal Kiosk application and the steps required to deploy it on a **new** Cloudflare account (Workers + D1).

---

## 1. Application Overview

Portal Kiosk is a **restaurant order application** that provides:

- **Customer kiosk** — Place orders (name, email, menu items with customizations).
- **Station view** — Kitchen/bar staff view and claim orders, mark items in progress or ready.
- **Order Status Board** — Admin view to see all orders in columns (Just ordered → In preparation → Ready for pickup/Delivery) and move orders or mark delivered.
- **Admin dashboard** — Configure product classes, products, customizations, employees, system settings, and orders.

The app is a **Nuxt 3** SPA/SSR application deployed as a **Cloudflare Worker** with **Cloudflare D1** (SQLite) as the database. Static assets are served from the Worker’s asset binding.

---

## 2. Capabilities by Area

### 2.1 Customer Kiosk (`/`)

- **Menu**: Product classes and products are loaded from the API; each product can have customization options (e.g. toppings, size).
- **Cart**: One item per product class per order (e.g. one parfait, one beverage). Customer enters **name** and **email** (required).
- **Order submission**: Creates an order with status `new`. Optional: sends a “order placed” confirmation email if `RESEND_API_KEY` is set.
- **Post-order**: Thank-you message and optional link; content is configurable via Admin → System settings (`kiosk_thank_you_html`, `kiosk_thank_you_link_url`, `kiosk_thank_you_link_label`).
- **Duplicate order guard**: One active order per customer name (status not `delivered` or `cancelled`); duplicate submissions are rejected with a clear message.

### 2.2 Station Page (`/station`)

- **Access**: Password-protected (station password). Session is in-memory; reload or closing the tab requires re-entry.
- **Employee selection**: Staff choose their name from a list of employees (managed in Admin). Orders can be assigned to an employee.
- **My current order**: Shows the order the signed-in employee is working on; can mark it “Finished” (preparing → ready, or ready → delivered).
- **Orders we are working on**: List of all orders currently being prepared, with employee names; current user’s order is highlighted.
- **Waiting for packing**: New orders not yet assigned; employee can click “Got it” to assign themselves and move to preparing.
- **Waiting for delivery**: Ready orders not assigned; employee can take one for delivery and then mark delivered.
- **Scrollable lists**: “Waiting for packing” and “Waiting for delivery” columns are scrollable when there are more orders than fit on screen (vertical scroll, touch-friendly).

### 2.3 Order Status Board (`/status`)

- **Access**: Password-protected (admin password). Used for a shared display or admin oversight.
- **Columns**: Three columns — **Just ordered** (new), **Orders in preparation**, **Ready for pickup / Delivery**. Each column shows a count and scrollable list; scrollbars are visible and touch is enabled.
- **Actions**: Move orders between columns (e.g. new → preparing, preparing → ready), move back (e.g. ready → preparing), mark delivered. Optional: resend “ready for pickup” email per order.
- **Order details modal**: Click an order to see full line items and customizations.
- **Live refresh**: Polls the API every 5 seconds to keep the board in sync.
- **Summary bar**: Total orders, New / Preparing / Ready / Total delivered counts and last update time.

### 2.4 Admin Dashboard (`/admin`)

- **Access**: Password-protected (admin password). Session is in-memory.
- **Product classes**: CRUD for categories (e.g. Parfait, Beverage). Each class has name, sort order, and optional “kind” (e.g. main, beverage, other).
- **Products**: CRUD for menu items; each product belongs to a product class and has name, description, price (cents), sort order.
- **Customization options**: Attach to a product or a product class (label, kind e.g. single/multi, options JSON). Used by the kiosk for add-ons (e.g. toppings, size).
- **Employees**: CRUD for staff names; used on the station page for “Who is at this station?” and order assignment.
- **System settings**: Key/value settings used by the app, including:
  - `kiosk_thank_you_html`, `kiosk_thank_you_link_url`, `kiosk_thank_you_link_label` — thank-you page content.
  - `last_order_number` — next visible order number (monotonic).
- **Orders**: List all orders; filter by status; view details; delete or “clean” orders (e.g. bulk delete). Optional: resend ready-for-pickup email when `RESEND_API_KEY` is set.
- **Order status changes**: From admin, orders can be moved through new → preparing → ready → delivered (and back where applicable).

### 2.5 Authentication

- **Roles**: Two roles, each with its own password (no user table):
  - **Admin**: `/admin`, `/status` (status board uses admin password).
  - **Station**: `/station`.
- **Storage**: Passwords are provided via environment:
  - **Local**: `.dev.vars` (used by Wrangler when running `npm run dev`).
  - **Production**: Cloudflare Worker **secrets** (`NUXT_ADMIN_PASSWORD`, `NUXT_STATION_PASSWORD`).
- **Auth check**: `POST /api/auth/check` with `{ role: 'admin' | 'station', password: string }`; returns `{ ok: true }` or `{ ok: false }`. No JWTs; the client stores “authenticated” in memory and sends the password when calling protected APIs (admin/station APIs expect the password in headers as documented in the code).

### 2.6 Email (Optional)

- **Provider**: Resend (`https://api.resend.com/emails`).
- **Secret**: `RESEND_API_KEY` — set as a Worker secret in production or in `.dev.vars` locally. If missing, order-placed and ready-for-pickup emails are skipped (no failure).
- **Flows**: Order placed (confirmation); ready for pickup (triggered when order moves to “ready” or via “Resend ready email” on status board or admin).

---

## 3. Tech Stack & Configuration

| Component        | Technology |
|-----------------|------------|
| Frontend / SSR  | Nuxt 3, Vue 3, TypeScript |
| Styling         | Tailwind CSS (@nuxtjs/tailwindcss) |
| Backend / API   | Nuxt server routes (Nitro) |
| Hosting         | Cloudflare Workers (Nitro preset: `cloudflare_module`) |
| Database        | Cloudflare D1 (SQLite) |
| Node compat     | `nodejs_compat` in Workers for Nuxt compatibility |
| Secrets / vars  | `.dev.vars` (local), Wrangler secrets (production) |

- **Nuxt config**: `nitro.preset = 'cloudflare_module'`, `nitro.cloudflare.nodeCompat = true`. Runtime config reads `NUXT_ADMIN_PASSWORD` and `NUXT_STATION_PASSWORD` from `process.env` (and in production from `event.context.cloudflare.env`).
- **D1**: Binding name `DB` in `wrangler.toml`; all server API routes that need the DB use `event.context.cloudflare?.env?.DB`.
- **Migrations**: SQL files in `/migrations`; applied via `./scripts/run-migrations.sh` (local or `--remote`). A tracking table `schema_migrations` records applied migrations so only pending ones run.

---

## 4. Deploying on a New Cloudflare Instance

These steps assume a **new** Cloudflare account (or a new Worker + D1 setup). If you are reusing an existing repo that already has a `database_id` and `routes` for another zone, you will need to adjust or clear those as described below.

### 4.1 Prerequisites

- **Node.js** (v18+ recommended) and **npm**.
- **Wrangler**: Installed via project devDependencies (`npx wrangler`).
- **jq**: Required for migration tracking. Install e.g. `sudo apt-get install jq` (Linux/WSL) or via Homebrew on macOS.
- **Cloudflare account**: You will log in with `npx wrangler login`.

### 4.2 Prepare the Repository

1. **Clone or copy** the Portal Kiosk repo and install dependencies:
   ```bash
   cd /path/to/PortalKiosk
   npm install
   ```

2. **Local dev vars** (optional, for running locally):
   ```bash
   cp .dev.vars.example .dev.vars
   # Edit .dev.vars and set:
   # NUXT_ADMIN_PASSWORD=your-admin-password
   # NUXT_STATION_PASSWORD=your-station-password
   ```
   Do not commit `.dev.vars`.

### 4.3 Wrangler Configuration for a New Instance

If this is a **new** Cloudflare deployment (new account or new Worker), use a clean `wrangler.toml` so the setup script can create the D1 database and you can add your own routes later.

1. **Edit `wrangler.toml`** so that:
   - The D1 database is either **absent** or uses a **placeholder** that the setup script will replace. For example, you can remove the `[[d1_databases]]` block entirely, or set:
     ```toml
     [[d1_databases]]
     binding = "DB"
     database_name = "portal-kiosk-db"
     database_id = "placeholder-replace-with-real-id"
     ```
   - **Routes**: For a new instance, you typically want only `workers_dev = true` at first (so the app is available at `https://portal-kiosk.<your-subdomain>.workers.dev`). If the current file contains a `routes` block pointing at another zone (e.g. `countryclub.cogitations.com`), **comment it out or remove it** until you are ready to attach a custom domain:
     ```toml
     # routes = [
     #   { pattern = "countryclub.cogitations.com/*", zone_name = "cogitations.com" }
     # ]
     workers_dev = true
     ```
   - **Vars**: Leave `NUXT_ADMIN_PASSWORD` and `NUXT_STATION_PASSWORD` unset in `[vars]`; they will be provided as **secrets** (see below).

2. Keep the rest of the file (e.g. `name`, `main`, `compatibility_date`, `compatibility_flags`, `[assets]`) as-is.

### 4.4 One-Time Cloudflare Setup

1. **Log in to Cloudflare** (once per machine):
   ```bash
   npx wrangler login
   ```

2. **Run the setup script** (creates D1 DB, updates `wrangler.toml` with the new `database_id`, and runs **remote** migrations):
   ```bash
   ./scripts/setup-cloudflare.sh
   ```
   - The script creates a D1 database named `portal-kiosk-db` if `database_id` is missing or is the placeholder.
   - It parses the output of `wrangler d1 create` and writes the new `database_id` into `wrangler.toml`.
   - Then it runs `./scripts/run-migrations.sh --remote` so the production schema is up to date.
   - If the script fails (e.g. database already exists), it will print the wrangler output; you can manually set `database_id` in `wrangler.toml` to the existing database’s ID and run `./scripts/run-migrations.sh --remote` yourself.

### 4.5 Set Production Secrets

Set the two required passwords as Worker **secrets** (you will be prompted to enter each value):

```bash
npx wrangler secret put NUXT_ADMIN_PASSWORD
npx wrangler secret put NUXT_STATION_PASSWORD
```

Optional (for email):

```bash
npx wrangler secret put RESEND_API_KEY
```

### 4.6 Deploy

```bash
npm run deploy
```

This runs `nuxt build` and then `npx wrangler deploy`. The app will be live at:

- **Default**: `https://portal-kiosk.<your-subdomain>.workers.dev`

### 4.7 Custom Domain (Optional)

To serve the app on your own domain (e.g. `countryclub.example.com`):

1. Add the domain in the **Cloudflare Dashboard** (DNS) and ensure it is proxied (orange cloud) if you want traffic to go through Cloudflare.
2. In `wrangler.toml`, add a `routes` block and ensure the zone is the one that contains the domain:
   ```toml
   routes = [
     { pattern = "countryclub.example.com/*", zone_name = "example.com" }
   ]
   ```
3. Redeploy:
   ```bash
   npm run deploy
   ```

The Worker will then respond to requests for that hostname.

### 4.8 Initial Data (Products, Classes, Employees)

The migrations only create **schema** and minimal seed data (e.g. `last_order_number` in `system_settings`). To populate products, product classes, customizations, employees, and system settings:

- **Option A**: Use the **Admin UI** on production: log in at `https://<your-app-url>/admin` and create product classes, products, customizations, employees, and system settings.
- **Option B**: Develop and configure everything **locally**, then push local D1 data to remote:
  1. Run migrations locally (and optionally reset and re-run): `./scripts/run-migrations.sh` or `./scripts/run-migrations.sh --reset-local`.
  2. Start the app locally (`npm run dev`), open `/admin`, and add product classes, products, customizations, employees, and any system settings.
  3. Ensure remote schema is up to date: `./scripts/run-migrations.sh --remote`.
  4. Push local data to remote: `./scripts/migrate-local-to-remote.sh`.
  - This script exports the local D1 database, extracts `INSERT` statements, converts them to `INSERT OR REPLACE`, and runs them against the remote D1. Safe to run multiple times.

---

## 5. Scripts Reference

| Script | Purpose |
|--------|--------|
| `./scripts/setup-cloudflare.sh` | One-time: create D1 DB (if needed), update `wrangler.toml` with `database_id`, run remote migrations. |
| `./scripts/run-migrations.sh` | Run pending D1 migrations (local by default). |
| `./scripts/run-migrations.sh --remote` | Run pending migrations on the remote D1 database. |
| `./scripts/run-migrations.sh --reset-local` | Wipe local D1 state and re-apply all migrations (fixes bad local state). |
| `./scripts/migrate-local-to-remote.sh` | Export local D1, extract INSERTs, apply to remote (for copying menu/employees/settings to production). |
| `./scripts/clean-orders.sh` | (If implemented) utility to clean orders; see script for usage. |

**npm scripts** (from `package.json`):

- `npm run build` — Nuxt build (output to `.output/`).
- `npm run dev` — Run migrations locally, build, then `wrangler dev` (local D1 + Worker).
- `npm run deploy` — Build and deploy to Cloudflare (`wrangler deploy`).
- `npm run migrate:local` — Run pending migrations on local D1.
- `npm run migrate:remote` — Run pending migrations on remote D1.

---

## 6. Summary Checklist for New Cloudflare Deployment

1. Clone repo, `npm install`.
2. (Optional) Copy `.dev.vars.example` to `.dev.vars` and set passwords for local dev.
3. Ensure `wrangler.toml` is set for a **new** instance: no real `database_id` (or placeholder) and no custom `routes` unless you already have a domain.
4. `npx wrangler login`.
5. `./scripts/setup-cloudflare.sh`.
6. `npx wrangler secret put NUXT_ADMIN_PASSWORD` and `npx wrangler secret put NUXT_STATION_PASSWORD` (and optionally `RESEND_API_KEY`).
7. `npm run deploy`.
8. Open `https://portal-kiosk.<subdomain>.workers.dev` (or your custom domain), then `/admin` to configure products, employees, and system settings — or use `./scripts/migrate-local-to-remote.sh` after configuring locally.

After this, the application is fully deployed and ready for use: customers can order at `/`, staff can use `/station`, and admins can use `/admin` and `/status`.
