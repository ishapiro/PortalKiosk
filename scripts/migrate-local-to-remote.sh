#!/usr/bin/env bash
# Copy data from local D1 to remote Cloudflare D1.
# Use this after you've been developing locally and want to push your
# product classes, products, customizations, orders, etc. to production.
#
# Prerequisites:
#   - Local DB has data (run the app locally and add data via Admin, or restore a backup).
#   - Remote DB already has schema (run ./scripts/run-migrations.sh --remote first).
#
# Usage:
#   ./scripts/migrate-local-to-remote.sh
#
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DB_NAME="portal-kiosk-db"
TMP_EXPORT="$ROOT_DIR/.tmp-local-d1-export.sql"
TMP_DATA="$ROOT_DIR/.tmp-data-only.sql"

cd "$ROOT_DIR"

echo "=== Migrate local D1 data to remote ==="
echo ""

echo "1. Exporting local database..."
npx wrangler d1 export "$DB_NAME" --local --output "$TMP_EXPORT"

if [[ ! -s "$TMP_EXPORT" ]]; then
  echo "   Export is empty. Ensure local DB has schema (npm run migrate:local) and optionally add data via Admin."
  exit 1
fi

echo "2. Extracting data (INSERT statements)..."
# Extract INSERT statements (may be multi-line). Use OR REPLACE so re-runs don't fail on duplicates.
# awk: from "INSERT INTO" through ";" inclusive; sed: convert to INSERT OR REPLACE
awk '/^INSERT INTO /{p=1} p{print; if(/;$/) p=0}' "$TMP_EXPORT" | sed 's/^INSERT INTO /INSERT OR REPLACE INTO /' > "$TMP_DATA" || true

if [[ ! -s "$TMP_DATA" ]]; then
  echo "   No INSERT statements in export — local DB has no data to migrate."
  rm -f "$TMP_EXPORT" "$TMP_DATA"
  exit 0
fi

echo "   $(wc -l < "$TMP_DATA") row(s) to push."
echo ""
echo "3. Applying data to remote database..."
npx wrangler d1 execute "$DB_NAME" --remote --file="$TMP_DATA" --yes

echo ""
echo "4. Cleaning up temp files..."
rm -f "$TMP_EXPORT" "$TMP_DATA"

echo ""
echo "Done. Remote D1 now has the same data as your local export."
