-- Phase 3.5: Add isPlaceholder flag to archive_items table
-- This allows toggling placeholder/example data visibility in admin dashboard

-- Add isPlaceholder column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'archive_items'
    AND column_name = 'is_placeholder'
  ) THEN
    ALTER TABLE archive_items
    ADD COLUMN is_placeholder BOOLEAN DEFAULT false;

    COMMENT ON COLUMN archive_items.is_placeholder IS 'Phase 3.5 - Marks demo/example data that can be hidden in production';

    RAISE NOTICE 'Added is_placeholder column to archive_items table';
  ELSE
    RAISE NOTICE 'Column is_placeholder already exists in archive_items table';
  END IF;
END $$;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS placeholder_idx ON archive_items(is_placeholder);

RAISE NOTICE 'Phase 3.5 migration complete!';
