import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { archiveItems, tags } from '@/lib/db/schema';
import { uploadFile } from '@/lib/storage';
import { extractTextFromFile } from '@/lib/utils/file-processor';
import { eq } from 'drizzle-orm';

/**
 * Upload endpoint for archive items
 * Phase 1.2 - Handle file uploads
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
    const tagsJson = formData.get('tags') as string;

    // Validate required fields
    if (!file || !title || !itemType) {
      return NextResponse.json(
        { error: 'Missing required fields: file, title, or type' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/zip',
      'application/x-zip-compressed',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not supported' },
        { status: 400 }
      );
    }

    // Validate file size (100MB max)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 100MB limit' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Upload file to storage
    const fileUrl = await uploadFile(fileBuffer, file.name, file.type);

    // Extract text content from file (for Phase 2.2 full-text search)
    let contentText = '';
    try {
      contentText = await extractTextFromFile(fileBuffer, file.type);
    } catch (error) {
      console.error('Error extracting text:', error);
      // Continue even if text extraction fails
    }

    // Parse tags
    let itemTags: string[] = [];
    try {
      if (tagsJson) {
        itemTags = JSON.parse(tagsJson);
      }
    } catch (error) {
      console.error('Error parsing tags:', error);
    }

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
      metadata: {},
    }).returning();

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
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
