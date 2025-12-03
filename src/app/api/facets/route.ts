import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { facets } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';

/**
 * GET /api/facets
 * Fetch all facets grouped by category
 */
export async function GET() {
  try {
    const allFacets = await db.query.facets.findMany({
      orderBy: [asc(facets.category), asc(facets.sortOrder)],
    });

    // Group facets by category
    const grouped = allFacets.reduce((acc, facet) => {
      if (!acc[facet.category]) {
        acc[facet.category] = [];
      }
      acc[facet.category].push({
        id: facet.id,
        value: facet.value,
        slug: facet.slug,
        description: facet.description,
        isRequired: facet.isRequired,
      });
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      success: true,
      facets: grouped,
    });
  } catch (error) {
    console.error('Error fetching facets:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch facets',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
