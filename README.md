# PortalKiosk
PortalKiosk is a smart kiosk orchestration system designed to route user selections to targeted remote displays. By mapping specific items to unique destinations, it enables seamless multi-device workflows—perfect for hospitality, logistics, or interactive exhibits.

## Hosting on Cloudflare (Wrangler)

Everything is done via Wrangler; no Dashboard clicks required (except optional custom domain).

1. **Log in** (once):  
   `npx wrangler login`

2. **One-time setup** (creates D1 DB, updates `wrangler.toml`, runs remote migrations):  
   `./scripts/setup-cloudflare.sh`

3. **Set production secrets** (you’ll be prompted for each):  
   `npx wrangler secret put NUXT_ADMIN_PASSWORD`  
   `npx wrangler secret put NUXT_STATION_PASSWORD`

4. **Deploy**:  
   `npm run deploy`

Your app will be live at `https://portal-kiosk.<your-subdomain>.workers.dev`. For a custom domain (e.g. `brodycountryclub.cogitations.com`), add the domain in Cloudflare DNS, then uncomment and set the `routes` block in `wrangler.toml` and redeploy.
