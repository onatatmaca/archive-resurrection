# Deployment Fix Guide

This guide fixes the three main issues preventing Archive Resurrection from deploying:

1. ❌ Database migration error: `enum label "wiki_page" already exists`
2. ❌ Storage permission error: `EACCES: permission denied, mkdir '/app/data/uploads'`
3. ❌ TrueNAS deployment stuck at "deploying"

## Table of Contents

- [Quick Fix (If You Just Want It Working)](#quick-fix-if-you-just-want-it-working)
- [Detailed Fix Steps](#detailed-fix-steps)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

---

## Quick Fix (If You Just Want It Working)

Follow these steps in order:

### Step 1: Fix Database Migration

**Option A: Using the migration fix script (Recommended)**

```bash
# From your development machine or TrueNAS shell
npm install          # Install tsx if needed
npm run db:fix       # Fix the enum migration issue
```

**Option B: Manual SQL fix**

```bash
# Access your PostgreSQL database
psql -U onatatmaca -h 192.168.0.217 -p 9432 -d archive_resurrection

# Run this query:
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'item_type' AND e.enumlabel = 'wiki_page'
    ) THEN
        ALTER TYPE item_type ADD VALUE 'wiki_page';
    END IF;
END$$;

# Exit psql
\q
```

### Step 2: Rebuild and Push Docker Image

```bash
# On your development machine (Windows/Mac/Linux)
cd D:\Desktop\archive-resurrection  # or your project path

# Pull latest changes
git pull origin claude/archive-resurrection-roadmap-01FyysFUfCHMc7zem5umG7us

# Build the new image with fixes
docker build -t onatatmaca/archive-resurrection:latest .

# Login to Docker Hub
docker login

# Push the image
docker push onatatmaca/archive-resurrection:latest
```

### Step 3: Fix TrueNAS Deployment

1. **Stop the stuck deployment**:
   - TrueNAS Web UI → Apps
   - Find `archive-resurrection`
   - Click ⋮ (three dots) → **Stop**
   - Wait for it to stop (may take 1-2 minutes)
   - If it doesn't stop, click ⋮ → **Delete** (don't worry, your data is safe in volumes)

2. **Fix the uploads directory permissions**:
   ```bash
   # SSH into TrueNAS
   ssh adminssh@192.168.0.217

   # Fix permissions (if directory exists)
   sudo chown -R 1001:1001 /mnt/SamsungSSD_2TB/apps/archive-resurrection/uploads
   sudo chmod -R 755 /mnt/SamsungSSD_2TB/apps/archive-resurrection/uploads

   # If directory doesn't exist, create it
   sudo mkdir -p /mnt/SamsungSSD_2TB/apps/archive-resurrection/uploads
   sudo chown -R 1001:1001 /mnt/SamsungSSD_2TB/apps/archive-resurrection/uploads
   ```

   **Note**: UID 1001 is the `nextjs` user inside the Docker container.

3. **Update/Restart the app**:
   - If you stopped it: Click **Start**
   - If you deleted it: Redeploy using the same configuration (see [Redeployment Steps](#redeployment-steps) below)
   - TrueNAS should pull the new image automatically (since Image Pull Policy is "Always")

### Step 4: Run Database Migration

Once the container is running:

1. **Access the container shell**:
   - TrueNAS Web UI → Apps → archive-resurrection
   - Click **Shell** button

2. **Run migrations**:
   ```bash
   # Inside the container shell
   npm run db:push
   ```

3. **Expected output**:
   ```
   ✔ Pulling schema from database...
   ✔ Pushing schema to database...
   ✔ Everything is up to date!
   ```

4. **Exit the shell**:
   ```bash
   exit
   ```

### Step 5: Test the Application

1. Open browser and navigate to: `http://192.168.0.217.nip.io:9002`
2. Sign in with Google
3. Try uploading a file or creating a wiki page
4. Verify no permission errors in the logs

---

## Detailed Fix Steps

### Understanding the Issues

#### Issue 1: Database Migration Error

**What happened:**
- The database schema was partially updated
- The `wiki_page` enum value was added manually or in a previous migration
- Drizzle Kit tried to add it again and failed

**The fix:**
- Created a migration script that checks if the enum exists before adding it
- Script: `scripts/fix-migration.ts`
- Run with: `npm run db:fix`

#### Issue 2: Storage Permission Error

**What happened:**
- Docker creates `/app/data/uploads` with `nextjs:nodejs` user (UID 1001)
- TrueNAS mounts a volume at `/app/data` from the host
- The host directory has different ownership (root or admin)
- The nextjs user (UID 1001) can't write to the mounted directory

**The fix:**
- Created `docker-entrypoint.sh` that runs as root on startup
- Entrypoint ensures `/app/data/uploads` exists and has correct permissions
- Then switches to `nextjs` user before running the app
- Also need to fix host directory permissions on TrueNAS

#### Issue 3: TrueNAS Stuck Deploying

**What happened:**
- Previous deployment failed due to errors above
- Container keeps restarting because it can't start successfully
- TrueNAS shows "Deploying..." indefinitely

**The fix:**
- Stop or delete the stuck deployment
- Fix underlying issues (database + permissions)
- Redeploy with new Docker image

### What Changed in the Fix

**New files:**
- `scripts/fix-migration.ts` - Database migration fix script
- `scripts/fix-enum-migration.sql` - SQL migration (manual option)
- `docker-entrypoint.sh` - Entrypoint script to fix permissions on startup
- `DEPLOYMENT-FIX.md` - This guide

**Modified files:**
- `Dockerfile` - Now uses entrypoint script, installs su-exec
- `package.json` - Added `db:fix` script and `tsx` dependency
- `src/lib/db/schema.ts` - Updated with wiki_page enum (already done)

---

## Redeployment Steps

If you had to delete the app, here's how to redeploy:

### 1. TrueNAS App Configuration

**Navigate:** Apps → Discover Apps → Custom App

**Application Info:**
- Application Name: `archive-resurrection`

**Container Images:**
- Image Repository: `onatatmaca/archive-resurrection`
- Image Tag: `latest`
- Image Pull Policy: **"Always pull image"** (important!)

**Environment Variables:**

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `DATABASE_URL` | `postgresql://onatatmaca:M6r6T91373!@192.168.0.217:9432/archive_resurrection` |
| `NEXTAUTH_URL` | `http://192.168.0.217.nip.io:9002` |
| `NEXTAUTH_SECRET` | (your existing secret) |
| `GOOGLE_CLIENT_ID` | (your Google OAuth Client ID) |
| `GOOGLE_CLIENT_SECRET` | (your Google OAuth Client Secret) |
| `GEMINI_API_KEY` | (your Gemini API key) |
| `STORAGE_PATH` | `/app/data/uploads` |
| `PUBLIC_URL` | `http://192.168.0.217.nip.io:9002` |

**Port Forwarding:**
- Container Port: `3000`
- Node Port: `9002`
- Protocol: TCP

**Storage (Host Path Volume):**
- Host Path: `/mnt/SamsungSSD_2TB/apps/archive-resurrection/uploads`
- Mount Path: `/app/data`
- Read Only: ❌ (unchecked)

**Security Context** (IMPORTANT - NEW):
- Run as Root: ☑ **Checked** (allows entrypoint to fix permissions)

Click **Save** and wait for deployment.

---

## Verification

### Check Container Logs

1. TrueNAS UI → Apps → archive-resurrection → **Logs**
2. You should see:
   ```
   🚀 Starting Archive Resurrection...
   📁 Ensuring storage directory exists: /app/data/uploads
   🔐 Setting permissions on /app/data/uploads
   👤 Switching to nextjs user and starting application...
   ▲ Next.js 14.2.33
   - Local: http://localhost:3000
   - Network: http://0.0.0.0:3000
   ✓ Ready in XXXms
   ```

### Check Database

```bash
# SSH into TrueNAS
ssh adminssh@192.168.0.217

# Connect to database
psql -U onatatmaca -h 192.168.0.217 -p 9432 -d archive_resurrection

# Verify enum values
SELECT enumlabel FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'item_type'
ORDER BY enumlabel;

# Should show:
#  archive
#  document
#  other
#  photo
#  text
#  wiki_page

\q
```

### Check Storage Permissions

```bash
# SSH into TrueNAS
ssh adminssh@192.168.0.217

# Check permissions
ls -la /mnt/SamsungSSD_2TB/apps/archive-resurrection/uploads

# Should show owner as 1001:1001 (nextjs user)
# drwxr-xr-x 2 1001 1001 4096 Nov 26 ... uploads
```

---

## Troubleshooting

### Container Won't Start

**Check logs:**
```bash
# In TrueNAS UI
Apps → archive-resurrection → Logs
```

**Common errors:**

1. **"DATABASE_URL environment variable is not set"**
   - Verify environment variable in TrueNAS app settings
   - Make sure it's not empty

2. **"Cannot connect to database"**
   - Check PostgreSQL container is running: Apps → archive-resurrection-db
   - Verify database credentials match

3. **"Permission denied" errors**
   - Make sure "Run as Root" is checked in Security Context
   - Check host directory permissions: `ls -la /mnt/SamsungSSD_2TB/apps/archive-resurrection/`
   - Run: `sudo chown -R 1001:1001 /mnt/SamsungSSD_2TB/apps/archive-resurrection/uploads`

### Migration Still Failing

If `npm run db:push` still fails:

1. **Check current database state:**
   ```sql
   \d archive_items
   ```

2. **If wiki_content column exists but enum doesn't:**
   ```sql
   ALTER TYPE item_type ADD VALUE IF NOT EXISTS 'wiki_page';
   ```

3. **Nuclear option (only if nothing else works):**
   ```sql
   -- WARNING: This deletes all data!
   DROP TABLE IF EXISTS archive_items CASCADE;
   DROP TABLE IF EXISTS tags CASCADE;
   DROP TYPE IF EXISTS item_type CASCADE;
   ```
   Then run `npm run db:push` to recreate everything.

### OAuth Not Working

1. **Verify NEXTAUTH_URL matches browser URL exactly:**
   - Must use: `http://192.168.0.217.nip.io:9002`
   - NOT: `http://192.168.0.217:9002`

2. **Check Google OAuth redirect URI:**
   - Go to: https://console.cloud.google.com
   - Navigate to your OAuth credentials
   - Verify redirect URI: `http://192.168.0.217.nip.io:9002/api/auth/callback/google`

3. **Clear browser cookies:**
   - Sometimes old cookies cause issues
   - Clear site data for `192.168.0.217.nip.io`

### File Upload Still Fails

1. **Check container logs for errors:**
   ```bash
   Apps → archive-resurrection → Logs
   ```

2. **Verify storage path in container:**
   ```bash
   # In container shell
   ls -la /app/data/uploads
   whoami  # Should show: nextjs
   touch /app/data/uploads/test.txt  # Test write permissions
   ```

3. **Check host directory:**
   ```bash
   # SSH into TrueNAS
   ls -la /mnt/SamsungSSD_2TB/apps/archive-resurrection/uploads
   # Should show owner as 1001:1001
   ```

### Image Pull Fails

If Docker Hub image pull fails:

1. **Check Docker Hub:**
   - Verify image exists: https://hub.docker.com/r/onatatmaca/archive-resurrection

2. **Check TrueNAS internet connection:**
   ```bash
   ping hub.docker.com
   ```

3. **Manually pull in TrueNAS:**
   ```bash
   ssh adminssh@192.168.0.217
   docker pull onatatmaca/archive-resurrection:latest
   ```

---

## Success Checklist

After following this guide, verify:

- [ ] Container starts successfully (not stuck deploying)
- [ ] Container logs show no permission errors
- [ ] Database migration runs without errors
- [ ] Can access app at `http://192.168.0.217.nip.io:9002`
- [ ] Can sign in with Google OAuth
- [ ] Can upload a file successfully
- [ ] Can create a wiki page successfully
- [ ] Uploaded files persist after container restart

---

## Next Steps

Once everything is working:

1. **Backup your database:**
   ```bash
   docker exec archive-resurrection-db pg_dump -U onatatmaca archive_resurrection > backup.sql
   ```

2. **Set up automatic backups** using TrueNAS tasks

3. **Consider migrating to HTTPS** for production use (see DEPLOYMENT.md)

4. **Continue with Phase 2 of the roadmap** (see ROADMAP.md):
   - Tag management
   - Full-text search
   - User profiles

---

## Support

If you're still having issues after following this guide:

1. Check container logs: Apps → archive-resurrection → Logs
2. Check database logs: Apps → archive-resurrection-db → Logs
3. Verify all environment variables are set correctly
4. Ensure PostgreSQL container is healthy and running
5. Check TrueNAS system resources (CPU, RAM, disk space)

The most common issue is permissions - make sure the uploads directory on the host has UID 1001:1001 ownership.
