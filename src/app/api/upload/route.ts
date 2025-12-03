import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  archiveItems,
  tags,
  archiveDates,
  facets,
  archiveItemFacets,
  translations,
} from '@/lib/db/schema';
import { uploadFile } from '@/lib/storage';
import { extractTextFromFile, calculateFileHash } from '@/lib/utils/file-processor';
import { generateTags, suggestFacets, generateTranslation } from '@/lib/ai/gemini';
import { eq, and } from 'drizzle-orm';

/**
 * PHASE 1.1: Enhanced Upload Endpoint with AI Pipeline
 *
 * Features:
 * - SHA-256 file hashing for integrity
 * - AI-powered facet suggestions
 * - AI-powered tag generation
 * - Auto-translation to English (or user's preferred language)
 * - Fuzzy date support
 * - Audio/Video file support
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the user from the database
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, session.user!.email!),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string | null;
    const itemType = formData.get('type') as string;

    // Phase 1.1: AI processing toggle
    const aiProcessingEnabled = formData.get('aiProcessing') !== 'false';

    // Phase 1.1: Facets (hard taxonomy)
    const facetsJson = formData.get('facets') as string | null;

    // Soft tags (user-provided or AI-generated)
    const tagsJson = formData.get('tags') as string | null;

    // Phase 1.1: Fuzzy dates
    const dateType = formData.get('dateType') as string; // 'exact' or 'period'
    const dateExact = formData.get('dateExact') as string | null;
    const dateStart = formData.get('dateStart') as string | null;
    const dateEnd = formData.get('dateEnd') as string | null;
    const dateDisplay = formData.get('dateDisplay') as string | null;

    // Validate required fields
    if (!file || !title || !itemType) {
      return NextResponse.json(
        { error: 'Missing required fields: file, title, or type' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      // Documents
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      // Audio
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/aac',
      'audio/m4a',
      // Video
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/webm',
      'video/x-msvideo',
      // Archives
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not supported' },
        { status: 400 }
      );
    }

    // Validate file size (500MB max for video, 100MB for others)
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 500 * 1024 * 1024 : 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds ${isVideo ? '500MB' : '100MB'} limit` },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // PHASE 1.1: Calculate SHA-256 hash for file integrity
    const sha256Hash = calculateFileHash(fileBuffer);

    // Check for duplicate file
    const existingItem = await db.query.archiveItems.findFirst({
      where: (items, { eq }) => eq(items.sha256Hash, sha256Hash),
    });

    if (existingItem) {
      return NextResponse.json(
        {
          error: 'Duplicate file detected',
          existingItem: {
            id: existingItem.id,
            title: existingItem.title,
            uploadedAt: existingItem.createdAt,
          },
        },
        { status: 409 }
      );
    }

    // Upload file to storage
    const fileUrl = await uploadFile(fileBuffer, file.name, file.type);

    // PHASE 1.1: Extract text content from file (with OCR for images)
    let contentText = '';
    try {
      contentText = await extractTextFromFile(fileBuffer, file.type);
    } catch (error) {
      console.error('Error extracting text:', error);
      // Continue even if text extraction fails
    }

    // PHASE 1.1: AI Processing Pipeline (if enabled)
    let aiSuggestedFacets: any = null;
    let aiGeneratedTags: string[] = [];
    let englishTranslation = '';

    if (aiProcessingEnabled && contentText) {
      try {
        // AI Facet Suggestions
        aiSuggestedFacets = await suggestFacets(title, contentText, file.name);
        console.log('AI suggested facets:', aiSuggestedFacets);

        // AI Tag Generation
        aiGeneratedTags = await generateTags(contentText);
        console.log('AI generated tags:', aiGeneratedTags);

        // AI Translation (if not already in English)
        if (aiSuggestedFacets.language && aiSuggestedFacets.language !== 'en') {
          englishTranslation = await generateTranslation(
            contentText,
            'en',
            aiSuggestedFacets.language
          );
          console.log('AI generated English translation');
        }
      } catch (error) {
        console.error('Error in AI pipeline:', error);
        // Continue without AI enhancements
      }
    }

    // Parse user-provided or AI-generated tags
    let itemTags: string[] = [];
    try {
      if (tagsJson) {
        itemTags = JSON.parse(tagsJson);
      } else if (aiGeneratedTags.length > 0) {
        // Use AI tags if user didn't provide any
        itemTags = aiGeneratedTags;
      }
    } catch (error) {
      console.error('Error parsing tags:', error);
      itemTags = aiGeneratedTags; // Fallback to AI tags
    }

    // Parse user-provided facets
    let selectedFacets: any = {};
    try {
      if (facetsJson) {
        selectedFacets = JSON.parse(facetsJson);
      }
    } catch (error) {
      console.error('Error parsing facets:', error);
    }

    // Merge user facets with AI suggestions (user facets take priority)
    const finalFacets = {
      ...aiSuggestedFacets,
      ...selectedFacets,
    };

    // Detect original language
    const originalLanguage = finalFacets.language || 'en';

    // Create archive item in database
    const [newItem] = await db.insert(archiveItems).values({
      title,
      description: description || null,
      type: itemType as any,
      fileUrl,
      fileName: file.name,
      fileSize: file.size.toString(),
      mimeType: file.type,
      contentText,
      tags: itemTags,
      uploaderId: user.id,
      metadata: {
        aiSuggestedFacets: aiSuggestedFacets || {},
        aiGeneratedTags: aiGeneratedTags,
      },
      sha256Hash,
      originalLanguage,
      aiProcessingEnabled,
      aiProcessedAt: aiProcessingEnabled ? new Date() : null,
      isPublished: false, // Require admin approval
      isSensitive: finalFacets.sensitivity === 'restricted' || finalFacets.sensitivity === 'confidential',
    }).returning();

    // PHASE 1.1: Create fuzzy date record
    if (dateType === 'exact' && dateExact) {
      await db.insert(archiveDates).values({
        itemId: newItem.id,
        dateStart: dateExact,
        dateEnd: dateExact,
        displayDate: new Date(dateExact).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        isApproximate: false,
        precision: 'day',
      });
    } else if (dateType === 'period' && dateStart && dateEnd) {
      await db.insert(archiveDates).values({
        itemId: newItem.id,
        dateStart,
        dateEnd,
        displayDate: dateDisplay || `${dateStart} to ${dateEnd}`,
        isApproximate: true,
        precision: 'year', // Could be smarter based on date range
      });
    }

    // PHASE 1.1: Create facet associations
    if (finalFacets) {
      const facetValues: string[] = [];

      // Collect all facet values
      if (finalFacets.era && Array.isArray(finalFacets.era)) {
        facetValues.push(...finalFacets.era);
      }
      if (finalFacets.location && Array.isArray(finalFacets.location)) {
        facetValues.push(...finalFacets.location);
      }
      if (finalFacets.subject && Array.isArray(finalFacets.subject)) {
        facetValues.push(...finalFacets.subject);
      }
      if (finalFacets.sourceType) {
        facetValues.push(finalFacets.sourceType);
      }
      if (finalFacets.language) {
        facetValues.push(finalFacets.language);
      }
      if (finalFacets.sensitivity) {
        facetValues.push(finalFacets.sensitivity);
      }

      // Link facets to item
      for (const facetValue of facetValues) {
        const facet = await db.query.facets.findFirst({
          where: (f, { eq }) => eq(f.value, facetValue),
        });

        if (facet) {
          await db.insert(archiveItemFacets).values({
            itemId: newItem.id,
            facetId: facet.id,
          });
        }
      }
    }

    // PHASE 1.1: Create AI translation record (if generated)
    if (englishTranslation && originalLanguage !== 'en') {
      await db.insert(translations).values({
        itemId: newItem.id,
        languageCode: 'en',
        authorId: user.id,
        authorType: 'ai',
        translatedContent: englishTranslation,
        isOfficial: false,
        status: 'draft', // AI translations start as drafts
      });
    }

    // Update tag usage counts
    if (itemTags.length > 0) {
      for (const tagName of itemTags) {
        const slug = tagName.toLowerCase().replace(/\s+/g, '-');

        // Check if tag exists
        const existingTag = await db.query.tags.findFirst({
          where: (tags, { eq }) => eq(tags.slug, slug),
        });

        if (existingTag) {
          // Increment usage count
          const currentCount = existingTag.usageCount || 0;
          await db.update(tags)
            .set({ usageCount: currentCount + 1 })
            .where(eq(tags.id, existingTag.id));
        } else {
          // Create new tag
          await db.insert(tags).values({
            name: tagName,
            slug,
            usageCount: 1,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      item: newItem,
      aiEnhancements: aiProcessingEnabled
        ? {
            facetSuggestions: aiSuggestedFacets,
            generatedTags: aiGeneratedTags,
            translationGenerated: !!englishTranslation,
          }
        : null,
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
