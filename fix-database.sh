#!/bin/bash
# Quick fix for missing Phase 0 columns
# Run this script to add all missing database columns

set -e

echo "🔧 Fixing missing database columns..."
echo ""

# Database connection details
DB_USER="onatatmaca"
DB_HOST="192.168.0.217"
DB_PORT="9432"
DB_NAME="archive_resurrection"

# Run the SQL fix script
echo "📝 Adding missing columns to database..."
PGPASSWORD="M6r6T91373!" psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -f scripts/fix-missing-columns.sql

echo ""
echo "✅ Database fix complete!"
echo ""
echo "You can now:"
echo "  1. Try uploading a document again"
echo "  2. Browse your items"
echo ""
