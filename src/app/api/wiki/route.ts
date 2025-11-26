import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { archiveItems, tags } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Create a new wiki page
 * Phase 1.6 - Wiki Page Creation
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

    // Parse request body
    const body = await request.json();
    const { title, description, wikiContent, tags: itemTags } = body;

    // Validate required fields
    if (!title || !wikiContent) {
      return NextResponse.json(
        { error: 'Missing required fields: title or content' },
        { status: 400 }
      );
    }

    // Create wiki page in database
    const [newPage] = await db.insert(archiveItems).values({
      title,
      description: description || null,
      type: 'wiki_page',
      wikiContent,
      contentText: wikiContent, // Use wiki content for full-text search
      tags: itemTags || [],
      uploaderId: user.id,
      metadata: {},
    }).returning();

    // Update tag usage counts
    if (itemTags && itemTags.length > 0) {
      for (const tagName of itemTags) {
        const slug = tagName.toLowerCase().replace(/\s+/g, '-');

        // Check if tag exists
        const existingTag = await db.query.tags.findFirst({
          where: (tags, { eq }) => eq(tags.slug, slug),
        });

        if (existingTag) {
          // Increment usage count
          const currentCount = parseInt(existingTag.usageCount || '0', 10);
          await db.update(tags)
            .set({ usageCount: (currentCount + 1).toString() })
            .where(eq(tags.id, existingTag.id));
        } else {
          // Create new tag
          await db.insert(tags).values({
            name: tagName,
            slug,
            usageCount: '1',
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      page: newPage,
    });

  } catch (error) {
    console.error('Error creating wiki page:', error);
    return NextResponse.json(
      { error: 'Failed to create wiki page' },
      { status: 500 }
    );
  }
}
