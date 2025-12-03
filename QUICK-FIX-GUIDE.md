# 🚨 Quick Fix: Missing Database Columns

## Problem

You're seeing these errors:
```
Error fetching item: column archiveItems_uploader.preferred_language does not exist
Error uploading file: column "preferred_language" does not exist
```

## Root Cause

Your TrueNAS server is running the new **Phase 0** code, but the database schema hasn't been updated yet to include the new columns.

---

## ✅ Solution: 3 Easy Options

### **Option 1: Run Fix Script from Your Local Machine (Easiest)**

```bash
# Navigate to your project directory
cd /path/to/archive-resurrection

# Run the fix script
./fix-database.sh
```

**Expected output:**
```
🔧 Fixing missing database columns...
📝 Adding missing columns to database...
NOTICE:  Added preferred_language column
NOTICE:  Added is_admin column
NOTICE:  Added sha256_hash column
NOTICE:  Added original_language column
NOTICE:  Added ai_processing_enabled column
NOTICE:  Added ai_processed_at column
NOTICE:  Added is_published column
NOTICE:  Added is_sensitive column
NOTICE:  Added metadata column

All missing columns have been checked and added if necessary!

✅ Database fix complete!
```

---

### **Option 2: Run Directly via psql**

```bash
# Connect to your database
psql -U onatatmaca -h 192.168.0.217 -p 9432 -d archive_resurrection

# Once connected, run this command
\i scripts/fix-missing-columns.sql

# Exit
\q
```

---

### **Option 3: From TrueNAS Container Shell**

1. Access TrueNAS Web UI
2. Go to **Apps** → **archive-resurrection** → **Shell**
3. Run these commands:

```bash
# Set the database URL
export DATABASE_URL="postgresql://onatatmaca:M6r6T91373!@192.168.0.217:9432/archive_resurrection"

# Run the fix using psql
psql "$DATABASE_URL" -f /app/scripts/fix-missing-columns.sql
```

---

## 🧪 Verify the Fix

After running any of the above options, test your application:

1. **Open your Archive Resurrection app**: http://192.168.0.217.nip.io:9002
2. **Try uploading a document**
3. **Try browsing items**

Both should work without errors now!

---

## 🔍 What This Fix Does

The script adds these **Phase 0** columns:

### To `user` table:
- ✅ `preferred_language` (text, default: 'en')
- ✅ `is_admin` (boolean, default: false)

### To `archive_items` table:
- ✅ `sha256_hash` (text) - File integrity fingerprint
- ✅ `original_language` (text) - Document language
- ✅ `ai_processing_enabled` (boolean, default: true)
- ✅ `ai_processed_at` (timestamp)
- ✅ `is_published` (boolean, default: false)
- ✅ `is_sensitive` (boolean, default: false)
- ✅ `metadata` (jsonb) - Flexible metadata storage

All additions are **non-destructive** - the script checks if columns already exist before adding them.

---

## 🚀 Full Phase 0 Migration (Optional)

If you want to complete the **full Phase 0 migration** (including new tables for translations, facets, etc.), run:

```bash
# From the container shell
npm run db:migrate
```

This will:
1. Add all missing columns (same as the quick fix)
2. Create new tables: `archive_dates`, `translations`, `facets`, etc.
3. Seed 70+ default historical facets

---

## 📞 Still Having Issues?

If you still see errors after running the fix:

1. **Check if the columns were added:**
   ```bash
   psql -U onatatmaca -h 192.168.0.217 -p 9432 -d archive_resurrection -c "\d user"
   ```
   You should see `preferred_language` in the column list.

2. **Restart your container:**
   - TrueNAS UI → Apps → archive-resurrection → Stop → Start

3. **Check container logs:**
   - TrueNAS UI → Apps → archive-resurrection → Logs

---

**Last Updated:** December 3, 2025
