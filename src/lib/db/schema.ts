import { pgTable, text, timestamp, uuid, jsonb, vector, index, pgEnum, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const itemTypeEnum = pgEnum('item_type', ['document', 'photo', 'text', 'archive', 'wiki_page', 'other']);

// Users table (managed by NextAuth)
export const users = pgTable('user', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified'),
  image: text('image'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
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

// Archive Items table (core of the application)
export const archiveItems = pgTable('archive_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  type: itemTypeEnum('type').notNull(),
  fileUrl: text('file_url'), // S3 URL
  fileName: text('file_name'),
  fileSize: text('file_size'), // in bytes
  mimeType: text('mime_type'),

  // Content and metadata
  contentText: text('content_text'), // Extracted text for search (Phase 2.2)
  wikiContent: text('wiki_content'), // Markdown/rich text content for wiki pages (Phase 1.6)
  tags: jsonb('tags').$type<string[]>().default([]).notNull(), // Array of tag strings (Phase 1.5)
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}).notNull(), // Flexible metadata

  // Vector embedding for semantic search (Phase 3.1-3.2)
  embedding: vector('embedding', { dimensions: 768 }), // Gemini embedding dimension

  // Ownership and timestamps
  uploaderId: uuid('uploader_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

  // Version control (for future Phase 3)
  parentId: uuid('parent_id').references((): any => archiveItems.id), // For versioning
  version: text('version').default('1.0'),
}, (table) => ({
  // Indexes for performance
  uploaderIdx: index('uploader_idx').on(table.uploaderId),
  createdAtIdx: index('created_at_idx').on(table.createdAt),
  typeIdx: index('type_idx').on(table.type),
  tagsIdx: index('tags_idx').using('gin', table.tags), // GIN index for JSONB array search
  embeddingIdx: index('embedding_idx').using('hnsw', table.embedding.op('vector_cosine_ops')), // For vector similarity
}));

// Tags table (for tag management and statistics)
export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  color: text('color'), // For UI visualization
  createdAt: timestamp('created_at').defaultNow().notNull(),
  usageCount: text('usage_count').default('0'), // Track how many items use this tag
});

// Relations (for Drizzle ORM queries with joins)
export const usersRelations = relations(users, ({ many }) => ({
  archiveItems: many(archiveItems),
}));

export const archiveItemsRelations = relations(archiveItems, ({ one }) => ({
  uploader: one(users, {
    fields: [archiveItems.uploaderId],
    references: [users.id],
  }),
}));

// Type exports for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type ArchiveItem = typeof archiveItems.$inferSelect;
export type NewArchiveItem = typeof archiveItems.$inferInsert;

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
