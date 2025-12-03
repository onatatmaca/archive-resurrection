-- Phase 0 Migration Script
-- Handles data type conversions that can't be done automatically

-- Fix usage_count column type conversion (text -> integer)
-- This needs USING clause because PostgreSQL can't auto-cast text to integer
ALTER TABLE tags
  ALTER COLUMN usage_count TYPE integer
  USING CASE
    WHEN usage_count ~ '^[0-9]+$' THEN usage_count::integer
    ELSE 0
  END;

-- Drop wiki_content column if it exists (Phase 0 cleanup)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'archive_items'
    AND column_name = 'wiki_content'
  ) THEN
    ALTER TABLE archive_items DROP COLUMN wiki_content;
  END IF;
END $$;

-- Note: Other schema changes (new tables, new columns) should be handled by drizzle-kit push
