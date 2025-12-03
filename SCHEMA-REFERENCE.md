# Database Schema Reference

> # ⚠️ CRITICAL FOR ALL AI ASSISTANTS ⚠️
>
> **THIS IS YOUR DATABASE FIELD REFERENCE - READ BEFORE ANY DB OPERATION**
>
> ### Purpose:
> This file documents the **exact** field names for every database table.
> Reading this prevents TypeScript errors and database query failures.
>
> ### Rules:
> 1. 📖 **ALWAYS READ** this file before writing INSERT/UPDATE/SELECT queries
> 2. ⚠️ **NEVER GUESS** field names - they're often different from what you expect
> 3. 🔍 **CHECK EXPORT NAMES** - `archiveItemFacets` NOT `itemFacets`
> 4. 📝 **UPDATE THIS FILE** if you add/modify schema fields
> 5. 🚫 **NEVER CREATE NEW .md FILES** - document in PROGRESS-TRACKER.md instead
>
> ### Common Mistakes This Prevents:
> - ❌ Using `content` instead of `translatedContent` in translations table
> - ❌ Using `itemFacets` instead of `archiveItemFacets`
> - ❌ Using string for `usageCount` (it's an integer)
> - ❌ Using `timestamp` for `expires_at` (it's an integer)
>
> **📚 For progress tracking and documentation, see PROGRESS-TRACKER.md**
> **📋 For deployment info, see docs/TRUENAS-DEPLOYMENT.md**

---

## 📋 Table of Contents

1. [archiveItems](#archiveitems)
2. [archiveDates](#archivedates)
3. [translations](#translations)
4. [facets](#facets)
5. [archiveItemFacets](#archiveitemfacets)
6. [tags](#tags)
7. [users](#users)

---

## archiveItems

**Table Name:** `archive_items`
**Export:** `archiveItems`

### Fields:

```typescript
{
  id: uuid (PK, auto-generated)
  title: text (required)
  description: text (optional)
  type: enum (required) // 'document' | 'photo' | 'audio' | 'video' | 'text' | 'archive' | 'other'

  // File storage
  fileUrl: text (optional)
  fileName: text (optional)
  fileSize: text (optional) // in bytes as string
  mimeType: text (optional)
  sha256Hash: text (optional, unique) // File integrity fingerprint

  // Content and metadata
  contentText: text (optional) // Extracted text for search
  originalLanguage: text (optional) // ISO 639-1 code
  tags: jsonb<string[]> (default: []) // Soft tags array
  metadata: jsonb<Record<string, any>> (default: {}) // Flexible metadata

  // AI processing
  aiProcessingEnabled: boolean (default: true)
  aiProcessedAt: timestamp (optional)

  // Moderation
  isPublished: boolean (default: true)
  isSensitive: boolean (default: false)

  // Ownership
  uploaderId: uuid (FK to users.id, required)
  createdAt: timestamp (auto-generated)
  updatedAt: timestamp (auto-generated)

  // Version control
  parentId: uuid (FK to archiveItems.id, optional)
  version: text (default: '1.0')

  // Vector search (Phase 5)
  embedding: vector(768) (optional)
}
```

### Common Insert Example:

```typescript
await db.insert(archiveItems).values({
  title: 'Document Title',
  description: 'Optional description',
  type: 'document',
  fileUrl: 'https://...',
  fileName: 'file.pdf',
  fileSize: '123456', // STRING, not number!
  mimeType: 'application/pdf',
  sha256Hash: 'abc123...',
  contentText: 'Extracted text...',
  originalLanguage: 'en',
  tags: ['tag1', 'tag2'], // Array of strings
  metadata: { key: 'value' }, // Object
  aiProcessingEnabled: true,
  aiProcessedAt: new Date(),
  isPublished: false,
  isSensitive: false,
  uploaderId: userId, // UUID
});
```

---

## archiveDates

**Table Name:** `archive_dates`
**Export:** `archiveDates`

### Fields:

```typescript
{
  id: uuid (PK, auto-generated)
  itemId: uuid (FK to archiveItems.id, required)

  // Date range
  dateStart: date (required) // Beginning of period
  dateEnd: date (required)   // End of period (same as start if exact)

  // Display
  displayDate: text (required) // Human-readable text
  isApproximate: boolean (default: false)

  // Precision
  precision: enum (optional) // 'day' | 'month' | 'year' | 'decade' | 'century' | 'era'

  createdAt: timestamp (auto-generated)
}
```

### Common Insert Examples:

**Exact Date:**
```typescript
await db.insert(archiveDates).values({
  itemId: itemId,
  dateStart: '1995-12-05',
  dateEnd: '1995-12-05',
  displayDate: 'December 5, 1995',
  isApproximate: false,
  precision: 'day',
});
```

**Fuzzy Period:**
```typescript
await db.insert(archiveDates).values({
  itemId: itemId,
  dateStart: '1990-01-01',
  dateEnd: '1999-12-31',
  displayDate: 'Late 1990s',
  isApproximate: true,
  precision: 'decade',
});
```

---

## translations

**Table Name:** `translations`
**Export:** `translations`

### Fields:

```typescript
{
  id: uuid (PK, auto-generated)
  itemId: uuid (FK to archiveItems.id, required)

  // Language and content
  languageCode: text (required) // ISO 639-1 (e.g., 'en', 'tr')
  translatedTitle: text (optional)
  translatedDescription: text (optional)
  translatedContent: text (optional) // ⚠️ NOT 'content'!

  // Authorship
  authorType: enum (required) // 'human' | 'ai'
  authorId: uuid (FK to users.id, optional) // NULL if AI

  // Moderation
  status: enum (default: 'draft') // 'draft' | 'pending' | 'approved' | 'rejected'
  isOfficial: boolean (default: false)

  // Voting
  upvotes: integer (default: 0)
  downvotes: integer (default: 0)

  // Metadata
  createdAt: timestamp (auto-generated)
  updatedAt: timestamp (auto-generated)
  approvedAt: timestamp (optional)
  approvedBy: uuid (FK to users.id, optional)
}
```

### ⚠️ Common Mistake:

❌ **WRONG:**
```typescript
await db.insert(translations).values({
  content: englishTranslation, // ❌ Field doesn't exist!
});
```

✅ **CORRECT:**
```typescript
await db.insert(translations).values({
  itemId: itemId,
  languageCode: 'en',
  translatedContent: englishTranslation, // ✅ Correct field name
  authorType: 'ai',
  status: 'draft',
});
```

---

## facets

**Table Name:** `facets`
**Export:** `facets`

### Fields:

```typescript
{
  id: uuid (PK, auto-generated)
  category: enum (required) // 'era' | 'location' | 'subject' | 'source_type' | 'language' | 'sensitivity'
  value: text (required) // The actual facet value (e.g., "20th_century")
  slug: text (required) // URL-friendly version
  description: text (optional)
  parentId: uuid (FK to facets.id, optional) // For hierarchical facets
  sortOrder: integer (default: 0)
  createdAt: timestamp (auto-generated)
  isRequired: boolean (default: false)
}
```

### Querying Facets:

```typescript
const facet = await db.query.facets.findFirst({
  where: (f, { eq }) => eq(f.value, 'government_document'),
});
```

---

## archiveItemFacets

**Table Name:** `archive_item_facets`
**Export:** `archiveItemFacets` ⚠️ NOT `itemFacets`!

### Fields:

```typescript
{
  id: uuid (PK, auto-generated)
  itemId: uuid (FK to archiveItems.id, required)
  facetId: uuid (FK to facets.id, required)
  createdAt: timestamp (auto-generated)
}
```

### ⚠️ Common Mistake:

❌ **WRONG:**
```typescript
import { itemFacets } from '@/lib/db/schema'; // ❌ Not exported!
```

✅ **CORRECT:**
```typescript
import { archiveItemFacets } from '@/lib/db/schema'; // ✅ Correct name

await db.insert(archiveItemFacets).values({
  itemId: itemId,
  facetId: facetId,
});
```

---

## tags

**Table Name:** `tags`
**Export:** `tags`

### Fields:

```typescript
{
  id: uuid (PK, auto-generated)
  name: text (required, unique)
  slug: text (required, unique)
  description: text (optional)
  color: text (optional) // For UI visualization
  createdAt: timestamp (auto-generated)
  usageCount: integer (default: 0) // ⚠️ INTEGER, not text!
  isPromoted: boolean (default: false)
}
```

### ⚠️ Common Mistake:

❌ **WRONG:**
```typescript
await db.insert(tags).values({
  usageCount: '1', // ❌ String instead of number
});
```

✅ **CORRECT:**
```typescript
await db.insert(tags).values({
  name: 'Tag Name',
  slug: 'tag-name',
  usageCount: 1, // ✅ Integer
});
```

---

## users

**Table Name:** `user`
**Export:** `users`

### Fields:

```typescript
{
  id: uuid (PK, auto-generated)
  name: text (optional)
  email: text (required, unique)
  emailVerified: timestamp (optional)
  image: text (optional)
  createdAt: timestamp (auto-generated)

  // User preferences (Phase 0)
  preferredLanguage: text (default: 'en')
  isAdmin: boolean (default: false)
}
```

---

## 🔍 Quick Reference: Common Operations

### Check for Duplicates (SHA-256):

```typescript
const existingItem = await db.query.archiveItems.findFirst({
  where: (items, { eq }) => eq(items.sha256Hash, hash),
});
```

### Create Fuzzy Date:

```typescript
if (dateType === 'exact') {
  await db.insert(archiveDates).values({
    itemId: itemId,
    dateStart: exactDate,
    dateEnd: exactDate,
    displayDate: formatDate(exactDate),
    isApproximate: false,
    precision: 'day',
  });
} else {
  await db.insert(archiveDates).values({
    itemId: itemId,
    dateStart: startDate,
    dateEnd: endDate,
    displayDate: customDisplayText,
    isApproximate: true,
    precision: 'year',
  });
}
```

### Link Facets to Item:

```typescript
const facet = await db.query.facets.findFirst({
  where: (f, { eq }) => eq(f.value, facetValue),
});

if (facet) {
  await db.insert(archiveItemFacets).values({
    itemId: itemId,
    facetId: facet.id,
  });
}
```

### Create AI Translation:

```typescript
await db.insert(translations).values({
  itemId: itemId,
  languageCode: 'en',
  translatedContent: aiGeneratedText, // ⚠️ NOT 'content'
  authorType: 'ai',
  authorId: userId,
  status: 'draft',
  isOfficial: false,
});
```

### Update Tag Usage Count:

```typescript
const tag = await db.query.tags.findFirst({
  where: (t, { eq }) => eq(t.slug, slug),
});

if (tag) {
  const newCount = (tag.usageCount || 0) + 1; // Handle null
  await db.update(tags)
    .set({ usageCount: newCount })
    .where(eq(tags.id, tag.id));
}
```

---

## ⚠️ Common TypeScript Errors & Fixes

### Error: "Module has no exported member 'itemFacets'"
**Fix:** Use `archiveItemFacets` instead of `itemFacets`

### Error: "'content' does not exist in type..."
**Fix:** Use `translatedContent` instead of `content` in translations table

### Error: "Type 'string' is not assignable to type 'number'"
**Fix:** `tags.usageCount` is an `integer`, not `text`. Use numbers, not strings.

### Error: "Argument of type 'number' is not assignable to parameter of type 'string'"
**Fix:** `archiveItems.fileSize` is stored as `text`. Convert number to string: `fileSize.toString()`

---

**Last Updated:** December 3, 2025
**Source:** `/src/lib/db/schema.ts`
