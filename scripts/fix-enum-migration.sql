-- Fix for enum migration error: wiki_page already exists
-- Run this script if you get "enum label wiki_page already exists" error

-- Check if wiki_page exists in the enum
DO $$
BEGIN
    -- Try to add wiki_page to item_type enum if it doesn't exist
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'item_type' AND e.enumlabel = 'wiki_page'
    ) THEN
        ALTER TYPE item_type ADD VALUE 'wiki_page';
        RAISE NOTICE 'Added wiki_page to item_type enum';
    ELSE
        RAISE NOTICE 'wiki_page already exists in item_type enum - no action needed';
    END IF;
END$$;

-- Verify all expected enum values exist
SELECT enumlabel as "Enum Values"
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'item_type'
ORDER BY enumlabel;
