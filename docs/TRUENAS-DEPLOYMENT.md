# Archive Resurrection - TrueNAS Deployment Guide

> **⚠️ FOR AI ASSISTANTS:**
> This file contains TrueNAS-specific deployment information.
> - Update this file if deployment steps change
> - Document issues and fixes here
> - For general progress, update PROGRESS-TRACKER.md
> - For schema info, update SCHEMA-REFERENCE.md

---

## 🚨 Current Issue: Database Migration Required

**Status:** Phase 0 code is deployed but database needs migration

**Problem:** Missing Phase 0 columns causing errors:
```
Error: column preferred_language does not exist
```

**Quick Fix (choose one):**

1. **From local machine:**
   ```bash
   ./fix-database.sh
   ```

2. **Direct psql:**
   ```bash
   psql -U onatatmaca -h 192.168.0.217 -p 9432 -d archive_resurrection
   \i scripts/fix-missing-columns.sql
   \q
   ```

3. **From TrueNAS container shell:**
   ```bash
   export DATABASE_URL="postgresql://onatatmaca:M6r6T91373!@192.168.0.217:9432/archive_resurrection"
   psql "$DATABASE_URL" -f /app/scripts/fix-missing-columns.sql
   ```

**What it adds:** 9 Phase 0 columns (preferred_language, is_admin, sha256_hash, etc.)

**See PROGRESS-TRACKER.md "Current Status" section for complete details.**

---

## Current Configuration

### Database Container
- **Name:** archive-resurrection-db
- **Image:** ankane/pgvector:latest
- **Port:** 5432 → 9432 (TrueNAS requires ports >= 9000)
- **Volume:** `/mnt/SamsungSSD_2TB/apps/archive-resurrection/postgres-data` → `/var/lib/postgresql/data`
- **Env:**
  - `POSTGRES_USER=onatatmaca`
  - `POSTGRES_PASSWORD=M6r6T91373!`
  - `POSTGRES_DB=archive_resurrection`

### Application Container
- **Name:** archive-resurrection
- **Image:** onatatmaca/archive-resurrection:latest
- **Port:** 3000 → 9002
- **Volume:** `/mnt/SamsungSSD_2TB/apps/archive-resurrection/uploads` → `/app/data`
- **Env:**
  - `NODE_ENV=production`
  - `PORT=3000`
  - `DATABASE_URL=postgresql://onatatmaca:M6r6T91373!@192.168.0.217:9432/archive_resurrection`
  - `NEXTAUTH_URL=http://192.168.0.217.nip.io:9002`
  - `NEXTAUTH_SECRET=[generated]`
  - `GOOGLE_CLIENT_ID=[your-id]`
  - `GOOGLE_CLIENT_SECRET=[your-secret]`
  - `GEMINI_API_KEY=[your-key]`
  - `STORAGE_PATH=/app/data/uploads`
  - `PUBLIC_URL=http://192.168.0.217.nip.io:9002`

### Access
- **Application URL:** http://192.168.0.217.nip.io:9002
- **Database URL:** `postgresql://onatatmaca:M6r6T91373!@192.168.0.217:9432/archive_resurrection`

**Why nip.io?** Google OAuth doesn't allow private IP addresses as redirect URIs. The nip.io service resolves `192.168.0.217.nip.io` to `192.168.0.217` automatically.

---

## Initial Setup (For New Deployments)

### Step 1: Deploy PostgreSQL Container

**TrueNAS UI:** Apps → Discover Apps → Custom App

**Settings:**
- Application Name: `archive-resurrection-db`
- Image: `ankane/pgvector:latest`
- Port: 5432 → 9432
- Environment Variables:
  ```
  POSTGRES_USER=onatatmaca
  POSTGRES_PASSWORD=M6r6T91373!
  POSTGRES_DB=archive_resurrection
  ```
- Storage: Host Path Volume
  - Host: `/mnt/SamsungSSD_2TB/apps/archive-resurrection/postgres-data`
  - Container: `/var/lib/postgresql/data`

**Before deploying, create directory:**
```bash
ssh adminssh@192.168.0.217
sudo mkdir -p /mnt/SamsungSSD_2TB/apps/archive-resurrection/postgres-data
sudo chown -R 999:999 /mnt/SamsungSSD_2TB/apps/archive-resurrection/postgres-data
```

### Step 2: Enable pgvector Extension

```bash
psql -U onatatmaca -h 192.168.0.217 -p 9432 -d archive_resurrection
CREATE EXTENSION vector;
\q
```

### Step 3: Build and Push Docker Image

```bash
# On your development machine
cd /path/to/archive-resurrection
docker build -t onatatmaca/archive-resurrection:latest .
docker login
docker push onatatmaca/archive-resurrection:latest
```

### Step 4: Deploy Application Container

**TrueNAS UI:** Apps → Discover Apps → Custom App

**Settings:**
- Application Name: `archive-resurrection`
- Image: `onatatmaca/archive-resurrection:latest`
- Image Pull Policy: "Always pull image"
- Port: 3000 → 9002
- Environment Variables: (see "Current Configuration" above)
- Storage: Host Path Volume
  - Host: `/mnt/SamsungSSD_2TB/apps/archive-resurrection/uploads`
  - Container: `/app/data`

**Before deploying, create directory:**
```bash
sudo mkdir -p /mnt/SamsungSSD_2TB/apps/archive-resurrection/uploads
sudo chown -R 1001:1001 /mnt/SamsungSSD_2TB/apps/archive-resurrection/uploads
```

### Step 5: Run Database Migrations

**Access container shell:** TrueNAS UI → Apps → archive-resurrection → Shell

```bash
# Run Phase 0 migration
npm run db:migrate
```

This will:
1. Add missing columns
2. Create new tables (archive_dates, translations, facets, etc.)
3. Seed 70+ default facets

### Step 6: Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to your OAuth credentials
3. Add authorized redirect URI:
   ```
   http://192.168.0.217.nip.io:9002/api/auth/callback/google
   ```

---

## Updating the Application

### When Code Changes:

```bash
# On development machine
git pull
docker build -t onatatmaca/archive-resurrection:latest .
docker push onatatmaca/archive-resurrection:latest
```

**In TrueNAS UI:**
1. Apps → archive-resurrection → Stop
2. Apps → archive-resurrection → Edit → Save (pulls new image)
3. Apps → archive-resurrection → Start

### When Schema Changes:

After updating code with schema changes:

```bash
# In container shell
npm run db:push
```

Or for new Phase 0 columns only:
```bash
psql "$DATABASE_URL" -f /app/scripts/fix-missing-columns.sql
```

---

## Troubleshooting

### Container Won't Start
**Check logs:** Apps → archive-resurrection → Logs

**Common issues:**
- Database not running (check archive-resurrection-db status)
- Wrong DATABASE_URL environment variable
- Missing environment variables

### Database Connection Errors
**Verify connection:**
```bash
psql -U onatatmaca -h 192.168.0.217 -p 9432 -d archive_resurrection
```

**If fails:**
- Check PostgreSQL container is running
- Verify port 9432 is mapped correctly
- Check credentials match environment variables

### OAuth Errors
**State cookie was missing:**
- Always access via: `http://192.168.0.217.nip.io:9002`
- NEVER use: `http://192.168.0.217:9002`
- URL must match NEXTAUTH_URL exactly

**redirect_uri_mismatch:**
- Verify Google OAuth redirect URI matches exactly
- Check NEXTAUTH_URL environment variable

### File Upload Errors
**Permission denied:**
```bash
sudo chown -R 1001:1001 /mnt/SamsungSSD_2TB/apps/archive-resurrection/uploads
sudo chmod -R 755 /mnt/SamsungSSD_2TB/apps/archive-resurrection/uploads
```

**Storage full:**
```bash
df -h /mnt/SamsungSSD_2TB
```

### Missing Database Columns
**Error: "column X does not exist"**

This means database schema is outdated. See "Current Issue" section at top of this file.

---

## Backup & Restore

### Database Backup
```bash
# From TrueNAS
pg_dump -U onatatmaca -h 192.168.0.217 -p 9432 -d archive_resurrection > backup.sql
```

### Database Restore
```bash
psql -U onatatmaca -h 192.168.0.217 -p 9432 -d archive_resurrection < backup.sql
```

### Files Backup
Files are stored in: `/mnt/SamsungSSD_2TB/apps/archive-resurrection/uploads`

Use TrueNAS's built-in snapshot/backup features.

---

## Security Notes

1. **Change default password** in POSTGRES_PASSWORD
2. **Generate new NEXTAUTH_SECRET:** `openssl rand -base64 32`
3. **Use HTTPS in production** (see "Migration to HTTPS" below)
4. **Firewall:** Only expose port 9002 to trusted networks
5. **Regular backups:** Set up automated TrueNAS snapshots

---

## Migration to HTTPS (Production)

Current setup uses HTTP which is insecure. For production:

### Option 1: Cloudflare (Recommended)
1. Register domain
2. Add to Cloudflare
3. Create DNS A record pointing to 192.168.0.217
4. Enable Cloudflare proxy (orange cloud)
5. Update NEXTAUTH_URL to https://yourdomain.com
6. Update Google OAuth redirect URI

### Option 2: Let's Encrypt + Reverse Proxy
1. Install nginx or Caddy on TrueNAS
2. Configure reverse proxy
3. Set up Let's Encrypt SSL
4. Proxy https → http://192.168.0.217:9002

---

## Useful Commands

### View Container Logs
```bash
# TrueNAS UI
Apps → archive-resurrection → Logs

# Or via CLI
docker logs archive-resurrection
```

### Access Container Shell
```bash
# TrueNAS UI
Apps → archive-resurrection → Shell

# Or via CLI
docker exec -it archive-resurrection sh
```

### Check Database Tables
```bash
psql -U onatatmaca -h 192.168.0.217 -p 9432 -d archive_resurrection
\dt
\d archive_items
\q
```

### Restart Container
```bash
# TrueNAS UI
Apps → archive-resurrection → Stop → Start

# Or via CLI
docker restart archive-resurrection
```

---

**Last Updated:** December 3, 2025
**Current Status:** Phase 0 code deployed, database migration pending
**See:** PROGRESS-TRACKER.md for complete project status
