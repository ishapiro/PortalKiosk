#!/usr/bin/env bash
# One-time Cloudflare hosting setup using wrangler.
# Run from repo root. Requires: wrangler (npm/npx), jq (for migrations).
#
# 1. Log in (if needed):  npx wrangler login
# 2. Run this script:     ./scripts/setup-cloudflare.sh
# 3. Set production secrets (when prompted):
#      npx wrangler secret put NUXT_ADMIN_PASSWORD
#      npx wrangler secret put NUXT_STATION_PASSWORD
# 4. Deploy:               npm run deploy
#
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WRANGLER_TOML="$ROOT_DIR/wrangler.toml"
DB_NAME="portal-kiosk-db"

cd "$ROOT_DIR"

echo "=== Cloudflare setup for portal-kiosk ==="
echo ""

# Create D1 database if we don't already have a real database_id in wrangler.toml
CURRENT_ID=$(grep -E '^database_id\s*=' "$WRANGLER_TOML" | sed -E 's/.*=\s*["]?([^"]+)["]?/\1/' || true)
if [[ -n "$CURRENT_ID" && "$CURRENT_ID" != "placeholder-replace-with-real-id" ]]; then
  echo "D1 database_id already set in wrangler.toml: $CURRENT_ID"
  echo "Skipping D1 create. To recreate, set database_id to placeholder-replace-with-real-id and run again."
else
  echo "Creating D1 database: $DB_NAME"
  OUT=$(npx wrangler d1 create "$DB_NAME" 2>&1) || true
  if echo "$OUT" | grep -q "database_id"; then
    # Parse UUID from snippet: database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    NEW_ID=$(echo "$OUT" | grep -oE 'database_id\s*=\s*"[a-f0-9-]{36}"' | sed -nE 's/.*"([a-f0-9-]{36})".*/\1/p' | head -1)
  fi
  if echo "$OUT" | grep -q "Created database\|Successfully created DB\|Created your new"; then
    if [[ -z "$NEW_ID" ]]; then
      NEW_ID=$(echo "$OUT" | grep -oE '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}' | head -1)
    fi
    if [[ -n "$NEW_ID" ]]; then
      if sed -i.bak "s/database_id = \"placeholder-replace-with-real-id\"/database_id = \"$NEW_ID\"/" "$WRANGLER_TOML" 2>/dev/null; then
        rm -f "$WRANGLER_TOML.bak"
        echo "Updated wrangler.toml with database_id = $NEW_ID"
      else
        # macOS sed
        sed -i '' "s/database_id = \"placeholder-replace-with-real-id\"/database_id = \"$NEW_ID\"/" "$WRANGLER_TOML"
        echo "Updated wrangler.toml with database_id = $NEW_ID"
      fi
    else
      echo "Could not parse database_id from wrangler output. Output:"
      echo "$OUT"
      exit 1
    fi
  else
    echo "D1 create failed or database already exists. Output:"
    echo "$OUT"
    exit 1
  fi
fi

echo ""
echo "Running remote migrations..."
./scripts/run-migrations.sh --remote

echo ""
echo "=== Next steps ==="
echo "1. Set production secrets (you will be prompted for each value):"
echo "   npx wrangler secret put NUXT_ADMIN_PASSWORD"
echo "   npx wrangler secret put NUXT_STATION_PASSWORD"
echo ""
echo "2. Deploy:"
echo "   npm run deploy"
echo ""
echo "3. Your app will be live at: https://portal-kiosk.<your-subdomain>.workers.dev"
echo ""
