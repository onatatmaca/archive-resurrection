import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { archiveItems } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

/**
 * Get all archive items with pagination
 * Phase 1.4 - Basic Listing
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const type = searchParams.get('type');
    const tag = searchParams.get('tag');

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build query
    let query = db.select().from(archiveItems);

    // Filter by type if specified
    if (type) {
      query = query.where(eq(archiveItems.type, type as any)) as any;
    }

    // Filter by tag if specified
    if (tag) {
      query = query.where(
        sql`${archiveItems.tags} @> ${JSON.stringify([tag])}`
      ) as any;
    }

    // Get items with pagination
    const items = await query
      .orderBy(desc(archiveItems.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(archiveItems);

    const total = Number(countResult.count);
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });

  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
}
