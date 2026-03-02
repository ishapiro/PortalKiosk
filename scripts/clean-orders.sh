#!/usr/bin/env bash

# Delete ALL orders and ALL related order_items from the local D1 database.
# Intended for development/testing only.

set -e

DB_NAME="portal-kiosk-db"

echo "Deleting all order_items and orders from local D1 database: ${DB_NAME}"

npx wrangler d1 execute "${DB_NAME}" --local --command="DELETE FROM order_items; DELETE FROM orders;"

echo "Done. All orders and order_items have been removed from the local database."

