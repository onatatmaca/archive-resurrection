# 🚨 Phase 1.2 Deployment Troubleshooting Guide

## Problem
New upload UI features not visible on live site despite successful deployment.

## Code Verification ✅
- ✅ Code is correct in repository
- ✅ Build contains new features
- ✅ Branch merged to main

## Most Likely Issues & Fixes

### 1. Docker Build Cache (MOST LIKELY)
Docker may have used cached layers and didn't rebuild with new code.

**Fix:**
```bash
# Force rebuild without cache
docker build --no-cache -t onatatmaca/archive-resurrection:latest .
docker push onatatmaca/archive-resurrection:latest

# Or use a new tag
docker build -t onatatmaca/archive-resurrection:phase-1.2-$(date +%s) .
docker push onatatmaca/archive-resurrection:phase-1.2-$(date +%s)
```

### 2. TrueNAS Container Not Updated
The container may still be running the old image.

**Fix:**
```bash
# In TrueNAS, completely remove and recreate the container
# OR force pull the latest image:
docker pull onatatmaca/archive-resurrection:latest --no-cache
docker restart <container-name>
```

### 3. Browser Cache
Your browser is showing the old cached version.

**Fix:**
- Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Or open in private/incognito window
- Or clear browser cache completely

### 4. Next.js Server Cache
Next.js may have cached the old pages.

**Fix:**
```bash
# Rebuild completely
rm -rf .next
npm run build
docker build --no-cache -t onatatmaca/archive-resurrection:latest .
```

## Verification Steps

### Step 1: Verify Local Build
```bash
cd /home/user/archive-resurrection
grep "Classification & Metadata" .next/server/app/upload/page.js
grep "AI-Powered Processing" .next/server/app/upload/page.js
```
If both return results, local build is correct. ✅ **VERIFIED**

### Step 2: Verify Docker Image
```bash
# Check what's in the Docker image
docker run --rm onatatmaca/archive-resurrection:latest \
  cat /app/.next/server/app/upload/page.js | grep "Classification & Metadata"
```
If it returns the string, Docker image has new code.
If empty, Docker image is outdated! 🚨

### Step 3: Verify Running Container
```bash
# SSH into TrueNAS and check running container
docker exec <container-name> cat /app/.next/server/app/upload/page.js | grep "Classification & Metadata"
```
If empty, container is running old code! 🚨

### Step 4: Check Browser
1. Open developer console (F12)
2. Go to Network tab
3. Navigate to `/upload`
4. Look for the page request
5. Check if response contains "Classification & Metadata"
6. If not, it's definitely a cache issue

## Quick Nuclear Option 🧨

If nothing else works:

```bash
# 1. Delete everything
rm -rf .next
rm -rf node_modules

# 2. Fresh install
npm install

# 3. Fresh build
npm run build

# 4. Force Docker rebuild with new tag
export TAG="phase-1.2-$(date +%s)"
docker build --no-cache -t onatatmaca/archive-resurrection:$TAG .
docker push onatatmaca/archive-resurrection:$TAG

# 5. Update TrueNAS to use the new tag
echo "Update TrueNAS container to use tag: $TAG"
```

## What Should You See?

When it's working correctly, `/upload` should show:

1. **File Upload Section** with SHA-256 hash display
2. **Classification & Metadata** section with 6 facet dropdowns
   - Source Type (required, red label)
   - Sensitivity (required, red label)
   - Era, Location, Subject, Language (optional)
3. **Date Information** section with Exact/Period toggle
4. **AI-Powered Processing** section (purple gradient) with toggle and cost estimate
5. **Tags** input with helper text

## Debug Checklist

- [ ] Cleared browser cache / tried incognito
- [ ] Verified local build has new code
- [ ] Rebuilt Docker image with `--no-cache`
- [ ] Pushed new Docker image
- [ ] Pulled latest image in TrueNAS
- [ ] Restarted/recreated container
- [ ] Checked browser network tab for cached responses
- [ ] Verified running container has new code

## Still Not Working?

Check these:

1. **Wrong URL?** Make sure you're at `http://192.168.0.217.nip.io:9002/upload`
2. **Different container?** Ensure you're updating the correct container
3. **Port mapping?** Verify port 9002 is mapped to the right container
4. **Old deployment?** Check if there are multiple deployments running

---

**Created:** December 3, 2025
**Issue:** Phase 1.2 UI not appearing in production
**Status:** Awaiting deployment fix verification
