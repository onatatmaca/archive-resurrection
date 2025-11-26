# Archive Resurrection - TrueNAS Deployment Guide

**Date:** November 26, 2025
**Environment:** TrueNAS Scale (K3s/Kubernetes)
**Deployment Method:** Docker via TrueNAS Custom Apps

---

## Table of Contents

1. [Overview](#overview)
2. [Initial Problem](#initial-problem)
3. [Docker Build Fixes](#docker-build-fixes)
4. [Database Setup](#database-setup)
5. [Application Deployment](#application-deployment)
6. [OAuth Authentication Setup](#oauth-authentication-setup)
7. [Troubleshooting](#troubleshooting)
8. [Final Configuration](#final-configuration)
9. [Known Issues & Workarounds](#known-issues--workarounds)

---

## Overview

Archive Resurrection is a Next.js application with:
- **Framework:** Next.js 14.2.33
- **Database:** PostgreSQL 15.4 with pgvector extension
- **Authentication:** NextAuth v4 with Google OAuth
- **Session Strategy:** JWT (for HTTP compatibility)
- **Storage:** Local file system + S3 support
- **Deployment:** TrueNAS Scale using Custom Apps

---

## Initial Problem

**Original Issue:** Attempting to transfer the project via SCP failed:
```bash
scp -r archive-resurrection adminssh@192.168.0.217:/mnt/SamsungSSD_2TB/apps/morse-me-please
# Error: No such file or directory
```

**Resolution:** Deployed directly on TrueNAS using Docker containers instead of file transfer.

---

## Docker Build Fixes

### 1. Missing package-lock.json

**Issue:** Docker build failed with:
```
npm error The npm ci command can only install with an existing package-lock.json
```

**Fix:** Generated package-lock.json on local machine:
```bash
npm install
```

### 2. TypeScript Build Errors

#### Error 1: Buffer Type Casting
**File:** `src/app/api/files/[...path]/route.ts:53`

**Issue:**
```typescript
return new NextResponse(fileBuffer, { // Type error: Buffer not assignable to BodyInit
```

**Fix:**
```typescript
// Convert Buffer to Uint8Array for NextResponse
const uint8Array = new Uint8Array(fileBuffer);
return new NextResponse(uint8Array, {
  headers: { ... }
});
```

#### Error 2: Missing Type Declarations
**File:** `src/lib/utils/file-processor.ts:1`

**Issue:** No type declarations for `pdf-parse` module

**Fix:** Created `src/types/pdf-parse.d.ts`:
```typescript
declare module 'pdf-parse' {
  interface PDFInfo {
    PDFFormatVersion: string;
    IsAcroFormPresent: boolean;
    IsXFAPresent: boolean;
    [key: string]: any;
  }

  interface PDFMetadata {
    [key: string]: any;
  }

  interface PDFData {
    numpages: number;
    numrender: number;
    info: PDFInfo;
    metadata: PDFMetadata | null;
    text: string;
    version: string;
  }

  function pdf(dataBuffer: Buffer): Promise<PDFData>;
  export = pdf;
}
```

### 3. Environment Variables at Build Time

**Issue:** Build failed with:
```
Error: DATABASE_URL environment variable is not set
```

**Fix:** Made environment variables optional during build with fallback values:

**File:** `src/lib/db/index.ts`
```typescript
// Before:
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// After:
const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/dummy';
```

**File:** `src/lib/storage/s3.ts`
```typescript
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy',
  },
});
```

**File:** `src/lib/ai/gemini.ts`
```typescript
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy');
```

### 4. Missing Public Directory

**Issue:**
```
ERROR: "/app/public": not found
```

**Fix:** Created public directory:
```bash
mkdir -p public
echo "# Archive Resurrection" > public/.gitkeep
```

### 5. Production Dependencies for Migrations

**Issue:** `drizzle-kit` was in devDependencies but needed in production for database migrations.

**Fix:** Moved `drizzle-kit` to dependencies and updated Dockerfile:

**File:** `package.json`
```json
{
  "dependencies": {
    "drizzle-kit": "^0.24.0",
    // ... other dependencies
  }
}
```

**File:** `Dockerfile`
```dockerfile
# Copy node_modules and necessary files for migrations
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/src/lib/db ./src/lib/db
```

---

## Database Setup

### PostgreSQL with pgvector

**TrueNAS Configuration:**

1. **Navigate:** Apps → Discover Apps → Custom App

2. **Application Info:**
   - Application Name: `archive-resurrection-db`

3. **Container Images:**
   - Image Repository: `ankane/pgvector`
   - Image Tag: `latest`
   - Image Pull Policy: "Only pull image if not present on host"

4. **Environment Variables:**
   ```
   POSTGRES_USER = onatatmaca
   POSTGRES_PASSWORD = M6r6T91373!
   POSTGRES_DB = archive_resurrection
   ```

5. **Port Forwarding:**
   - Container Port: `5432`
   - Node Port: `9432` (TrueNAS requires >= 9000)
   - Protocol: TCP

6. **Storage (Host Path Volume):**
   - Host Path: `/mnt/SamsungSSD_2TB/apps/archive-resurrection/postgres-data`
   - Mount Path: `/var/lib/postgresql/data`
   - Read Only: ❌ (unchecked)

7. **Create directory on TrueNAS:**
   ```bash
   sudo mkdir -p /mnt/SamsungSSD_2TB/apps/archive-resurrection/postgres-data
   sudo chown -R 999:999 /mnt/SamsungSSD_2TB/apps/archive-resurrection/postgres-data
   ```

8. **Enable pgvector extension:**
   ```bash
   # Access database shell
   psql -U onatatmaca -d archive_resurrection

   # Enable extension
   CREATE EXTENSION vector;
   \q
   ```

### Database Schema Configuration

**Critical Fix:** NextAuth DrizzleAdapter expects specific column types.

**Issue:** Table names and column types didn't match DrizzleAdapter expectations.

**Fixes Applied:**

1. **Table Names** (changed from plural to singular):
   ```typescript
   // Before:
   export const users = pgTable('users', { ... });
   export const accounts = pgTable('accounts', { ... });
   export const sessions = pgTable('sessions', { ... });

   // After:
   export const users = pgTable('user', { ... });
   export const accounts = pgTable('account', { ... });
   export const sessions = pgTable('session', { ... });
   ```

2. **Column Names** (changed from snake_case to camelCase):
   ```typescript
   // Before:
   export const users = pgTable('user', {
     email_verified: timestamp('email_verified'),
     created_at: timestamp('created_at'),
   });

   // After:
   export const users = pgTable('user', {
     emailVerified: timestamp('emailVerified'),
     createdAt: timestamp('createdAt'),
   });
   ```

3. **Column Types** (critical for OAuth):
   ```typescript
   // Before:
   export const accounts = pgTable('account', {
     expires_at: timestamp('expires_at'), // ❌ WRONG - causes type error
   });

   // After:
   export const accounts = pgTable('account', {
     expires_at: integer('expires_at'), // ✅ CORRECT - Unix timestamp as integer
   });
   ```

**Why this matters:** NextAuth stores OAuth token expiry as Unix timestamp (integer seconds), not PostgreSQL timestamp. Using `timestamp` type caused:
```
TypeError: The "string" argument must be of type string or an instance of Buffer or ArrayBuffer.
Received type number (1764190590)
```

### Database Connection

**Internal Connection (from archive-resurrection app):**
```
DATABASE_URL=postgresql://onatatmaca:M6r6T91373!@192.168.0.217:9432/archive_resurrection
```

**Note:** Internal K8s DNS (`archive-resurrection-db`) failed to resolve, so we use the TrueNAS host IP and Node Port instead.

---

## Application Deployment

### Build and Push Docker Image

**On Windows Development Machine:**

```bash
cd D:\Desktop\archive-resurrection

# Pull latest changes
git pull

# Build Docker image
docker build -t onatatmaca/archive-resurrection:latest .

# Login to Docker Hub
docker login

# Push to Docker Hub
docker push onatatmaca/archive-resurrection:latest
```

### TrueNAS Application Setup

1. **Navigate:** Apps → Discover Apps → Custom App

2. **Application Info:**
   - Application Name: `archive-resurrection`

3. **Container Images:**
   - Image Repository: `onatatmaca/archive-resurrection`
   - Image Tag: `latest`
   - Image Pull Policy: "Always pull image"

4. **Environment Variables:**
   ```
   NODE_ENV = production
   PORT = 3000
   DATABASE_URL = postgresql://onatatmaca:M6r6T91373!@192.168.0.217:9432/archive_resurrection
   NEXTAUTH_URL = http://192.168.0.217.nip.io:9002
   NEXTAUTH_SECRET = [generated with: openssl rand -base64 32]
   GOOGLE_CLIENT_ID = [your Google OAuth client ID]
   GOOGLE_CLIENT_SECRET = [your Google OAuth client secret]
   GEMINI_API_KEY = [your Gemini API key]
   STORAGE_PATH = /app/data/uploads
   PUBLIC_URL = http://192.168.0.217.nip.io:9002
   ```

5. **Port Forwarding:**
   - Container Port: `3000`
   - Node Port: `9002`
   - Protocol: TCP

6. **Storage (Host Path Volume):**
   - Host Path: `/mnt/SamsungSSD_2TB/apps/archive-resurrection/uploads`
   - Mount Path: `/app/data`

7. **Create uploads directory:**
   ```bash
   sudo mkdir -p /mnt/SamsungSSD_2TB/apps/archive-resurrection/uploads
   sudo chown -R 568:568 /mnt/SamsungSSD_2TB/apps/archive-resurrection/uploads
   ```

### Run Database Migrations

After app deployment, run migrations:

1. **Navigate:** Apps → archive-resurrection → Shell
2. **Run:**
   ```bash
   npm run db:push
   ```
3. **Expected output:**
   ```
   ✔ Pulling from database...
   ✔ Pushing to database...
   ✔ Pushed successfully!
   ```

---

## OAuth Authentication Setup

### Why nip.io?

Google OAuth doesn't allow private IP addresses (192.168.x.x) as redirect URIs. We use **nip.io**, a wildcard DNS service that maps to IP addresses:

- `192.168.0.217.nip.io` → resolves to `192.168.0.217`
- Allows Google OAuth to work with private IPs
- Free, no configuration required

### Google Cloud Console Configuration

1. **Navigate:** [Google Cloud Console](https://console.cloud.google.com/) → Your Project → Credentials

2. **Create OAuth 2.0 Client ID** (or edit existing):

3. **Application Type:** Web application

4. **Authorized JavaScript origins:**
   ```
   http://192.168.0.217.nip.io:9002
   ```

5. **Authorized redirect URIs:**
   ```
   http://192.168.0.217.nip.io:9002/api/auth/callback/google
   ```

6. **Note the Client ID and Client Secret** for environment variables

### NextAuth Configuration

**File:** `src/lib/auth.ts`

**Key Configuration:**

```typescript
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from './db';

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // On sign in, add user data to the token
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user id from token to session
      if (session?.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt', // Use JWT instead of database sessions for HTTP compatibility
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  useSecureCookies: false, // REQUIRED for HTTP (non-HTTPS) environments
};
```

**Why JWT Sessions?**

- HTTP cookies have strict limitations compared to HTTPS
- Database sessions had persistent cookie issues over HTTP
- JWT sessions store session data in encrypted cookies (more tolerant of HTTP)
- User accounts still stored in database via DrizzleAdapter

**Critical Settings:**

1. **`strategy: 'jwt'`** - Required for HTTP OAuth to work
2. **`useSecureCookies: false`** - Allows cookies over HTTP (insecure, but necessary without HTTPS)
3. **Both `jwt` and `session` callbacks** - Needed for JWT strategy to pass user ID to session

---

## Troubleshooting

### Issue 1: "State cookie was missing"

**Symptom:**
```
[next-auth][error][OAUTH_CALLBACK_ERROR]
State cookie was missing.
```

**Root Cause:** Accessing the app via wrong URL

**Problem:**
- User accessed: `http://192.168.0.217:9002/`
- NEXTAUTH_URL set to: `http://192.168.0.217.nip.io:9002`
- Cookie domain mismatch prevented OAuth state cookie from persisting

**Solution:**
✅ **ALWAYS access the app via:** `http://192.168.0.217.nip.io:9002`
❌ **NEVER use:** `http://192.168.0.217:9002`

The URL in the browser MUST match the `NEXTAUTH_URL` environment variable exactly.

### Issue 2: "OAuthAccountNotLinked"

**Symptom:**
```
error=OAuthAccountNotLinked
To confirm your identity, sign in with the same account you used originally.
```

**Root Cause:** Orphaned user records in database from testing

**Solution:** Clear database:
```sql
-- In PostgreSQL shell
DELETE FROM account;
DELETE FROM "user";
DELETE FROM session;
```

### Issue 3: "adapter_error_linkAccount" - Type Mismatch

**Symptom:**
```
[next-auth][error][adapter_error_linkAccount]
The "string" argument must be of type string or an instance of Buffer or ArrayBuffer.
Received type number (1764190590)
```

**Root Cause:** `expires_at` column was `timestamp` instead of `integer`

**Diagnosis:**
```sql
\d account
-- Shows: expires_at | timestamp without time zone
```

**Solution:** Change schema and rebuild database:

```typescript
// src/lib/db/schema.ts
import { pgTable, integer, ... } from 'drizzle-orm/pg-core';

export const accounts = pgTable('account', {
  expires_at: integer('expires_at'), // Unix timestamp in seconds
  // ...
});
```

Then:
1. Drop and recreate database schema
2. Rebuild Docker image
3. Run `npm run db:push`

### Issue 4: NextAuth Callback Errors with JWT

**Symptom:**
```
error=OAuthCallback
To confirm your identity, sign in with the same account you used originally.
```

**Root Cause:** Session callback written for database sessions but using JWT strategy

**Problem:**
```typescript
// Wrong for JWT strategy
callbacks: {
  session: async ({ session, user }) => { // 'user' doesn't exist in JWT strategy
    session.user.id = user.id;
    return session;
  },
}
```

**Solution:**
```typescript
// Correct for JWT strategy
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.id = user.id; // Store in token
    }
    return token;
  },
  async session({ session, token }) {
    session.user.id = token.id as string; // Read from token
    return session;
  },
}
```

---

## Final Configuration

### Environment Variables (Complete List)

**archive-resurrection app:**
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://onatatmaca:M6r6T91373!@192.168.0.217:9432/archive_resurrection
NEXTAUTH_URL=http://192.168.0.217.nip.io:9002
NEXTAUTH_SECRET=[base64 string from: openssl rand -base64 32]
GOOGLE_CLIENT_ID=[your Google OAuth client ID]
GOOGLE_CLIENT_SECRET=[your Google OAuth client secret]
GEMINI_API_KEY=[your key]
STORAGE_PATH=/app/data/uploads
PUBLIC_URL=http://192.168.0.217.nip.io:9002
```

**archive-resurrection-db app:**
```bash
POSTGRES_USER=onatatmaca
POSTGRES_PASSWORD=M6r6T91373!
POSTGRES_DB=archive_resurrection
```

### File Structure

```
/mnt/SamsungSSD_2TB/apps/archive-resurrection/
├── postgres-data/          # PostgreSQL data (chown 999:999)
└── uploads/                # File uploads (chown 568:568)
```

### Access URLs

- **Application:** http://192.168.0.217.nip.io:9002
- **Database:** 192.168.0.217:9432 (external access)

---

## Known Issues & Workarounds

### 1. HTTP vs HTTPS

**Issue:** OAuth over HTTP is less secure and has cookie limitations

**Current Workaround:**
- Using `useSecureCookies: false`
- Using JWT sessions instead of database sessions
- Using nip.io for DNS resolution

**Production Solution:**
1. Get a real domain name
2. Set up HTTPS with SSL certificate (Let's Encrypt or Cloudflare)
3. Update NEXTAUTH_URL to use `https://`
4. Change `useSecureCookies: true`
5. Can switch back to `strategy: 'database'` if desired

### 2. Internal K8s DNS Not Working

**Issue:** `archive-resurrection-db` hostname doesn't resolve

**Workaround:** Use TrueNAS host IP and Node Port in DATABASE_URL

**Why:** TrueNAS networking configuration or namespace isolation issues

### 3. URL Must Use nip.io

**Issue:** Google OAuth requires domain names, not IP addresses

**Workaround:** Always access via `http://192.168.0.217.nip.io:9002`

**Critical:** Browser URL must EXACTLY match `NEXTAUTH_URL` environment variable

---

## Deployment Checklist

When deploying to a new environment or updating:

### Initial Setup

- [ ] Create PostgreSQL database on TrueNAS
- [ ] Create required directories with correct permissions
- [ ] Enable pgvector extension in database
- [ ] Set up Google OAuth credentials
- [ ] Generate NEXTAUTH_SECRET: `openssl rand -base64 32`

### Docker Build

- [ ] Pull latest code: `git pull`
- [ ] Build image: `docker build -t onatatmaca/archive-resurrection:latest .`
- [ ] Push to Docker Hub: `docker push onatatmaca/archive-resurrection:latest`

### TrueNAS Deployment

- [ ] Deploy archive-resurrection app with correct environment variables
- [ ] Verify all environment variables are set correctly
- [ ] Check port mappings (3000→9002)
- [ ] Verify storage volume mounts

### Post-Deployment

- [ ] Run database migrations: `npm run db:push`
- [ ] Test database connection
- [ ] Test OAuth sign-in flow
- [ ] Verify file uploads work

### Testing

- [ ] Access via `http://192.168.0.217.nip.io:9002` (NOT plain IP!)
- [ ] Clear browser cookies before testing
- [ ] Sign in with Google
- [ ] Upload a test file
- [ ] Verify data persists after app restart

---

## Migration to Production (HTTPS)

To properly deploy with HTTPS:

### Option 1: Cloudflare (Easiest)

1. **Register domain** (any registrar)
2. **Add to Cloudflare** (free tier)
3. **DNS Settings:**
   ```
   Type: A
   Name: archive
   Content: 192.168.0.217
   Proxy: Enabled (orange cloud)
   ```
4. **SSL/TLS Mode:** Flexible or Full
5. **Update environment variables:**
   ```bash
   NEXTAUTH_URL=https://archive.yourdomain.com
   PUBLIC_URL=https://archive.yourdomain.com
   ```
6. **Update Google OAuth:**
   - Authorized redirect URI: `https://archive.yourdomain.com/api/auth/callback/google`

7. **Update NextAuth config:**
   ```typescript
   useSecureCookies: true, // Can use secure cookies with HTTPS
   ```

### Option 2: Let's Encrypt + Reverse Proxy

1. Set up nginx or Caddy as reverse proxy on TrueNAS
2. Configure Let's Encrypt for SSL certificate
3. Proxy `https://yourdomain.com` → `http://192.168.0.217:9002`
4. Update environment variables and OAuth settings

---

## Additional Resources

- **NextAuth Documentation:** https://next-auth.js.org/
- **Drizzle ORM:** https://orm.drizzle.team/
- **pgvector:** https://github.com/pgvector/pgvector
- **nip.io:** https://nip.io/
- **TrueNAS Scale:** https://www.truenas.com/truenas-scale/

---

## Support & Maintenance

### Logs

**View application logs:**
```bash
# In TrueNAS UI
Apps → archive-resurrection → Logs
```

**View database logs:**
```bash
# In TrueNAS UI
Apps → archive-resurrection-db → Logs
```

### Database Backup

```bash
# From archive-resurrection-db shell
pg_dump -U onatatmaca archive_resurrection > /var/lib/postgresql/data/backup.sql
```

### Database Restore

```bash
# From archive-resurrection-db shell
psql -U onatatmaca archive_resurrection < /var/lib/postgresql/data/backup.sql
```

### Update Application

1. Build and push new Docker image
2. In TrueNAS: Apps → archive-resurrection → ⋮ → Update
3. Wait for container to pull new image and restart
4. Run migrations if schema changed: `npm run db:push`

---

## Conclusion

This deployment successfully runs Archive Resurrection on TrueNAS using:
- PostgreSQL with pgvector for vector embeddings
- NextAuth with Google OAuth for authentication
- JWT sessions for HTTP compatibility
- nip.io for DNS resolution without a real domain

The application is functional but should be migrated to HTTPS with a real domain for production use.

**Deployment Date:** November 26, 2025
**Status:** ✅ Fully Functional
**Next Steps:** Consider migrating to HTTPS for production deployment
