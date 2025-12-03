import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { translations, translationVotes } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

/**
 * PHASE 2: Translation Management API
 *
 * GET: Fetch all translations for an item
 * POST: Create a new translation
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const itemId = params.id;

    // Fetch all translations with vote counts and author info
    const itemTranslations = await db.query.translations.findMany({
      where: (t, { eq }) => eq(t.itemId, itemId),
      with: {
        author: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: (t, { desc }) => [desc(t.upvotes), desc(t.createdAt)],
    });

    return NextResponse.json({
      success: true,
      translations: itemTranslations,
    });
  } catch (error) {
    console.error('Error fetching translations:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch translations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const itemId = params.id;
    const body = await request.json();
    const { languageCode, translatedTitle, translatedDescription, translatedContent } = body;

    // Validate required fields
    if (!languageCode || !translatedContent) {
      return NextResponse.json(
        { error: 'Missing required fields: languageCode and translatedContent' },
        { status: 400 }
      );
    }

    // Check if translation already exists for this language by this user
    const existingTranslation = await db.query.translations.findFirst({
      where: (t, { eq, and }) => and(
        eq(t.itemId, itemId),
        eq(t.languageCode, languageCode),
        eq(t.authorId, user.id)
      ),
    });

    if (existingTranslation) {
      return NextResponse.json(
        { error: 'You already have a translation for this language. Edit your existing translation instead.' },
        { status: 409 }
      );
    }

    // Create translation
    const [newTranslation] = await db.insert(translations).values({
      itemId,
      languageCode,
      translatedTitle: translatedTitle || null,
      translatedDescription: translatedDescription || null,
      translatedContent,
      authorType: 'human',
      authorId: user.id,
      status: 'pending', // Requires moderation
      isOfficial: false,
    }).returning();

    // Fetch with author info
    const translationWithAuthor = await db.query.translations.findFirst({
      where: (t, { eq }) => eq(t.id, newTranslation.id),
      with: {
        author: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      translation: translationWithAuthor,
    });
  } catch (error) {
    console.error('Error creating translation:', error);
    return NextResponse.json(
      {
        error: 'Failed to create translation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
