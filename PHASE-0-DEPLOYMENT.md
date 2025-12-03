# Phase 0 Deployment Guide

This guide covers deploying the **Phase 0: Truth Repository Architecture** to production.

## 🎯 What Phase 0 Includes

- **Fuzzy Date System**: Handle exact dates and ambiguous periods
- **Translation Layer**: Multi-language support with moderation
- **Hybrid Taxonomy**: Hard Facets (admin-controlled) + Soft Tags (user-generated)
- **Data Integrity**: SHA-256 file hashing
- **AI Cost Controls**: Toggle AI processing per upload

## 📋 Pre-Deployment Checklist

### 1. Pull Latest Code

```bash
git fetch origin
git checkout claude/review-master-roadmap-01T3PNoUxSCRYUDDynRDsoLB
git pull
```

### 2. Rebuild Docker Image

```bash
# Clean build with all Phase 0 changes
docker build --no-cache -t onatatmaca/archive-resurrection:latest .

# Push to Docker Hub
docker push onatatmaca/archive-resurrection:latest
```

### 3. Update TrueNAS Container

In TrueNAS UI:
1. **Stop** the running container: Apps → archive-resurrection → Stop
2. **Edit** the app: Apps → archive-resurrection → Edit
3. Set **Image Pull Policy** to "Always pull image"
4. **Save** and **Start** the container

## 🔧 Database Migration

⚠️ **IMPORTANT**: Phase 0 requires database schema changes. Follow these steps carefully.

### Option A: Automated Migration (Recommended)

Access the container shell in TrueNAS and run:

```bash
npm run db:migrate
```

This single command will:
1. ✅ Convert `usage_count` from text → integer
2. ✅ Remove `wiki_content` column
3. ✅ Create new tables (archive_dates, translations, facets, etc.)
4. ✅ Seed 70+ default historical facets

Expected output:
```
🚀 Starting Phase 0 Database Migration...

📝 Step 1/3: Running manual SQL migrations...
✅ SQL migrations completed

📊 Step 2/3: Pushing new schema to database...
✅ Schema push completed

🌱 Step 3/3: Seeding default facets...
✅ Successfully seeded 70 facets!
📊 Facet Categories:
   - era: 10 options
   - location: 9 options
   - subject: 10 options
   - source_type: 10 options (10 required)
   - language: 13 options
   - sensitivity: 4 options (4 required)

✨ Phase 0 migration complete!
```

### Option B: Manual Migration

If the automated script fails, run these steps individually:

#### Step 1: Manual SQL Migrations

```bash
# Run SQL migrations for type conversions
psql "$DATABASE_URL" -f /app/scripts/migrate-phase0.sql
```

#### Step 2: Push New Schema

```bash
# Push new schema (may show warnings, that's normal)
npm run db:push
```

When prompted:
- **"Add sha256_hash unique constraint?"** → Type `yes` (database is empty)
- **"Change usage_count type?"** → Should be skipped (already done in Step 1)
- **"Delete wiki_content column?"** → Type `yes` (wiki system removed)

#### Step 3: Seed Facets

```bash
npm run db:seed
```

## 🧪 Verification

After migration, verify everything works:

### 1. Check Database Tables

```bash
psql "$DATABASE_URL" -c "\dt"
```

You should see these new tables:
- `archive_dates`
- `translations`
- `translation_votes`
- `facets`
- `item_facets`

### 2. Check Facets Seeded

```bash
psql "$DATABASE_URL" -c "SELECT category, COUNT(*) FROM facets GROUP BY category;"
```

Expected output:
```
   category    | count
---------------+-------
 era           |    10
 language      |    13
 location      |     9
 sensitivity   |     4
 source_type   |    10
 subject       |    10
```

### 3. Test Upload

1. Visit your site: `http://your-truenas-ip:30000`
2. Go to `/upload`
3. Upload a test file
4. Check that it processes without errors

## 🚨 Troubleshooting

### Error: "psql: command not found"

The Docker image includes `postgresql-client`. If you see this error, rebuild the image:

```bash
docker build --no-cache -t onatatmaca/archive-resurrection:latest .
docker push onatatmaca/archive-resurrection:latest
```

### Error: "usage_count cannot be cast automatically"

This means Step 1 (SQL migrations) didn't run. Manually run:

```bash
psql "$DATABASE_URL" -c "ALTER TABLE tags ALTER COLUMN usage_count TYPE integer USING CASE WHEN usage_count ~ '^[0-9]+$' THEN usage_count::integer ELSE 0 END;"
```

Then retry `npm run db:push`.

### Error: "scripts/seed-facets.ts not found"

Rebuild the Docker image - the scripts directory wasn't copied. This is fixed in the latest Dockerfile.

### Migration Completed But No Facets

If the seed script didn't run, manually run:

```bash
npm run db:seed
```

## 📊 Database Backup (Before Migration)

**Recommended**: Backup your database before running migrations:

```bash
# Backup current database
pg_dump "$DATABASE_URL" > backup-before-phase0.sql

# To restore if needed:
# psql "$DATABASE_URL" < backup-before-phase0.sql
```

## 🎯 Next Steps

After Phase 0 is deployed:

- ✅ **Phase 1**: Ingestion Engine (AI-powered uploads)
- ✅ **Phase 2**: Universal Viewer (split-pane translation interface)
- ✅ **Phase 3**: Time Stream (vertical timeline visualization)
- ✅ **Phase 4**: Admin Panel (moderation queue)
- ✅ **Phase 5**: RAG (semantic search)

## 📝 Breaking Changes

Phase 0 includes these breaking changes:

- ✅ **Wiki system removed** (no more wiki pages)
- ✅ **Upload API changed** (new facet fields required)
- ✅ **Tag system changed** (usageCount is now integer)
- ✅ **New required fields** (sha256_hash, aiProcessingEnabled)

Existing uploaded files will continue to work, but you'll need to update any custom integrations.

## ✅ Success Criteria

Phase 0 deployment is successful when:

1. ✅ Container starts without errors
2. ✅ Database has 6 new tables
3. ✅ 70 facets are seeded
4. ✅ Upload page loads
5. ✅ Test file uploads successfully

---

**Need help?** Check the main [ROADMAP.md](./ROADMAP.md) or [PHASE-0-COMPLETE.md](./PHASE-0-COMPLETE.md) for technical details.
