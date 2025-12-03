import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { translations, translationVotes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * PHASE 2: Translation Voting API
 *
 * POST: Vote on a translation (upvote or downvote)
 */

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

    const translationId = params.id;
    const body = await request.json();
    const { voteType } = body; // 'up' or 'down'

    if (voteType !== 'up' && voteType !== 'down') {
      return NextResponse.json(
        { error: 'Invalid vote type. Must be "up" or "down".' },
        { status: 400 }
      );
    }

    // Check if translation exists
    const translation = await db.query.translations.findFirst({
      where: (t, { eq }) => eq(t.id, translationId),
    });

    if (!translation) {
      return NextResponse.json(
        { error: 'Translation not found' },
        { status: 404 }
      );
    }

    // Check if user already voted
    const existingVote = await db.query.translationVotes.findFirst({
      where: (v, { eq, and }) => and(
        eq(v.translationId, translationId),
        eq(v.userId, user.id)
      ),
    });

    if (existingVote) {
      // Remove old vote counts
      if (existingVote.voteType === 'up') {
        await db.update(translations)
          .set({
            upvotes: Math.max(0, (translation.upvotes || 0) - 1),
          })
          .where(eq(translations.id, translationId));
      } else {
        await db.update(translations)
          .set({
            downvotes: Math.max(0, (translation.downvotes || 0) - 1),
          })
          .where(eq(translations.id, translationId));
      }

      // If same vote, remove it (toggle)
      if (existingVote.voteType === voteType) {
        await db.delete(translationVotes)
          .where(eq(translationVotes.id, existingVote.id));

        return NextResponse.json({
          success: true,
          message: 'Vote removed',
        });
      }

      // Update to new vote type
      await db.update(translationVotes)
        .set({ voteType })
        .where(eq(translationVotes.id, existingVote.id));
    } else {
      // Create new vote
      await db.insert(translationVotes).values({
        translationId,
        userId: user.id,
        voteType,
      });
    }

    // Update vote counts
    if (voteType === 'up') {
      await db.update(translations)
        .set({
          upvotes: (translation.upvotes || 0) + 1,
        })
        .where(eq(translations.id, translationId));
    } else {
      await db.update(translations)
        .set({
          downvotes: (translation.downvotes || 0) + 1,
        })
        .where(eq(translations.id, translationId));
    }

    // Fetch updated translation
    const updatedTranslation = await db.query.translations.findFirst({
      where: (t, { eq }) => eq(t.id, translationId),
    });

    return NextResponse.json({
      success: true,
      translation: updatedTranslation,
    });
  } catch (error) {
    console.error('Error voting on translation:', error);
    return NextResponse.json(
      {
        error: 'Failed to vote',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
