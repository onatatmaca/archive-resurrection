import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { archiveItems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Get a single archive item by ID
 * Phase 1.3 - Item Detail Page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const item = await db.query.archiveItems.findFirst({
      where: eq(archiveItems.id, params.id),
      with: {
        uploader: true,
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ item });

  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch item' },
      { status: 500 }
    );
  }
}

/**
 * Update an archive item
 * Phase 2.5 - Edit Functionality
 */
export async function PATCH(
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

    // Get the user
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, session.user!.email!),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get the item to check ownership
    const item = await db.query.archiveItems.findFirst({
      where: eq(archiveItems.id, params.id),
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Check if user is the owner
    if (item.uploaderId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only edit your own items' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { title, description, tags, wikiContent } = body;

    // Update the item
    const [updatedItem] = await db.update(archiveItems)
      .set({
        title: title || item.title,
        description: description !== undefined ? description : item.description,
        tags: tags || item.tags,
        wikiContent: wikiContent !== undefined ? wikiContent : item.wikiContent,
        updatedAt: new Date(),
      })
      .where(eq(archiveItems.id, params.id))
      .returning();

    return NextResponse.json({ item: updatedItem });

  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    );
  }
}

/**
 * Delete an archive item
 * Phase 2.5 - Delete Functionality
 */
export async function DELETE(
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

    // Get the user
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, session.user!.email!),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get the item to check ownership
    const item = await db.query.archiveItems.findFirst({
      where: eq(archiveItems.id, params.id),
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Check if user is the owner
    if (item.uploaderId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own items' },
        { status: 403 }
      );
    }

    // Delete the item
    await db.delete(archiveItems).where(eq(archiveItems.id, params.id));

    // TODO: Also delete the file from storage
    // await deleteFile(item.fileUrl);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}
