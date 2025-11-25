# Setup Guide for Archive Resurrection

This guide will walk you through setting up Archive Resurrection for local development.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** and **npm** installed
- **PostgreSQL 14+** installed
- **Git** for version control
- Accounts for:
  - Google Cloud (for OAuth and Gemini API)
  - AWS (for S3 storage)

---

## Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/archive-resurrection.git
cd archive-resurrection

# Install dependencies
npm install
```

---

## Step 2: PostgreSQL Setup

### Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from [postgresql.org](https://www.postgresql.org/download/)

### Install pgvector Extension

```bash
# Clone pgvector
git clone https://github.com/pgvector/pgvector.git
cd pgvector

# Build and install (requires pg_config in PATH)
make
sudo make install

# Or on macOS with Homebrew:
brew install pgvector
```

### Create Database

```bash
# Create database
createdb archive_resurrection

# Connect and enable pgvector
psql archive_resurrection

# In psql:
CREATE EXTENSION vector;
\q
```

### Get Database URL

Your `DATABASE_URL` should look like:
```
postgresql://username:password@localhost:5432/archive_resurrection
```

For local development with default PostgreSQL setup:
```
postgresql://postgres@localhost:5432/archive_resurrection
```

---

## Step 3: Google Cloud Setup

### OAuth (for User Authentication)

1. **Go to [Google Cloud Console](https://console.cloud.google.com)**

2. **Create a new project** (or select existing):
   - Click "Select a project" → "New Project"
   - Name: "Archive Resurrection"
   - Click "Create"

3. **Enable Google+ API**:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Configure OAuth Consent Screen**:
   - Go to "APIs & Services" → "OAuth consent screen"
   - Select "External" (or "Internal" if using Google Workspace)
   - Fill in:
     - App name: Archive Resurrection
     - User support email: your-email@example.com
     - Developer contact: your-email@example.com
   - Click "Save and Continue"
   - Add scopes: `userinfo.email`, `userinfo.profile`
   - Click "Save and Continue"
   - Add test users (your email)
   - Click "Save and Continue"

5. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "Archive Resurrection Web Client"
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - (Add production URL later: `https://yourdomain.com/api/auth/callback/google`)
   - Click "Create"
   - **Save the Client ID and Client Secret** (you'll need these for `.env`)

### Gemini API (for AI Features)

1. **Go to [Google AI Studio](https://makersuite.google.com/app/apikey)**

2. **Create API Key**:
   - Click "Create API Key"
   - Select your Google Cloud project (or create new)
   - Copy the API key

3. **Enable Gemini API**:
   - In Google Cloud Console, go to "APIs & Services" → "Library"
   - Search for "Generative Language API"
   - Click "Enable"

---

## Step 4: AWS S3 Setup

### Create S3 Bucket

1. **Log in to [AWS Console](https://console.aws.amazon.com)**

2. **Navigate to S3**:
   - Services → S3
   - Click "Create bucket"

3. **Configure Bucket**:
   - Bucket name: `archive-resurrection-files` (must be globally unique)
   - Region: `us-east-1` (or your preferred region)
   - **Block Public Access**: Uncheck (or configure for presigned URLs)
   - Click "Create bucket"

4. **Configure CORS** (for direct uploads):
   - Select your bucket → Permissions → CORS
   - Add this configuration:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["http://localhost:3000"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

### Create IAM User

1. **Navigate to IAM**:
   - Services → IAM → Users
   - Click "Add users"

2. **Create User**:
   - User name: `archive-resurrection-app`
   - Access type: "Programmatic access"
   - Click "Next"

3. **Set Permissions**:
   - Click "Attach policies directly"
   - Search and select: `AmazonS3FullAccess` (or create custom policy)
   - Click "Next" → "Create user"

4. **Save Credentials**:
   - **Access Key ID** and **Secret Access Key** will be shown once
   - Download CSV or copy to secure location

### Custom S3 Policy (Recommended for Production)

Instead of `AmazonS3FullAccess`, create a custom policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::archive-resurrection-files/*",
        "arn:aws:s3:::archive-resurrection-files"
      ]
    }
  ]
}
```

---

## Step 5: Environment Variables

1. **Copy example environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your credentials**:
   ```bash
   # Database
   DATABASE_URL="postgresql://postgres@localhost:5432/archive_resurrection"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="<generate-this-see-below>"

   # Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"

   # Google Gemini API
   GEMINI_API_KEY="your-gemini-api-key"

   # AWS S3
   AWS_REGION="us-east-1"
   AWS_ACCESS_KEY_ID="your-aws-access-key-id"
   AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key"
   S3_BUCKET_NAME="archive-resurrection-files"

   # Application
   NODE_ENV="development"
   ```

3. **Generate `NEXTAUTH_SECRET`**:
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and paste it as `NEXTAUTH_SECRET` in `.env`

---

## Step 6: Database Migration

Run Drizzle migrations to create database tables:

```bash
npm run db:push
```

This will:
- Create all tables (`users`, `accounts`, `sessions`, `archive_items`, `tags`)
- Set up indexes
- Enable vector extension

To view your database schema in a GUI:
```bash
npm run db:studio
```
This opens Drizzle Studio at `https://local.drizzle.studio`

---

## Step 7: Start Development Server

```bash
npm run dev
```

Open your browser and navigate to:
**http://localhost:3000**

You should see the Archive Resurrection homepage!

---

## Step 8: Test Authentication

1. Click "Sign In" in the navbar
2. Sign in with your Google account
3. You should be redirected back to the homepage, now authenticated
4. Your name and profile picture should appear in the navbar

---

## Troubleshooting

### Database Connection Error

**Error**: `Error: connect ECONNREFUSED`

**Solution**:
- Ensure PostgreSQL is running: `brew services list` (macOS) or `sudo systemctl status postgresql` (Linux)
- Check your `DATABASE_URL` in `.env`
- Test connection: `psql $DATABASE_URL`

### pgvector Extension Error

**Error**: `ERROR: extension "vector" does not exist`

**Solution**:
```bash
psql archive_resurrection -c "CREATE EXTENSION vector;"
```

### Google OAuth Error

**Error**: `redirect_uri_mismatch`

**Solution**:
- Ensure redirect URI in Google Cloud Console exactly matches: `http://localhost:3000/api/auth/callback/google`
- Check `NEXTAUTH_URL` in `.env` is `http://localhost:3000`

### S3 Upload Error

**Error**: `Access Denied` or `InvalidAccessKeyId`

**Solution**:
- Verify AWS credentials in `.env`
- Check IAM user has S3 permissions
- Verify bucket name is correct
- Check bucket region matches `AWS_REGION` in `.env`

### Gemini API Error

**Error**: `API key not valid`

**Solution**:
- Ensure Generative Language API is enabled in Google Cloud
- Check API key is correct in `.env`
- Verify you're not hitting rate limits (free tier)

---

## Development Tips

### Hot Reload
Next.js automatically reloads when you make changes to:
- React components
- API routes
- CSS files

### Database Changes
After modifying `src/lib/db/schema.ts`:
```bash
npm run db:generate  # Generate migration
npm run db:push      # Apply to database
```

### View Database
```bash
npm run db:studio
```

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npx tsc --noEmit
```

---

## Next Steps

Now that your environment is set up:

1. **Explore the codebase**: Start with `src/app/page.tsx` and `src/lib/db/schema.ts`
2. **Check the roadmap**: See [ROADMAP.md](./ROADMAP.md) for planned features
3. **Start developing**: Implement Phase 1.2 (Upload Endpoint) - see roadmap for details
4. **Run tests** (when implemented): `npm test`

---

## Production Deployment (Vercel)

When ready to deploy:

1. **Push to GitHub**
2. **Import to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
3. **Set Environment Variables** in Vercel dashboard
4. **Update OAuth redirect URIs** in Google Cloud Console
5. **Deploy!**

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md) (coming soon).

---

**Need Help?**

- Check the [README](./README.md) for overview
- See [ROADMAP.md](./ROADMAP.md) for development phases
- Open an issue on GitHub
