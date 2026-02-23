#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."

# Create local D1 DB and run migrations
echo "Setting up local D1..."
npx wrangler d1 execute portal-kiosk-db --local --file=./migrations/0000_initial.sql 2>/dev/null || true

# Wrangler dev runs build via [build] in wrangler.toml, then serves
npx wrangler dev
