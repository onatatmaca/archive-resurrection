/**
 * Database Seed Script: Default Facets
 *
 * This script populates the facets table with a curated set of historical
 * categories for the "Public Truth Repository". These are "Hard Facets" -
 * admin-controlled, required categories that ensure consistent organization.
 *
 * Usage: npm run db:seed
 */

import { db } from '../src/lib/db';
import { facets } from '../src/lib/db/schema';

interface FacetDefinition {
  category: 'era' | 'location' | 'subject' | 'source_type' | 'language' | 'sensitivity';
  value: string;
  slug: string;
  description?: string;
  isRequired: boolean;
  sortOrder: number;
}

const defaultFacets: FacetDefinition[] = [
  // ========================================================================
  // ERA - Historical Time Periods (Required)
  // ========================================================================
  { category: 'era', value: 'Ancient History (Before 500 CE)', slug: 'ancient', description: 'Before the fall of Rome', isRequired: false, sortOrder: 1 },
  { category: 'era', value: 'Medieval Period (500-1500)', slug: 'medieval', description: 'Middle Ages', isRequired: false, sortOrder: 2 },
  { category: 'era', value: 'Early Modern (1500-1800)', slug: 'early-modern', description: 'Renaissance to Enlightenment', isRequired: false, sortOrder: 3 },
  { category: 'era', value: '19th Century', slug: '19th-century', description: '1800-1900', isRequired: false, sortOrder: 4 },
  { category: 'era', value: 'World War I Era (1914-1918)', slug: 'ww1', description: 'The Great War', isRequired: false, sortOrder: 5 },
  { category: 'era', value: 'Interwar Period (1918-1939)', slug: 'interwar', description: 'Between the World Wars', isRequired: false, sortOrder: 6 },
  { category: 'era', value: 'World War II Era (1939-1945)', slug: 'ww2', description: 'Second World War', isRequired: false, sortOrder: 7 },
  { category: 'era', value: 'Cold War (1945-1991)', slug: 'cold-war', description: 'US-Soviet tensions', isRequired: false, sortOrder: 8 },
  { category: 'era', value: 'Post-Cold War (1991-2000)', slug: 'post-cold-war', description: 'End of Soviet Union', isRequired: false, sortOrder: 9 },
  { category: 'era', value: '21st Century', slug: '21st-century', description: '2000-present', isRequired: false, sortOrder: 10 },

  // ========================================================================
  // LOCATION - Geographic Regions (Required for context)
  // ========================================================================
  { category: 'location', value: 'Global/International', slug: 'global', description: 'Worldwide or multi-regional', isRequired: false, sortOrder: 1 },
  { category: 'location', value: 'North America', slug: 'north-america', isRequired: false, sortOrder: 2 },
  { category: 'location', value: 'South America', slug: 'south-america', isRequired: false, sortOrder: 3 },
  { category: 'location', value: 'Europe', slug: 'europe', isRequired: false, sortOrder: 4 },
  { category: 'location', value: 'Middle East', slug: 'middle-east', isRequired: false, sortOrder: 5 },
  { category: 'location', value: 'Africa', slug: 'africa', isRequired: false, sortOrder: 6 },
  { category: 'location', value: 'Asia', slug: 'asia', isRequired: false, sortOrder: 7 },
  { category: 'location', value: 'Oceania', slug: 'oceania', description: 'Australia, Pacific Islands', isRequired: false, sortOrder: 8 },
  { category: 'location', value: 'Turkey/Anatolia', slug: 'turkey', description: 'Ottoman Empire, Republic of Turkey', isRequired: false, sortOrder: 9 },

  // ========================================================================
  // SUBJECT - Primary Topic/Theme (Required)
  // ========================================================================
  { category: 'subject', value: 'Military/Warfare', slug: 'military', description: 'Armed conflict, strategy, battles', isRequired: false, sortOrder: 1 },
  { category: 'subject', value: 'Politics/Government', slug: 'politics', description: 'Political events, elections, policies', isRequired: false, sortOrder: 2 },
  { category: 'subject', value: 'Economics/Trade', slug: 'economics', description: 'Financial systems, commerce', isRequired: false, sortOrder: 3 },
  { category: 'subject', value: 'Social/Cultural', slug: 'social', description: 'Society, culture, movements', isRequired: false, sortOrder: 4 },
  { category: 'subject', value: 'Science/Technology', slug: 'science', description: 'Scientific discoveries, innovations', isRequired: false, sortOrder: 5 },
  { category: 'subject', value: 'Religion/Philosophy', slug: 'religion', description: 'Religious events, theological texts', isRequired: false, sortOrder: 6 },
  { category: 'subject', value: 'Art/Literature', slug: 'art', description: 'Creative works, artistic movements', isRequired: false, sortOrder: 7 },
  { category: 'subject', value: 'Human Rights/Justice', slug: 'human-rights', description: 'Civil rights, legal cases', isRequired: false, sortOrder: 8 },
  { category: 'subject', value: 'Environment/Nature', slug: 'environment', description: 'Ecology, natural disasters', isRequired: false, sortOrder: 9 },
  { category: 'subject', value: 'Personal/Biographical', slug: 'personal', description: 'Individual stories, memoirs', isRequired: false, sortOrder: 10 },

  // ========================================================================
  // SOURCE_TYPE - Document Origin (Required for verification)
  // ========================================================================
  { category: 'source_type', value: 'Government Document', slug: 'government', description: 'Official state records', isRequired: true, sortOrder: 1 },
  { category: 'source_type', value: 'Military Record', slug: 'military-doc', description: 'Armed forces documentation', isRequired: true, sortOrder: 2 },
  { category: 'source_type', value: 'News Media', slug: 'news', description: 'Newspapers, journalism', isRequired: true, sortOrder: 3 },
  { category: 'source_type', value: 'Academic/Research', slug: 'academic', description: 'Scholarly work, studies', isRequired: true, sortOrder: 4 },
  { category: 'source_type', value: 'Personal Correspondence', slug: 'personal', description: 'Letters, diaries, memoirs', isRequired: true, sortOrder: 5 },
  { category: 'source_type', value: 'Legal Document', slug: 'legal', description: 'Court records, contracts', isRequired: true, sortOrder: 6 },
  { category: 'source_type', value: 'Organizational Record', slug: 'organizational', description: 'NGO, corporate, institutional', isRequired: true, sortOrder: 7 },
  { category: 'source_type', value: 'Photograph/Image', slug: 'photo-doc', description: 'Visual documentation', isRequired: true, sortOrder: 8 },
  { category: 'source_type', value: 'Audio/Video Recording', slug: 'media', description: 'Recorded audio/visual material', isRequired: true, sortOrder: 9 },
  { category: 'source_type', value: 'Unknown/Uncertain', slug: 'unknown', description: 'Origin unclear', isRequired: true, sortOrder: 10 },

  // ========================================================================
  // LANGUAGE - Original Language (Auto-detected, can be manually corrected)
  // ========================================================================
  { category: 'language', value: 'English', slug: 'en', isRequired: false, sortOrder: 1 },
  { category: 'language', value: 'Turkish', slug: 'tr', isRequired: false, sortOrder: 2 },
  { category: 'language', value: 'Arabic', slug: 'ar', isRequired: false, sortOrder: 3 },
  { category: 'language', value: 'German', slug: 'de', isRequired: false, sortOrder: 4 },
  { category: 'language', value: 'French', slug: 'fr', isRequired: false, sortOrder: 5 },
  { category: 'language', value: 'Russian', slug: 'ru', isRequired: false, sortOrder: 6 },
  { category: 'language', value: 'Spanish', slug: 'es', isRequired: false, sortOrder: 7 },
  { category: 'language', value: 'Chinese', slug: 'zh', isRequired: false, sortOrder: 8 },
  { category: 'language', value: 'Japanese', slug: 'ja', isRequired: false, sortOrder: 9 },
  { category: 'language', value: 'Ottoman Turkish', slug: 'ota', description: 'Pre-1928 Turkish script', isRequired: false, sortOrder: 10 },
  { category: 'language', value: 'Latin', slug: 'la', description: 'Classical or Medieval Latin', isRequired: false, sortOrder: 11 },
  { category: 'language', value: 'Multiple Languages', slug: 'multi', isRequired: false, sortOrder: 12 },
  { category: 'language', value: 'Unknown', slug: 'unknown-lang', isRequired: false, sortOrder: 13 },

  // ========================================================================
  // SENSITIVITY - Access Level (Required for moderation)
  // ========================================================================
  { category: 'sensitivity', value: 'Public', slug: 'public', description: 'Safe for all audiences', isRequired: true, sortOrder: 1 },
  { category: 'sensitivity', value: 'Sensitive Content', slug: 'sensitive', description: 'Mature themes, requires warning', isRequired: true, sortOrder: 2 },
  { category: 'sensitivity', value: 'Graphic/Violent', slug: 'graphic', description: 'War imagery, violence (auto-blurred)', isRequired: true, sortOrder: 3 },
  { category: 'sensitivity', value: 'Restricted', slug: 'restricted', description: 'Admin approval required', isRequired: true, sortOrder: 4 },
];

async function seedFacets() {
  console.log('🌱 Seeding facets database...\n');

  try {
    // Check if facets already exist
    const existingFacets = await db.select().from(facets).limit(1);

    if (existingFacets.length > 0) {
      console.log('⚠️  Facets already seeded. Skipping...');
      console.log('   To re-seed, manually delete facets table and run again.\n');
      return;
    }

    // Insert all facets
    let inserted = 0;
    for (const facet of defaultFacets) {
      await db.insert(facets).values({
        category: facet.category,
        value: facet.value,
        slug: facet.slug,
        description: facet.description || null,
        isRequired: facet.isRequired,
        sortOrder: facet.sortOrder,
      });
      inserted++;
    }

    console.log(`✅ Successfully seeded ${inserted} facets!\n`);

    // Print summary
    const categories = Array.from(new Set(defaultFacets.map(f => f.category)));
    console.log('📊 Facet Categories:');
    for (const cat of categories) {
      const count = defaultFacets.filter(f => f.category === cat).length;
      const required = defaultFacets.filter(f => f.category === cat && f.isRequired).length;
      console.log(`   - ${cat}: ${count} options${required > 0 ? ` (${required} required)` : ''}`);
    }
    console.log('\n✨ Database ready for use!\n');

  } catch (error) {
    console.error('❌ Error seeding facets:', error);
    throw error;
  }
}

// Run the seed function
seedFacets()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
