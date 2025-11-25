# Archive Resurrection: Development Roadmap

This roadmap outlines the phased development approach for building Archive Resurrection from MVP to a fully-featured AI-powered archive system.

## Phase 0: Planning & Setup ✅ COMPLETED

### Goals
Define the foundation and set up the development environment.

### Tasks Completed
- [x] **0.1 Define Tech Stack**
  - Frontend: Next.js 14 with TypeScript
  - Backend: Next.js API Routes (Node.js)
  - Database: PostgreSQL with pgvector extension
  - Storage: AWS S3
  - Authentication: NextAuth.js with Google OAuth
  - AI: Google Gemini API

- [x] **0.2 Data Modeling**
  - Created comprehensive database schema using Drizzle ORM
  - Core tables: `users`, `sessions`, `accounts`, `archive_items`, `tags`
  - Designed for future vector search with pgvector
  - Flexible metadata with JSONB fields

- [x] **0.3 Environment Setup**
  - GitHub repository initialized
  - Project structure created
  - Configuration files (TypeScript, ESLint, Tailwind)
  - Environment variable template

- [x] **0.4 Authentication**
  - NextAuth.js integration
  - Google OAuth provider configured
  - Drizzle adapter for database sessions
  - Protected routes ready

---

## Phase 1: Core Architecture (MVP) 🚧 IN PROGRESS

### Goals
Create the basic functionality for uploading, storing, and viewing content.

### Tasks

#### 1.1 Storage Setup ⏳
**Status**: Framework ready, needs configuration
- AWS S3 client configured in `src/lib/storage/s3.ts`
- Functions ready: `uploadFile`, `deleteFile`, `getFile`, `getPresignedUploadUrl`
- **Next**: Set up AWS S3 bucket and configure credentials

#### 1.2 Upload Endpoint 📝 TODO
**Implementation Required**
- Create API route: `/api/upload`
- Handle multipart form data
- Validate file types and sizes (implemented in `file-processor.ts`)
- Upload to S3
- Extract text content from documents
- Create database record with metadata
- Return item ID and URL

**Files to Create**:
- `src/app/api/upload/route.ts`

#### 1.3 Item View/Detail Page 📝 TODO
**Implementation Required**
- Dynamic route: `/items/[id]`
- Fetch item from database
- Render file preview (images, PDFs, documents)
- Display metadata (title, description, uploader, timestamps)
- Show tags with links
- Edit/delete controls (for owner and admins)

**Files to Create**:
- `src/app/items/[id]/page.tsx`
- `src/components/features/ItemViewer.tsx`
- `src/components/features/FilePreview.tsx`

#### 1.4 Basic Listing Page 📝 TODO
**Implementation Required**
- Homepage or `/browse` showing all items
- Display items chronologically (newest first)
- Pagination (20 items per page)
- Item cards with preview thumbnail
- Filter by type (document, photo, archive)

**Files to Create**:
- Update `src/app/page.tsx` or create `src/app/browse/page.tsx`
- `src/components/features/ItemGrid.tsx`
- `src/components/features/ItemCard.tsx`
- `src/app/api/items/route.ts` (GET endpoint)

#### 1.5 Basic Tagging Input 📝 TODO
**Implementation Required**
- Tag input component with autocomplete
- Add tags during upload
- Edit tags on item detail page
- Store tags in JSONB array
- Create tag records in `tags` table

**Files to Create**:
- `src/components/ui/TagInput.tsx`
- `src/app/api/tags/route.ts` (GET all tags, create new)

---

## Phase 2: Essential Features & User Experience 📋 PLANNED

### Goals
Implement necessary features for organization and basic searching.

### Tasks

#### 2.1 Tag Management
- Tag detail page: `/tag/[slug]` showing all items with that tag
- Tag cloud visualization on homepage
- Tag statistics (usage count, trending)
- Ability to merge/rename tags (admin)

**Estimated Effort**: 1-2 days

#### 2.2 Full-Text Indexing
- Implement text extraction pipeline (already in `file-processor.ts`)
- Process uploads asynchronously to extract text
- Store in `content_text` field
- Add PostgreSQL full-text search index
- Background job for reprocessing existing files

**Estimated Effort**: 2-3 days

#### 2.3 Search Bar Implementation
- Search UI component in navbar
- Search page with results
- Query `title`, `description`, `content_text`
- Use PostgreSQL `tsvector` for full-text search
- Highlight search terms in results
- Search suggestions/autocomplete

**Estimated Effort**: 2-3 days

#### 2.4 User Profiles
- User profile page: `/user/[id]`
- Show user's uploads
- Display activity timeline
- Basic user settings

**Estimated Effort**: 1 day

#### 2.5 Delete/Edit Functionality
- Edit item metadata (title, description, tags)
- Delete items (with confirmation)
- Authorization checks (owner or admin only)
- Soft delete option (keep in database, hide from listings)

**Estimated Effort**: 1-2 days

---

## Phase 3: Advanced AI & Search (The Resurrection Engine) 🤖 PLANNED

### Goals
Implement semantic search and AI-powered features using vector databases and LLMs.

### Tasks

#### 3.1 Text Embedding Pipeline
- Generate embeddings for all content using Gemini API
- Batch processing for existing items
- Real-time embedding during upload
- Store in `embedding` column (vector type, 768 dimensions)

**Implementation**:
- Already scaffolded in `src/lib/ai/gemini.ts`
- Use `text-embedding-004` model
- Batch API calls to reduce costs

**Estimated Effort**: 2-3 days

#### 3.2 Vector Database Integration
- Enable pgvector extension in PostgreSQL
- Create HNSW index on `embedding` column
- Implement similarity search queries
- Tune index parameters for performance

**Estimated Effort**: 1-2 days

#### 3.3 AI Search Implementation (Semantic Search)
- Convert search query to vector embedding
- Perform cosine similarity search
- Retrieve top N most relevant items
- Combine with full-text search results

**Estimated Effort**: 2-3 days

#### 3.4 Ranking & Merging
- Hybrid search: combine keyword + semantic results
- Implement ranking algorithm (RRF - Reciprocal Rank Fusion)
- Adjust weights based on user feedback
- A/B testing framework for search quality

**Estimated Effort**: 2-3 days

#### 3.5 Search Filter UI
- Advanced filter panel
- Filter by: type, date range, uploader, tags
- Sort options (relevance, date, title)
- Save search queries
- Search history

**Estimated Effort**: 2 days

---

## Advanced Features (Phase 4+) 🚀 FUTURE

### 1. Generative AI Q&A and Summarization (RAG)
**Priority**: High

**Implementation**:
- Retrieve relevant documents via semantic search
- Use Gemini 2.0 Flash to generate answers
- Cite sources in response
- Conversational follow-up questions
- Answer rating/feedback

**Already Scaffolded**: `answerQuestion()` in `src/lib/ai/gemini.ts`

**Estimated Effort**: 3-5 days

---

### 2. Document Pre-Processing and AI Tagging
**Priority**: High

**Implementation**:
- OCR for images/scanned documents (Google Cloud Vision API)
- Audio transcription (Gemini for audio or Whisper API)
- Automated tag suggestion (already in `generateTags()`)
- User can accept/reject suggested tags
- Learn from user corrections

**Estimated Effort**: 3-4 days

---

### 3. Collaboration and Version History
**Priority**: Medium

**Implementation**:
- Track document versions via `parentId` field
- Show version timeline on item page
- Diff viewer for text documents
- Restore previous versions
- Track who made what changes

**Estimated Effort**: 4-5 days

---

### 4. Data Visualization Dashboard
**Priority**: Medium

**Implementation**:
- Interactive tag cloud (D3.js or Chart.js)
- Upload timeline (monthly/quarterly chart)
- Storage usage by type
- Top contributors
- Search analytics

**Estimated Effort**: 3-4 days

---

### 5. Multi-Lingual Support
**Priority**: Low

**Implementation**:
- Detect document language
- Translate content to English for indexing
- Store original language metadata
- UI language selector
- Gemini API for translation

**Estimated Effort**: 2-3 days

---

### 6. Advanced Admin Panel
**Priority**: Medium

**Implementation**:
- User management (roles, permissions)
- Bulk operations (tag all, delete multiple)
- System statistics and health
- Reindex all documents
- Audit logs

**Estimated Effort**: 4-5 days

---

### 7. Mobile App
**Priority**: Low

**Implementation**:
- React Native or Flutter
- Camera upload for quick archiving
- Offline search cache
- Push notifications for mentions
- Mobile-optimized search

**Estimated Effort**: 15-20 days

---

## Success Metrics

### Phase 1 (MVP)
- [ ] Users can sign in with Google
- [ ] Users can upload files successfully
- [ ] Users can view uploaded files
- [ ] Users can tag files
- [ ] Users can browse all files

### Phase 2
- [ ] Users can search by keywords
- [ ] Users can filter by tags
- [ ] Search results are accurate and fast (<500ms)
- [ ] Users can edit/delete their own files

### Phase 3
- [ ] Semantic search returns relevant results
- [ ] AI-generated answers cite correct sources
- [ ] Search quality rated >4/5 by users
- [ ] Response time <2s for AI answers

---

## Technology Decisions & Rationale

### Why Next.js?
- Full-stack framework (frontend + API routes)
- Server-side rendering for better SEO
- Built-in optimization (images, fonts, code splitting)
- Easy deployment (Vercel)
- Large ecosystem and community

### Why PostgreSQL + pgvector?
- Single database for relational + vector data
- Mature, reliable, well-documented
- pgvector performs well for millions of vectors
- Full-text search built-in
- No need to manage separate vector DB

### Why Gemini API over OpenAI?
- Cost-effective (often cheaper than OpenAI)
- High-quality embeddings (768 dimensions)
- Multimodal capabilities (future: images, video)
- Free tier available for development
- Good context window (1M+ tokens in Gemini)

### Why Drizzle ORM?
- Type-safe SQL queries
- Lightweight and fast
- Great TypeScript support
- Edge-compatible (Vercel, Cloudflare)
- Easy migrations

---

## Next Immediate Steps

1. **Complete Phase 1.2**: Implement upload endpoint
2. **Complete Phase 1.3**: Build item detail page
3. **Complete Phase 1.4**: Create listing page with pagination
4. **Complete Phase 1.5**: Add tag input UI
5. **Testing**: Write integration tests for core features
6. **Deploy MVP**: Set up staging environment on Vercel

---

**Last Updated**: 2025-11-25
