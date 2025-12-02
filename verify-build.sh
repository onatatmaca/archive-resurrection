#!/bin/bash
# Verification script to check if all required files exist before Docker build

echo "🔍 Verifying build requirements..."
echo ""

# Check if in correct directory
if [ ! -f "package.json" ]; then
  echo "❌ ERROR: Not in repository root directory"
  echo "   Please cd to archive-resurrection directory first"
  exit 1
fi

# Check required files
REQUIRED_FILES=(
  "Dockerfile"
  "docker-entrypoint.sh"
  "package.json"
  "next.config.js"
  "src/lib/db/schema.ts"
)

echo "Checking required files:"
for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ MISSING: $file"
    exit 1
  fi
done

echo ""
echo "Checking docker-entrypoint.sh:"
if [ -f "docker-entrypoint.sh" ]; then
  # Check if it's executable
  if [ -x "docker-entrypoint.sh" ]; then
    echo "  ✅ File exists and is executable"
  else
    echo "  ⚠️  File exists but not executable (will be fixed in Docker)"
  fi

  # Check line endings
  if file docker-entrypoint.sh | grep -q "CRLF"; then
    echo "  ❌ ERROR: File has Windows line endings (CRLF)"
    echo "     Run: dos2unix docker-entrypoint.sh"
    exit 1
  else
    echo "  ✅ File has Unix line endings (LF)"
  fi

  # Check shebang
  FIRST_LINE=$(head -n 1 docker-entrypoint.sh)
  if [ "$FIRST_LINE" = "#!/bin/sh" ]; then
    echo "  ✅ Shebang is correct"
  else
    echo "  ❌ ERROR: Invalid shebang: $FIRST_LINE"
    exit 1
  fi
else
  echo "  ❌ ERROR: docker-entrypoint.sh not found"
  exit 1
fi

echo ""
echo "✅ All checks passed! Ready to build Docker image."
echo ""
echo "Run these commands:"
echo "  docker build --no-cache -t onatatmaca/archive-resurrection:latest ."
echo "  docker push onatatmaca/archive-resurrection:latest"
