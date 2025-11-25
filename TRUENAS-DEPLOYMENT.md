# Archive Resurrection - TrueNAS Deployment Guide

This guide will help you deploy Archive Resurrection on your TrueNAS server using the built-in app system.

## Overview

You'll be running two containers on TrueNAS:
1. **PostgreSQL** with pgvector (database)
2. **Archive Resurrection** (the web app)

## Prerequisites

- TrueNAS Scale (or TrueNAS Core with Docker/Kubernetes support)
- Access to TrueNAS web interface
- Google OAuth credentials (for authentication)
- Google Gemini API key (for AI features)

---

## Part 1: Build and Push Docker Image

First, you need to build the Docker image and push it to Docker Hub (or your registry).

### Option A: Build Locally and Push to Docker Hub

```bash
# 1. Build the image (run this on your development machine or TrueNAS shell)
docker build -t your-dockerhub-username/archive-resurrection:latest .

# 2. Login to Docker Hub
docker login

# 3. Push the image
docker push your-dockerhub-username/archive-resurrection:latest
```

### Option B: Use Docker Compose (Simpler for Testing)

If you have shell access to TrueNAS, you can use docker-compose directly:

```bash
# Copy the project to TrueNAS
scp -r archive-resurrection user@truenas-ip:/mnt/your-pool/apps/

# SSH into TrueNAS
ssh user@truenas-ip

# Navigate to the project
cd /mnt/your-pool/apps/archive-resurrection

# Copy and configure environment
cp .env.docker .env
nano .env  # Fill in your credentials

# Start with docker-compose
docker-compose up -d
```

---

## Part 2: TrueNAS App Configuration (Method 1: Using TrueNAS UI)

If you prefer using the TrueNAS UI, follow these steps:

### Step 1: Deploy PostgreSQL Container

1. **Go to Apps** → Click **Launch Docker Image**

2. **Configure PostgreSQL**:
   - **Application Name**: `archive-resurrection-db`
   - **Docker Image**: `ankane/pgvector:latest`
   - **Image Pull Policy**: "Only pull if not present"

3. **Environment Variables**:
   - `POSTGRES_USER`: `archive_user`
   - `POSTGRES_PASSWORD`: `your_secure_password_here`
   - `POSTGRES_DB`: `archive_resurrection`

4. **Port Forwarding**:
   - Container Port: `5432`
   - Node Port: `5432` (or any available port)
   - Protocol: `TCP`

5. **Storage**:
   - **Host Path Volume**:
     - Host Path: `/mnt/SamsungSSD_2TB/apps/archive-resurrection/postgres-data`
     - Mount Path: `/var/lib/postgresql/data`

6. Click **Save** and wait for the container to start

---

### Step 2: Deploy Archive Resurrection Container

1. **Go to Apps** → Click **Launch Docker Image**

2. **Configure App**:
   - **Application Name**: `archive-resurrection`
   - **Docker Image**: `your-dockerhub-username/archive-resurrection:latest`
   - **Image Pull Policy**: "Always pull image"

3. **Environment Variables** (Add each one):

   | Variable Name | Value |
   |--------------|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `3000` |
   | `DATABASE_URL` | `postgresql://archive_user:your_secure_password_here@archive-resurrection-db:5432/archive_resurrection` |
   | `NEXTAUTH_URL` | `http://your-truenas-ip:9002` |
   | `NEXTAUTH_SECRET` | Generate with: `openssl rand -base64 32` |
   | `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |
   | `GOOGLE_CLIENT_SECRET` | Your Google OAuth Client Secret |
   | `GEMINI_API_KEY` | Your Gemini API key |
   | `STORAGE_PATH` | `/app/data/uploads` |
   | `PUBLIC_URL` | `http://your-truenas-ip:9002` |

4. **Port Forwarding**:
   - Container Port: `3000`
   - Node Port: `9002` (or any available port like 9003, 9004, etc.)
   - Protocol: `TCP`

5. **Storage**:
   - **Host Path Volume**:
     - Host Path: `/mnt/SamsungSSD_2TB/apps/archive-resurrection/uploads`
     - Mount Path: `/app/data`
     - Read Only: ❌ (unchecked)

6. **Advanced Settings** (optional but recommended):
   - **Update Strategy**: "Kill existing pods before creating new ones"
   - **Enable TTY**: ✅ (checked)

7. Click **Save**

---

### Step 3: Configure Google OAuth

**IMPORTANT**: Update your Google OAuth redirect URI to match your TrueNAS URL.

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to your OAuth credentials
3. Add authorized redirect URI:
   ```
   http://your-truenas-ip:9002/api/auth/callback/google
   ```
   Example: `http://192.168.1.100:9002/api/auth/callback/google`

---

### Step 4: Initialize Database

After both containers are running:

1. **Access the app container shell**:
   - In TrueNAS Apps, click on `archive-resurrection`
   - Click **Shell**

2. **Run database migrations**:
   ```bash
   npm run db:push
   ```

3. Exit the shell

---

### Step 5: Access Your Application

Open your browser and navigate to:
```
http://your-truenas-ip:9002
```

Example: `http://192.168.1.100:9002`

You should see the Archive Resurrection homepage!

---

## Quick Reference: TrueNAS Configuration Summary

### PostgreSQL Container
```
Name: archive-resurrection-db
Image: ankane/pgvector:latest
Port: 5432 → 5432
Volume: /mnt/SamsungSSD_2TB/apps/archive-resurrection/postgres-data → /var/lib/postgresql/data
Env:
  - POSTGRES_USER=archive_user
  - POSTGRES_PASSWORD=your_password
  - POSTGRES_DB=archive_resurrection
```

### App Container
```
Name: archive-resurrection
Image: your-dockerhub-username/archive-resurrection:latest
Port: 3000 → 9002
Volume: /mnt/SamsungSSD_2TB/apps/archive-resurrection/uploads → /app/data
Env:
  - NODE_ENV=production
  - PORT=3000
  - DATABASE_URL=postgresql://archive_user:password@archive-resurrection-db:5432/archive_resurrection
  - NEXTAUTH_URL=http://your-ip:9002
  - NEXTAUTH_SECRET=generated-secret
  - GOOGLE_CLIENT_ID=your-id
  - GOOGLE_CLIENT_SECRET=your-secret
  - GEMINI_API_KEY=your-key
  - STORAGE_PATH=/app/data/uploads
  - PUBLIC_URL=http://your-ip:9002
```

---

## Troubleshooting

### Container won't start
- Check logs in TrueNAS Apps → Click container → Logs
- Verify all environment variables are set correctly
- Ensure PostgreSQL container is running first

### Database connection error
- Verify `DATABASE_URL` uses the correct container name: `archive-resurrection-db`
- Check PostgreSQL container is healthy: `docker ps`
- Ensure ports aren't blocked by firewall

### OAuth error
- Verify redirect URI in Google Cloud Console matches exactly: `http://your-ip:9002/api/auth/callback/google`
- Check `NEXTAUTH_URL` environment variable matches your TrueNAS URL

### File upload not working
- Check volume is mounted correctly: `/mnt/SamsungSSD_2TB/apps/archive-resurrection/uploads`
- Verify the directory exists and has correct permissions
- Check app container logs for storage errors

### Port already in use
- Choose a different Node Port (e.g., 9003, 9004)
- Update `NEXTAUTH_URL` and `PUBLIC_URL` to match new port
- Update Google OAuth redirect URI with new port

---

## Updating the Application

To update Archive Resurrection to a new version:

1. **Build and push new image**:
   ```bash
   docker build -t your-dockerhub-username/archive-resurrection:latest .
   docker push your-dockerhub-username/archive-resurrection:latest
   ```

2. **In TrueNAS**:
   - Go to Apps
   - Click on `archive-resurrection`
   - Click **Update** or **Restart**
   - Since Image Pull Policy is "Always", it will fetch the latest image

---

## Backup & Restore

### Backup

**Database**:
```bash
# SSH into TrueNAS
ssh user@truenas-ip

# Backup database
docker exec archive-resurrection-db pg_dump -U archive_user archive_resurrection > backup.sql
```

**Files**:
- Files are stored in: `/mnt/SamsungSSD_2TB/apps/archive-resurrection/uploads`
- Use TrueNAS's built-in snapshot/backup features

### Restore

**Database**:
```bash
# Restore from backup
docker exec -i archive-resurrection-db psql -U archive_user archive_resurrection < backup.sql
```

---

## Security Recommendations

1. **Use strong passwords** for `POSTGRES_PASSWORD` and `NEXTAUTH_SECRET`
2. **Enable HTTPS** if exposing to internet (use reverse proxy like Nginx Proxy Manager)
3. **Firewall rules**: Only expose port 9002 to trusted networks
4. **Regular backups**: Set up automated backups for database and files
5. **Update regularly**: Keep Docker images updated

---

## Next Steps

After deployment:

1. Sign in with Google
2. Upload your first document
3. Start organizing your archive!

For development roadmap and features, see [ROADMAP.md](./ROADMAP.md)

---

## Need Help?

- Check container logs in TrueNAS Apps interface
- Review [SETUP.md](./SETUP.md) for detailed configuration
- Open an issue on GitHub
