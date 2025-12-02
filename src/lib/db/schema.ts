import { pgTable, text, timestamp, uuid, jsonb, vector, index, pgEnum, integer, boolean, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

// Item types (removed 'wiki_page' per Phase 0 cleanup)
export const itemTypeEnum = pgEnum('item_type', ['document', 'photo', 'audio', 'video', 'text', 'archive', 'other']);

// Translation status for moderation workflow
export const translationStatusEnum = pgEnum('translation_status', ['draft', 'pending', 'approved', 'rejected']);

// Translation author type
export const translationAuthorTypeEnum = pgEnum('translation_author_type', ['human', 'ai']);

// Facet categories (hard taxonomy)
export const facetCategoryEnum = pgEnum('facet_category', [
  'era',           // Time period (e.g., "World War II", "Cold War Era")
  'location',      // Geographic location (e.g., "Europe", "Middle East")
  'subject',       // Topic/theme (e.g., "Military", "Politics", "Culture")
  'source_type',   // Document origin (e.g., "Government", "Personal", "Media")
  'language',      // Original language
  'sensitivity'    // Classification (e.g., "Public", "Sensitive")
]);

// ============================================================================
// AUTHENTICATION TABLES (NextAuth)
// ============================================================================

export const users = pgTable('user', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified'),
  image: text('image'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),

  // User preferences
  preferredLanguage: text('preferred_language').default('en'), // ISO 639-1 code
  isAdmin: boolean('is_admin').default(false),
});

// Accounts table (for NextAuth OAuth)
export const accounts = pgTable('account', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('userId').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'), // Unix timestamp in seconds
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
});

// Sessions table (for NextAuth)
export const sessions = pgTable('session', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionToken: text('sessionToken').notNull().unique(),
  userId: uuid('userId').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  expires: timestamp('expires').notNull(),
});

// ============================================================================
// CORE ARCHIVE ITEMS TABLE
// ============================================================================

export const archiveItems = pgTable('archive_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  type: itemTypeEnum('type').notNull(),

  // File storage
  fileUrl: text('file_url'),
  fileName: text('file_name'),
  fileSize: text('file_size'), // in bytes
  mimeType: text('mime_type'),
  sha256Hash: text('sha256_hash').unique(), // Phase 0.4 - File integrity fingerprint

  // Content and metadata
  contentText: text('content_text'), // Extracted text for full-text search
  originalLanguage: text('original_language'), // ISO 639-1 code (e.g., 'en', 'tr', 'de')
  tags: jsonb('tags').$type<string[]>().default([]).notNull(), // "Soft tags" - user/AI generated
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}).notNull(),

  // Vector embedding for semantic search (Phase 5)
  embedding: vector('embedding', { dimensions: 768 }), // Gemini text-embedding-004

  // AI processing control (Phase 0 - Cost Management)
  aiProcessingEnabled: boolean('ai_processing_enabled').default(true),
  aiProcessedAt: timestamp('ai_processed_at'), // When AI processing completed

  // Moderation & Quality
  isPublished: boolean('is_published').default(true), // Can be hidden by admins
  isSensitive: boolean('is_sensitive').default(false), // Auto-blur in UI

  // Ownership and timestamps
  uploaderId: uuid('uploader_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(), // When uploaded to system
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

  // Version control (future)
  parentId: uuid('parent_id').references((): any => archiveItems.id),
  version: text('version').default('1.0'),
}, (table) => ({
  uploaderIdx: index('uploader_idx').on(table.uploaderId),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
  typeIdx: index('type_idx').on(table.type),
  hashIdx: index('hash_idx').on(table.sha256Hash),
  tagsIdx: index('tags_idx').using('gin', table.tags),
  embeddingIdx: index('embedding_idx').using('hnsw', table.embedding.op('vector_cosine_ops')),
}));

// ============================================================================
// TAXONOMY TABLES
// ============================================================================

// Tags table - "Soft Tags" (flexible, user/AI generated)
export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  color: text('color'), // For UI visualization
  createdAt: timestamp('created_at').defaultNow().notNull(),
  usageCount: integer('usage_count').default(0), // Changed from text to integer
  isPromoted: boolean('is_promoted').default(false), // Can be promoted to facet by admin
});

// Facets table - "Hard Facets" (strict, admin-controlled categories)
export const facets = pgTable('facets', {
  id: uuid('id').defaultRandom().primaryKey(),
  category: facetCategoryEnum('category').notNull(), // Which facet category
  value: text('value').notNull(), // The actual facet value (e.g., "World War II")
  slug: text('slug').notNull(), // URL-friendly version
  description: text('description'),
  parentId: uuid('parent_id').references((): any => facets.id), // For hierarchical facets
  sortOrder: integer('sort_order').default(0), // Display order in UI
  createdAt: timestamp('created_at').defaultNow().notNull(),
  isRequired: boolean('is_required').default(false), // Must be selected during upload
}, (table) => ({
  categoryIdx: index('category_idx').on(table.category),
  slugIdx: index('facet_slug_idx').on(table.slug),
}));

// Junction table: Archive Items <-> Facets (many-to-many)
export const archiveItemFacets = pgTable('archive_item_facets', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: uuid('item_id').references(() => archiveItems.id, { onDelete: 'cascade' }).notNull(),
  facetId: uuid('facet_id').references(() => facets.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  itemIdx: index('item_facet_item_idx').on(table.itemId),
  facetIdx: index('item_facet_facet_idx').on(table.facetId),
}));

// ============================================================================
// FUZZY DATE SYSTEM (Phase 0.1)
// ============================================================================

// Archive Dates - Supports both exact dates and ambiguous periods
export const archiveDates = pgTable('archive_dates', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: uuid('item_id').references(() => archiveItems.id, { onDelete: 'cascade' }).notNull(),

  // Date range (for ambiguous dates like "Late 1990s" or "Winter 1942")
  dateStart: date('date_start').notNull(), // Beginning of period
  dateEnd: date('date_end').notNull(),     // End of period (same as start if exact)

  // Display formatting
  displayDate: text('display_date').notNull(), // Human-readable (e.g., "December 5, 1995" or "Late 1990s")
  isApproximate: boolean('is_approximate').default(false), // True for fuzzy dates

  // Precision level (for UI visualization)
  precision: text('precision').default('day'), // 'day', 'month', 'year', 'decade', 'century'

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  itemIdx: index('date_item_idx').on(table.itemId),
  startIdx: index('date_start_idx').on(table.dateStart),
  endIdx: index('date_end_idx').on(table.dateEnd),
}));

// ============================================================================
// TRANSLATION SYSTEM (Phase 0.2)
// ============================================================================

// Translations - Multi-language overlay for archive items
export const translations = pgTable('translations', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: uuid('item_id').references(() => archiveItems.id, { onDelete: 'cascade' }).notNull(),

  // Language and content
  languageCode: text('language_code').notNull(), // ISO 639-1 (e.g., 'en', 'tr', 'de')
  translatedTitle: text('translated_title'),
  translatedDescription: text('translated_description'),
  translatedContent: text('translated_content'), // Full document translation

  // Authorship
  authorType: translationAuthorTypeEnum('author_type').notNull(), // 'human' or 'ai'
  authorId: uuid('author_id').references(() => users.id), // NULL if AI-generated

  // Moderation workflow
  status: translationStatusEnum('status').default('draft').notNull(),
  isOfficial: boolean('is_official').default(false), // Marked as authoritative

  // Community voting
  upvotes: integer('upvotes').default(0),
  downvotes: integer('downvotes').default(0),

  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  approvedAt: timestamp('approved_at'),
  approvedBy: uuid('approved_by').references(() => users.id),
}, (table) => ({
  itemIdx: index('translation_item_idx').on(table.itemId),
  langIdx: index('translation_lang_idx').on(table.languageCode),
  statusIdx: index('translation_status_idx').on(table.status),
  officialIdx: index('translation_official_idx').on(table.isOfficial),
}));

// Translation Votes - Track who voted on what
export const translationVotes = pgTable('translation_votes', {
  id: uuid('id').defaultRandom().primaryKey(),
  translationId: uuid('translation_id').references(() => translations.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  voteType: text('vote_type').notNull(), // 'up' or 'down'
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  translationIdx: index('vote_translation_idx').on(table.translationId),
  userIdx: index('vote_user_idx').on(table.userId),
}));

// ============================================================================
// RELATIONS (for Drizzle ORM queries with joins)
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  archiveItems: many(archiveItems),
  translations: many(translations),
  translationVotes: many(translationVotes),
}));

export const archiveItemsRelations = relations(archiveItems, ({ one, many }) => ({
  uploader: one(users, {
    fields: [archiveItems.uploaderId],
    references: [users.id],
  }),
  dates: many(archiveDates),
  translations: many(translations),
  facets: many(archiveItemFacets),
}));

export const archiveDatesRelations = relations(archiveDates, ({ one }) => ({
  item: one(archiveItems, {
    fields: [archiveDates.itemId],
    references: [archiveItems.id],
  }),
}));

export const translationsRelations = relations(translations, ({ one, many }) => ({
  item: one(archiveItems, {
    fields: [translations.itemId],
    references: [archiveItems.id],
  }),
  author: one(users, {
    fields: [translations.authorId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [translations.approvedBy],
    references: [users.id],
  }),
  votes: many(translationVotes),
}));

export const translationVotesRelations = relations(translationVotes, ({ one }) => ({
  translation: one(translations, {
    fields: [translationVotes.translationId],
    references: [translations.id],
  }),
  user: one(users, {
    fields: [translationVotes.userId],
    references: [users.id],
  }),
}));

export const facetsRelations = relations(facets, ({ many, one }) => ({
  items: many(archiveItemFacets),
  parent: one(facets, {
    fields: [facets.parentId],
    references: [facets.id],
  }),
}));

export const archiveItemFacetsRelations = relations(archiveItemFacets, ({ one }) => ({
  item: one(archiveItems, {
    fields: [archiveItemFacets.itemId],
    references: [archiveItems.id],
  }),
  facet: one(facets, {
    fields: [archiveItemFacets.facetId],
    references: [facets.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS (for TypeScript)
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type ArchiveItem = typeof archiveItems.$inferSelect;
export type NewArchiveItem = typeof archiveItems.$inferInsert;

export type ArchiveDate = typeof archiveDates.$inferSelect;
export type NewArchiveDate = typeof archiveDates.$inferInsert;

export type Translation = typeof translations.$inferSelect;
export type NewTranslation = typeof translations.$inferInsert;

export type TranslationVote = typeof translationVotes.$inferSelect;
export type NewTranslationVote = typeof translationVotes.$inferInsert;

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export type Facet = typeof facets.$inferSelect;
export type NewFacet = typeof facets.$inferInsert;

export type ArchiveItemFacet = typeof archiveItemFacets.$inferSelect;
export type NewArchiveItemFacet = typeof archiveItemFacets.$inferInsert;
