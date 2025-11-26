import { sql } from 'drizzle-orm';
import { db } from '../src/lib/db';

/**
 * Fix migration errors by ensuring database schema matches code
 * Handles the "enum label wiki_page already exists" error
 */
async function fixMigration() {
  console.log('🔧 Fixing database migration issues...\n');

  try {
    // Check if wiki_page exists in item_type enum
    const result = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'item_type' AND e.enumlabel = 'wiki_page'
    `);

    const count = parseInt(result.rows[0]?.count as string || '0');

    if (count === 0) {
      console.log('➕ Adding wiki_page to item_type enum...');
      await db.execute(sql`ALTER TYPE item_type ADD VALUE 'wiki_page'`);
      console.log('✅ Successfully added wiki_page');
    } else {
      console.log('✅ wiki_page already exists in item_type enum');
    }

    // Verify all enum values
    console.log('\n📋 Current enum values:');
    const enumValues = await db.execute(sql`
      SELECT enumlabel
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'item_type'
      ORDER BY enumlabel
    `);

    enumValues.rows.forEach((row: any) => {
      console.log(`  - ${row.enumlabel}`);
    });

    // Check if wikiContent column exists
    console.log('\n🔍 Checking schema columns...');
    const columns = await db.execute(sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'archive_items'
      ORDER BY column_name
    `);

    const hasWikiContent = columns.rows.some((row: any) => row.column_name === 'wiki_content');
    if (hasWikiContent) {
      console.log('✅ wiki_content column exists');
    } else {
      console.log('⚠️  wiki_content column missing - will be added by db:push');
    }

    console.log('\n✅ Migration fix complete! You can now run: npm run db:push');
  } catch (error) {
    console.error('❌ Error fixing migration:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

fixMigration();
