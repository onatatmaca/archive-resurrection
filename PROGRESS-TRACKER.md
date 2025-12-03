# 🚀 Archive Resurrection - Master Progress Tracker

> # ⚠️ CRITICAL INSTRUCTIONS FOR ALL AI ASSISTANTS ⚠️
>
> ## THIS IS THE ONLY DOCUMENTATION FILE YOU SHOULD UPDATE
>
> **DO NOT CREATE NEW .md FILES!** All progress, notes, issues, and documentation go here.
>
> ### Before You Start:
> 1. 📖 **READ THIS ENTIRE FILE** - Understand what's been done
> 2. 🔍 **CHECK "Current Status"** - Know where we are
> 3. 📚 **READ SCHEMA-REFERENCE.md** - Know the database structure
> 4. 📋 **READ docs/TRUENAS-DEPLOYMENT.md** - Deployment-specific info
>
> ### When You Complete Work:
> 1. ✅ Update "Current Status" section immediately
> 2. 📝 Document what you did in the appropriate Phase section
> 3. 🔗 Add commit hash and date
> 4. 🚨 Document any breaking changes or issues
> 5. 💾 Commit and push your changes
>
> ### File Structure:
> - **PROGRESS-TRACKER.md** (THIS FILE) - All progress and documentation
> - **SCHEMA-REFERENCE.md** - Database schema quick reference
> - **docs/TRUENAS-DEPLOYMENT.md** - TrueNAS-specific deployment guide
> - **NO OTHER .md FILES ALLOWED!**

---

## 📊 Current Status

**Active Phase:** Database Migration Required
**Issue:** Missing Phase 0 columns in production database
**Last Updated:** December 3, 2025
**Current Branch:** `claude/fix-archive-resurrection-01576oACG6gXHRApQAJvZHAa`
**Latest Commit:** `72f97c1` - Fix: Add database migration script

### 🚨 CURRENT BLOCKER - Database Migration Needed

**Problem:** TrueNAS server is running Phase 0 code but database schema hasn't been updated.

**Errors:**
```
Error fetching item: column archiveItems_uploader.preferred_language does not exist
Error uploading file: column "preferred_language" does not exist
```

**Root Cause:** The following Phase 0 columns are missing from production database:

**Missing in `user` table:**
- `preferred_language` (text, default 'en')
- `is_admin` (boolean, default false)

**Missing in `archive_items` table:**
- `sha256_hash` (text) - File integrity
- `original_language` (text) - Document language
- `ai_processing_enabled` (boolean) - AI toggle
- `ai_processed_at` (timestamp)
- `is_published` (boolean) - Moderation
- `is_sensitive` (boolean) - Content warning
- `metadata` (jsonb) - Flexible storage

**Solution Created:** `fix-database.sh` and `scripts/fix-missing-columns.sql`

**How to Fix (3 Options):**

1. **From Local Machine:**
   ```bash
   ./fix-database.sh
   ```

2. **Direct psql:**
   ```bash
   psql -U onatatmaca -h 192.168.0.217 -p 9432 -d archive_resurrection
   \i scripts/fix-missing-columns.sql
   \q
   ```

3. **From TrueNAS Container:**
   ```bash
   export DATABASE_URL="postgresql://onatatmaca:M6r6T91373!@192.168.0.217:9432/archive_resurrection"
   psql "$DATABASE_URL" -f /app/scripts/fix-missing-columns.sql
   ```

**Files Created:**
- `fix-database.sh` - Quick fix script
- `scripts/fix-missing-columns.sql` - Already existed, reused

**Next Steps After Fix:**
1. Verify columns added: `psql ... -c "\d user"`
2. Test file upload
3. Test browsing items
4. Mark this blocker as resolved in this file

---

## 🗂️ Project Overview

**Name:** Archive Resurrection
**Purpose:** AI-powered historical archive and intelligent knowledge retrieval system
**Architecture:** Truth Repository - Immutable, multi-language, AI-enhanced archive

### Technology Stack:
- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Node.js
- **Database:** PostgreSQL 15 with pgvector extension
- **ORM:** Drizzle ORM
- **Auth:** NextAuth.js with Google OAuth
- **Storage:** Local filesystem (TrueNAS) + S3 support
- **AI:** Google Gemini API
- **Deployment:** TrueNAS Scale (Docker containers)

### Database Connection:
- **Host:** 192.168.0.217:9432
- **Database:** archive_resurrection
- **User:** onatatmaca
- **URL:** `postgresql://onatatmaca:M6r6T91373!@192.168.0.217:9432/archive_resurrection`

### Application Access:
- **URL:** http://192.168.0.217.nip.io:9002
- **Why nip.io?** Google OAuth requires domain names, not IP addresses

---

## ✅ Phase 0: Truth Repository Architecture (CODE COMPLETE)

**Status:** ✅ Code Complete | 🚨 Database Migration Pending
**Completion Date:** December 3, 2025
**Branch:** `claude/review-master-roadmap-01T3PNoUxSCRYUDDynRDsoLB`

### What Was Built:

#### 0.1 Fuzzy Date System ✅
- **Table:** `archive_dates`
- **Purpose:** Handle exact dates and ambiguous historical periods
- **Features:**
  - Exact dates: "December 5, 1995"
  - Fuzzy periods: "Late 1990s", "Winter 1942"
  - Fields: `dateStart`, `dateEnd`, `displayDate`, `isApproximate`, `precision`
  - Precision levels: day, month, year, decade, century, era

#### 0.2 Translation Layer ✅
- **Tables:** `translations`, `translation_votes`
- **Purpose:** Multi-language overlay system with moderation
- **Features:**
  - AI vs Human authorship tracking
  - Status workflow: draft → pending → approved → rejected
  - Community voting (upvotes/downvotes)
  - Official translation designation
  - **⚠️ Important:** Field is `translatedContent`, NOT `content`

#### 0.3 Hybrid Taxonomy ✅
- **Tables:** `facets`, `archive_item_facets`
- **Purpose:** Admin-controlled categories + user tags
- **Categories:**
  - Era (10 options)
  - Location (9 options)
  - Subject (10 options)
  - Source Type (10 options) - **REQUIRED**
  - Language (13 options)
  - Sensitivity (4 options) - **REQUIRED**
- **Total:** 70+ curated historical facets
- **Seed Script:** `npm run db:seed`

#### 0.4 Data Integrity & AI Controls ✅
- SHA-256 file hashing for deduplication
- AI processing toggle per upload
- Moderation flags (isPublished, isSensitive)
- Original language tracking

#### 0.5 Cleanup ✅
- Removed wiki system completely
- Updated all references
- Fixed TypeScript errors
- Added .gitattributes for Windows CRLF issues

### Database Schema Changes:

**New Tables:**
1. `archive_dates` - Fuzzy date system
2. `translations` - Multi-language content
3. `translation_votes` - Community voting
4. `facets` - Hard taxonomy categories
5. `archive_item_facets` - Many-to-many relations

**Modified Tables:**
1. `archive_items` - Added 8 new columns (see Current Status blocker)
2. `tags` - Changed `usageCount` text → integer
3. `user` - Added 2 new columns (see Current Status blocker)

**Enums:**
- `itemTypeEnum` - Removed 'wiki_page', added 'audio', 'video'
- `translationStatusEnum` - draft, pending, approved, rejected
- `translationAuthorTypeEnum` - human, ai
- `facetCategoryEnum` - 6 categories

### Deployment Scripts:

1. **deploy-phase0.sh** - Full Phase 0 migration
   - Runs SQL migrations
   - Pushes schema
   - Seeds facets
   - Command: `npm run db:migrate`

2. **fix-missing-columns.sql** - Add missing columns only
   - Safe, idempotent
   - Checks before adding
   - Command: `psql $DATABASE_URL -f scripts/fix-missing-columns.sql`

3. **seed-facets.ts** - Seed 70+ default facets
   - Command: `npm run db:seed`

---

## 🚧 Phase 1: Ingestion Engine (50% COMPLETE)

**Status:** Partially Complete
**Started:** December 3, 2025

### Completed:

#### 1.1 One-Shot AI Pipeline ✅
- **Commit:** `5a35e23`
- **File:** `src/app/api/upload/route.ts`
- **Features:**
  - Gemini 1.5 Pro multimodal integration
  - OCR from images (Gemini Vision)
  - Auto-tag generation (3-5 tags)
  - Auto-facet suggestions (all 6 categories)
  - Auto-translation (if non-English)
  - SHA-256 hash calculation
  - Duplicate detection
  - Fuzzy date support
  - Audio/video support (up to 500MB)
  - All AI results stored in metadata (pay once, use forever)

### Remaining:

#### 1.2 Strict Upload UI ⬜
- **File:** `src/app/upload/page.tsx`
- **TODO:**
  - Facet dropdowns (source_type and sensitivity required)
  - Date picker (exact vs period toggle)
  - AI processing toggle with cost estimate
  - SHA-256 client-side verification
  - File integrity display

#### 1.3 Media Processing ⬜
- **File:** `src/lib/utils/media-processor.ts`
- **TODO:**
  - ffmpeg integration
  - Video thumbnail extraction
  - Audio waveform visualization
  - Preview generation
  - Web format conversion

---

## 📋 Phase 2-5: Future Phases (PLANNED)

### Phase 2: Universal Viewer
- Split-pane document viewer
- Translation selector
- Citation generator
- Collaborative translation

### Phase 3: Time Stream
- Vertical timeline visualization
- Fuzzy date rendering
- Event clustering
- Dynamic filtering

### Phase 4: Admin Panel
- Moderation queue
- Translation diff viewer
- Taxonomy manager

### Phase 5: RAG & Search
- Vector embedding search
- Cross-lingual search
- RAG-powered Q&A

---

## 🔧 Common Issues & Solutions

### Issue 1: Missing Database Columns
**Symptoms:** "column preferred_language does not exist"
**Cause:** Database not migrated to Phase 0 schema
**Fix:** See "Current Status" section above

### Issue 2: CRLF Line Ending Issues (Windows)
**Symptoms:** "exec: no such file or directory" for .sh files
**Fix:** .gitattributes forces LF endings
**Prevention:** Always push from Git with proper attributes

### Issue 3: TypeScript usageCount Errors
**Symptoms:** Type 'string' is not assignable to type 'number'
**Cause:** tags.usageCount changed from text to integer
**Fix:** Use numbers, not strings: `usageCount: 1`

### Issue 4: Translation Field Name
**Symptoms:** "'content' does not exist in type"
**Cause:** Field is `translatedContent`, not `content`
**Fix:** Always use `translatedContent` in translations table

### Issue 5: itemFacets Export Error
**Symptoms:** "Module has no exported member 'itemFacets'"
**Cause:** Table is exported as `archiveItemFacets`
**Fix:** Use correct export name

---

## 📝 Development Workflow

### Starting Work:
1. Pull latest from branch
2. Read this file completely
3. Check SCHEMA-REFERENCE.md
4. Understand current blocker

### During Work:
1. Commit frequently with clear messages
2. Update this file as you complete tasks
3. Document breaking changes
4. Test thoroughly

### Before Finishing:
1. Update "Current Status" section
2. Mark completed tasks with ✅
3. Add commit hashes and dates
4. Document any new issues
5. Push all changes

### Git Workflow:
```bash
# Always work on feature branches
git checkout -b claude/feature-name-sessionid

# Commit with descriptive messages
git commit -m "Fix: Description of what you fixed"

# Push with retry logic for network issues
git push -u origin branch-name
```

---

## 📚 Quick Reference

### Database Schema:
- See **SCHEMA-REFERENCE.md** for complete field reference
- Common tables: archiveItems, users, translations, facets, tags

### Key Files:
- `src/lib/db/schema.ts` - Database schema definition
- `src/app/api/upload/route.ts` - Upload endpoint (Phase 1.1)
- `src/app/api/items/[id]/route.ts` - Item CRUD
- `scripts/fix-missing-columns.sql` - Database fix script
- `scripts/seed-facets.ts` - Facet seeding

### Scripts:
- `npm run db:push` - Push schema to database
- `npm run db:seed` - Seed facets
- `npm run db:migrate` - Full Phase 0 migration
- `npm run db:studio` - Open Drizzle Studio
- `./fix-database.sh` - Quick column fix

### Deployment:
- See **docs/TRUENAS-DEPLOYMENT.md** for TrueNAS-specific guide
- Docker image: onatatmaca/archive-resurrection:latest
- Always rebuild image after schema changes

---

## 🎯 Next Immediate Steps

1. **URGENT:** Fix missing database columns (see Current Status)
2. **After Fix:** Test upload and browse functionality
3. **Then:** Continue Phase 1.2 (Strict Upload UI)
4. **Then:** Complete Phase 1.3 (Media Processing)

---

## 📊 Statistics

**Total Phases:** 5 (0-4)
**Phases Complete:** 1 (Phase 0)
**Current Phase:** 1 (50% complete)
**Total Commits:** 40+
**Database Tables:** 12
**Default Facets:** 70+

---

**Last Updated:** December 3, 2025 by Claude
**Current Session:** Database Migration Fix
**Next Session:** Continue after database is fixed
