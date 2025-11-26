#!/bin/sh
set -e

echo "🚀 Starting Archive Resurrection..."

# Ensure storage directory exists and has correct permissions
# This is needed because Docker volumes may override directory ownership
if [ -n "$STORAGE_PATH" ]; then
  UPLOAD_DIR="$STORAGE_PATH"
else
  UPLOAD_DIR="/app/data/uploads"
fi

echo "📁 Ensuring storage directory exists: $UPLOAD_DIR"

# Create directory if it doesn't exist (as root before switching to nextjs user)
mkdir -p "$UPLOAD_DIR"

# Set correct permissions (will only work if running as root initially)
if [ "$(id -u)" = "0" ]; then
  echo "🔐 Setting permissions on $UPLOAD_DIR"
  chown -R nextjs:nodejs "$UPLOAD_DIR"
  chmod -R 755 "$UPLOAD_DIR"

  # Now switch to nextjs user and execute the main command
  echo "👤 Switching to nextjs user and starting application..."
  exec su-exec nextjs "$@"
else
  # Already running as nextjs user
  echo "✅ Running as nextjs user, starting application..."
  exec "$@"
fi
