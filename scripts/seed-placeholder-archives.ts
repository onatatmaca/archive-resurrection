/**
 * Phase 3.5: Seed 100 Placeholder Historical Archives (1880-1945)
 *
 * Creates realistic placeholder data for testing and demonstration
 * All items marked with isPlaceholder=true for easy toggling in admin
 *
 * Run: npx ts-node scripts/seed-placeholder-archives.ts
 */

import { db } from '../src/lib/db';
import { archiveItems, archiveDates, archiveItemFacets, users, facets } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

// Historical archive templates (1880-1945)
const archiveTemplates = [
  // World War I Era (1914-1918)
  { title: 'Telegram from the Western Front', type: 'document' as const, description: 'Military communication regarding troop movements', year: 1917, tags: ['wwi', 'military', 'communication'], subject: 'Military', era: 'World War I', sourceType: 'Military', sensitivity: 'Public' },
  { title: 'Propaganda Poster - War Bonds', type: 'photo' as const, description: 'Original WWI propaganda encouraging war bond purchases', year: 1918, tags: ['wwi', 'propaganda', 'finance'], subject: 'Politics', era: 'World War I', sourceType: 'Government', sensitivity: 'Public' },
  { title: 'Trench Warfare Photograph', type: 'photo' as const, description: 'Soldiers in trenches on the Western Front', year: 1916, tags: ['wwi', 'warfare', 'photography'], subject: 'Military', era: 'World War I', sourceType: 'Military', sensitivity: 'Public' },
  { title: 'Treaty of Versailles Draft', type: 'document' as const, description: 'Working draft of the peace treaty ending WWI', year: 1919, tags: ['wwi', 'treaty', 'diplomacy'], subject: 'Politics', era: 'World War I', sourceType: 'Government', sensitivity: 'Public' },

  // Interwar Period (1919-1939)
  { title: 'Jazz Age Dance Hall Program', type: 'document' as const, description: 'Entertainment program from a 1920s dance hall', year: 1925, tags: ['culture', 'jazz', 'entertainment'], subject: 'Culture', era: 'Interwar Period', sourceType: 'Media', sensitivity: 'Public' },
  { title: 'Stock Market Crash Newspaper', type: 'document' as const, description: 'Front page coverage of the 1929 market collapse', year: 1929, tags: ['economy', 'crisis', 'news'], subject: 'Economics', era: 'Interwar Period', sourceType: 'Media', sensitivity: 'Public' },
  { title: 'Great Depression Bread Line Photo', type: 'photo' as const, description: 'Documentary photograph of unemployment during the Depression', year: 1932, tags: ['depression', 'poverty', 'documentary'], subject: 'Economics', era: 'Interwar Period', sourceType: 'Media', sensitivity: 'Public' },
  { title: 'New Deal Program Pamphlet', type: 'document' as const, description: 'Government information about Roosevelt\'s New Deal programs', year: 1935, tags: ['new-deal', 'government', 'relief'], subject: 'Politics', era: 'Interwar Period', sourceType: 'Government', sensitivity: 'Public' },

  // World War II Era (1939-1945)
  { title: 'D-Day Landing Orders', type: 'document' as const, description: 'Military orders for the Normandy invasion', year: 1944, tags: ['wwii', 'military', 'd-day'], subject: 'Military', era: 'World War II', sourceType: 'Military', sensitivity: 'Sensitive' },
  { title: 'Rosie the Riveter Poster', type: 'photo' as const, description: 'Iconic wartime propaganda promoting women in industry', year: 1943, tags: ['wwii', 'propaganda', 'women'], subject: 'Culture', era: 'World War II', sourceType: 'Government', sensitivity: 'Public' },
  { title: 'Ration Book Collection', type: 'archive' as const, description: 'Family collection of wartime ration books and stamps', year: 1942, tags: ['wwii', 'rationing', 'civilian'], subject: 'Society', era: 'World War II', sourceType: 'Personal', sensitivity: 'Public' },
  { title: 'V-E Day Celebration Photo', type: 'photo' as const, description: 'Crowds celebrating Victory in Europe', year: 1945, tags: ['wwii', 'victory', 'celebration'], subject: 'Culture', era: 'World War II', sourceType: 'Media', sensitivity: 'Public' },

  // Victorian Era (1880-1901)
  { title: 'Victorian Trade Card Collection', type: 'archive' as const, description: 'Advertising cards from the late Victorian period', year: 1895, tags: ['victorian', 'advertising', 'commerce'], subject: 'Commerce', era: 'Victorian Era', sourceType: 'Commercial', sensitivity: 'Public' },
  { title: 'Steam Locomotive Blueprint', type: 'document' as const, description: 'Technical drawings of a late 19th century locomotive', year: 1888, tags: ['victorian', 'technology', 'railroad'], subject: 'Technology', era: 'Victorian Era', sourceType: 'Commercial', sensitivity: 'Public' },
  { title: 'Family Portrait - 1890s', type: 'photo' as const, description: 'Formal Victorian family portrait', year: 1894, tags: ['victorian', 'portrait', 'family'], subject: 'Society', era: 'Victorian Era', sourceType: 'Personal', sensitivity: 'Public' },
  { title: 'Suffragette Movement Pamphlet', type: 'document' as const, description: 'Women\'s suffrage campaign literature', year: 1897, tags: ['victorian', 'suffrage', 'politics'], subject: 'Politics', era: 'Victorian Era', sourceType: 'Political', sensitivity: 'Public' },

  // Early 1900s Technology & Innovation
  { title: 'Wright Brothers Flight Log', type: 'document' as const, description: 'Pilot log from early aviation experiments', year: 1903, tags: ['aviation', 'technology', 'innovation'], subject: 'Technology', era: 'Edwardian Era', sourceType: 'Personal', sensitivity: 'Public' },
  { title: 'Ford Model T Advertisement', type: 'document' as const, description: 'Original advertising for the Model T automobile', year: 1908, tags: ['automobile', 'commerce', 'innovation'], subject: 'Commerce', era: 'Edwardian Era', sourceType: 'Commercial', sensitivity: 'Public' },
  { title: 'Titanic Passenger Manifest', type: 'document' as const, description: 'Official passenger list from the ill-fated voyage', year: 1912, tags: ['titanic', 'maritime', 'disaster'], subject: 'Transportation', era: 'Edwardian Era', sourceType: 'Commercial', sensitivity: 'Sensitive' },
  { title: 'Edison Phonograph Patent', type: 'document' as const, description: 'Patent documents for early sound recording device', year: 1889, tags: ['technology', 'patent', 'innovation'], subject: 'Technology', era: 'Victorian Era', sourceType: 'Government', sensitivity: 'Public' },

  // Political & Social Movements
  { title: 'Socialist Party Rally Photo', type: 'photo' as const, description: 'Labor movement gathering in early 20th century', year: 1910, tags: ['labor', 'politics', 'socialism'], subject: 'Politics', era: 'Edwardian Era', sourceType: 'Political', sensitivity: 'Public' },
  { title: 'Prohibition Era Speakeasy Map', type: 'document' as const, description: 'Secret locations of illegal drinking establishments', year: 1925, tags: ['prohibition', 'crime', 'society'], subject: 'Society', era: 'Interwar Period', sourceType: 'Personal', sensitivity: 'Sensitive' },
  { title: 'Women\'s Voting Rights Poster', type: 'photo' as const, description: 'Poster celebrating women\'s enfranchisement', year: 1920, tags: ['suffrage', 'politics', 'women'], subject: 'Politics', era: 'Interwar Period', sourceType: 'Political', sensitivity: 'Public' },
  { title: 'Labor Union Strike Photo', type: 'photo' as const, description: 'Workers on strike demanding better conditions', year: 1926, tags: ['labor', 'strike', 'workers'], subject: 'Economics', era: 'Interwar Period', sourceType: 'Media', sensitivity: 'Public' },
];

// Additional varied templates
const additionalTemplates = [
  { title: 'Imperial Russian Postcard', type: 'photo' as const, description: 'Pre-revolution postcard from St. Petersburg', year: 1913, tags: ['russia', 'imperial', 'history'], subject: 'Culture', era: 'Edwardian Era', sourceType: 'Personal', sensitivity: 'Public' },
  { title: 'Ottoman Empire Map', type: 'document' as const, description: 'Historical map of Ottoman territories', year: 1914, tags: ['ottoman', 'map', 'history'], subject: 'Geography', era: 'World War I', sourceType: 'Government', sensitivity: 'Public' },
  { title: 'Spanish Flu Quarantine Notice', type: 'document' as const, description: 'Public health notice during 1918 pandemic', year: 1918, tags: ['pandemic', 'health', 'quarantine'], subject: 'Society', era: 'World War I', sourceType: 'Government', sensitivity: 'Public' },
  { title: 'League of Nations Document', type: 'document' as const, description: 'Official correspondence from the League', year: 1928, tags: ['diplomacy', 'international', 'peace'], subject: 'Politics', era: 'Interwar Period', sourceType: 'Government', sensitivity: 'Public' },
  { title: 'Lindbergh Transatlantic Flight Photo', type: 'photo' as const, description: 'Celebration of first solo Atlantic crossing', year: 1927, tags: ['aviation', 'lindbergh', 'achievement'], subject: 'Technology', era: 'Interwar Period', sourceType: 'Media', sensitivity: 'Public' },
  { title: 'Berlin Olympics Program', type: 'document' as const, description: 'Official program from the 1936 Olympics', year: 1936, tags: ['olympics', 'sports', 'berlin'], subject: 'Culture', era: 'Interwar Period', sourceType: 'Government', sensitivity: 'Sensitive' },
  { title: 'Pearl Harbor Attack Report', type: 'document' as const, description: 'Military incident report from December 7, 1941', year: 1941, tags: ['wwii', 'pearl-harbor', 'military'], subject: 'Military', era: 'World War II', sourceType: 'Military', sensitivity: 'Sensitive' },
  { title: 'War Production Poster', type: 'photo' as const, description: 'Industrial mobilization propaganda', year: 1942, tags: ['wwii', 'production', 'propaganda'], subject: 'Economics', era: 'World War II', sourceType: 'Government', sensitivity: 'Public' },
  { title: 'Blitz Damage Photograph', type: 'photo' as const, description: 'London after German bombing raid', year: 1940, tags: ['wwii', 'blitz', 'london'], subject: 'Military', era: 'World War II', sourceType: 'Media', sensitivity: 'Public' },
  { title: 'Manhattan Project Memo', type: 'document' as const, description: 'Declassified communication about atomic research', year: 1943, tags: ['wwii', 'atomic', 'science'], subject: 'Technology', era: 'World War II', sourceType: 'Military', sensitivity: 'Sensitive' },
];

async function seedPlaceholderArchives() {
  console.log('🌱 Starting placeholder archives seed...');

  try {
    // Get the first user (assumed to be admin/seed user)
    const systemUser = await db.query.users.findFirst();

    if (!systemUser) {
      console.error('❌ No user found. Please create a user first.');
      process.exit(1);
    }

    console.log(`✅ Using user: ${systemUser.email}`);

    // Get all facets for mapping
    const allFacets = await db.query.facets.findMany();
    const facetMap = new Map(allFacets.map(f => [`${f.category}:${f.value}`, f.id]));

    // Generate 100 archives by mixing templates
    const archives = [];
    let templateIndex = 0;

    for (let i = 0; i < 100; i++) {
      const template = [...archiveTemplates, ...additionalTemplates][templateIndex % (archiveTemplates.length + additionalTemplates.length)];
      templateIndex++;

      // Randomize year within era
      const baseYear = template.year || 1900 + Math.floor(Math.random() * 45);
      const yearVariation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
      const finalYear = Math.max(1880, Math.min(1945, baseYear + yearVariation));

      archives.push({
        ...template,
        title: `${template.title} ${i > archiveTemplates.length + additionalTemplates.length - 1 ? `(${Math.floor(i / (archiveTemplates.length + additionalTemplates.length)) + 1})` : ''}`.trim(),
        year: finalYear,
      });
    }

    console.log(`📦 Creating ${archives.length} placeholder archives...`);

    let created = 0;
    let skipped = 0;

    for (const archive of archives) {
      // Create archive item
      const [newItem] = await db.insert(archiveItems).values({
        title: archive.title,
        description: archive.description || `Historical archive from ${archive.year}`,
        type: archive.type,
        fileUrl: null, // Placeholder - no actual file
        fileName: `${archive.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`,
        fileSize: String(Math.floor(Math.random() * 5000000) + 100000), // Random size 100KB-5MB
        mimeType: archive.type === 'photo' ? 'image/jpeg' : 'application/pdf',
        sha256Hash: null, // Placeholder items don't need hash
        contentText: archive.description || '',
        originalLanguage: 'en',
        tags: archive.tags || ['historical', 'archive', String(archive.year)],
        metadata: {
          isPlaceholder: true,
          generatedBy: 'seed-placeholder-archives.ts',
          historicalPeriod: `${archive.year}s`,
        },
        aiProcessingEnabled: false, // Don't waste AI credits on placeholders
        aiProcessedAt: null,
        isPublished: true, // Make visible immediately
        isSensitive: archive.sensitivity === 'Sensitive' || false,
        isPlaceholder: true, // ⭐ Mark as placeholder
        uploaderId: systemUser.id,
      }).returning();

      // Create fuzzy date (using ISO date strings YYYY-MM-DD)
      const startDateStr = `${archive.year}-01-01`;
      const endDateStr = `${archive.year}-12-31`;
      const isApproximate = Math.random() > 0.6; // 40% exact, 60% fuzzy

      await db.insert(archiveDates).values({
        itemId: newItem.id,
        dateStart: startDateStr,
        dateEnd: endDateStr,
        displayDate: isApproximate ? `circa ${archive.year}` : `${archive.year}`,
        isApproximate,
        precision: isApproximate ? 'year' : 'day',
      });

      // Add facets if defined
      if (archive.subject) {
        const subjectFacetId = facetMap.get(`subject:${archive.subject}`);
        if (subjectFacetId) {
          await db.insert(archiveItemFacets).values({
            itemId: newItem.id,
            facetId: subjectFacetId,
          }).catch(() => {}); // Ignore duplicates
        }
      }

      if (archive.era) {
        const eraFacetId = facetMap.get(`era:${archive.era}`);
        if (eraFacetId) {
          await db.insert(archiveItemFacets).values({
            itemId: newItem.id,
            facetId: eraFacetId,
          }).catch(() => {}); // Ignore duplicates
        }
      }

      if (archive.sourceType) {
        const sourceTypeFacetId = facetMap.get(`source_type:${archive.sourceType}`);
        if (sourceTypeFacetId) {
          await db.insert(archiveItemFacets).values({
            itemId: newItem.id,
            facetId: sourceTypeFacetId,
          }).catch(() => {}); // Ignore duplicates
        }
      }

      const sensitivityValue = archive.sensitivity || 'Public';
      const sensitivityFacetId = facetMap.get(`sensitivity:${sensitivityValue}`);
      if (sensitivityFacetId) {
        await db.insert(archiveItemFacets).values({
          itemId: newItem.id,
          facetId: sensitivityFacetId,
        }).catch(() => {}); // Ignore duplicates
      }

      created++;

      if (created % 10 === 0) {
        console.log(`   ✓ Created ${created}/${archives.length} archives...`);
      }
    }

    console.log('');
    console.log('✅ Placeholder archives seeding complete!');
    console.log(`   📊 Created: ${created}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log('');
    console.log('ℹ️  All items marked with isPlaceholder=true');
    console.log('ℹ️  Can be toggled off in Admin Dashboard (Phase 4)');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding placeholder archives:', error);
    process.exit(1);
  }
}

// Run seeding
seedPlaceholderArchives();
