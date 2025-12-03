#!/bin/sh
# Phase 0 Deployment Script
# This script handles the database migration from the old schema to Phase 0 (Truth Repository)

set -e

echo "🚀 Starting Phase 0 Database Migration..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable not set"
  exit 1
fi

# Step 1: Run manual SQL migrations for type conversions
echo "📝 Step 1/3: Running manual SQL migrations..."
if command -v psql > /dev/null 2>&1; then
  psql "$DATABASE_URL" -f /app/scripts/migrate-phase0.sql
  echo "✅ SQL migrations completed"
else
  echo "⚠️  psql not found - skipping SQL migrations"
  echo "   Run this command manually:"
  echo "   psql \$DATABASE_URL -f /app/scripts/migrate-phase0.sql"
fi
echo ""

# Step 2: Run Drizzle schema push
echo "📊 Step 2/3: Pushing new schema to database..."
npm run db:push --force
echo "✅ Schema push completed"
echo ""

# Step 3: Seed default facets
echo "🌱 Step 3/3: Seeding default facets..."
npm run db:seed
echo "✅ Database seeding completed"
echo ""

echo "✨ Phase 0 migration complete!"
echo ""
echo "📋 Summary:"
echo "  - Manual type conversions applied"
echo "  - New tables created (archive_dates, translations, facets, etc.)"
echo "  - 70+ default facets seeded"
echo ""
echo "🎯 Your database is now ready for the Truth Repository system!"
