-- Fix missing columns in users table
-- Run this if you get "column preferred_language does not exist" errors

-- Add preferred_language column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user' AND column_name = 'preferred_language'
  ) THEN
    ALTER TABLE "user" ADD COLUMN preferred_language text DEFAULT 'en';
    RAISE NOTICE 'Added preferred_language column';
  ELSE
    RAISE NOTICE 'preferred_language column already exists';
  END IF;
END $$;

-- Add is_admin column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE "user" ADD COLUMN is_admin boolean DEFAULT false;
    RAISE NOTICE 'Added is_admin column';
  ELSE
    RAISE NOTICE 'is_admin column already exists';
  END IF;
END $$;

-- Add sha256_hash column to archive_items if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'archive_items' AND column_name = 'sha256_hash'
  ) THEN
    ALTER TABLE archive_items ADD COLUMN sha256_hash text;
    RAISE NOTICE 'Added sha256_hash column';
  ELSE
    RAISE NOTICE 'sha256_hash column already exists';
  END IF;
END $$;

-- Add original_language column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'archive_items' AND column_name = 'original_language'
  ) THEN
    ALTER TABLE archive_items ADD COLUMN original_language text;
    RAISE NOTICE 'Added original_language column';
  ELSE
    RAISE NOTICE 'original_language column already exists';
  END IF;
END $$;

-- Add ai_processing_enabled column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'archive_items' AND column_name = 'ai_processing_enabled'
  ) THEN
    ALTER TABLE archive_items ADD COLUMN ai_processing_enabled boolean DEFAULT true;
    RAISE NOTICE 'Added ai_processing_enabled column';
  ELSE
    RAISE NOTICE 'ai_processing_enabled column already exists';
  END IF;
END $$;

-- Add ai_processed_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'archive_items' AND column_name = 'ai_processed_at'
  ) THEN
    ALTER TABLE archive_items ADD COLUMN ai_processed_at timestamp;
    RAISE NOTICE 'Added ai_processed_at column';
  ELSE
    RAISE NOTICE 'ai_processed_at column already exists';
  END IF;
END $$;

-- Add is_published column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'archive_items' AND column_name = 'is_published'
  ) THEN
    ALTER TABLE archive_items ADD COLUMN is_published boolean DEFAULT false;
    RAISE NOTICE 'Added is_published column';
  ELSE
    RAISE NOTICE 'is_published column already exists';
  END IF;
END $$;

-- Add is_sensitive column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'archive_items' AND column_name = 'is_sensitive'
  ) THEN
    ALTER TABLE archive_items ADD COLUMN is_sensitive boolean DEFAULT false;
    RAISE NOTICE 'Added is_sensitive column';
  ELSE
    RAISE NOTICE 'is_sensitive column already exists';
  END IF;
END $$;

-- Add metadata column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'archive_items' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE archive_items ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added metadata column';
  ELSE
    RAISE NOTICE 'metadata column already exists';
  END IF;
END $$;

SELECT 'All missing columns have been checked and added if necessary!' AS status;
