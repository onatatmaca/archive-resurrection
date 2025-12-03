import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { archiveItems, archiveDates } from '@/lib/db/schema';
import { desc, asc, and, gte, lte, eq, inArray } from 'drizzle-orm';

/**
 * PHASE 3: Timeline API
 *
 * Fetches archive items with their dates for timeline visualization
 * Supports filtering by date range, facets, and tags
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Filtering parameters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const facetIds = searchParams.get('facetIds'); // comma-separated
    const tags = searchParams.get('tags'); // comma-separated
    const sortOrder = searchParams.get('sort') || 'desc'; // 'asc' or 'desc'

    // Fetch all items with their dates
    const itemsWithDates = await db.query.archiveItems.findMany({
      with: {
        uploader: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        dates: true, // Include archive_dates
        facets: {
          with: {
            facet: true,
          },
        },
      },
      orderBy: (items, { desc }) => [desc(items.createdAt)],
    });

    // Filter by date range if provided
    let filteredItems = itemsWithDates;

    if (startDate || endDate) {
      filteredItems = filteredItems.filter(item => {
        if (!item.dates || item.dates.length === 0) return false;

        const itemDate = item.dates[0]; // Use first date

        if (startDate && new Date(itemDate.dateEnd) < new Date(startDate)) {
          return false;
        }

        if (endDate && new Date(itemDate.dateStart) > new Date(endDate)) {
          return false;
        }

        return true;
      });
    }

    // Filter by facets if provided
    if (facetIds) {
      const facetIdArray = facetIds.split(',');
      filteredItems = filteredItems.filter(item => {
        const itemFacetIds = item.facets.map(f => f.facet.id);
        return facetIdArray.some(id => itemFacetIds.includes(id));
      });
    }

    // Filter by tags if provided
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim().toLowerCase());
      filteredItems = filteredItems.filter(item => {
        const itemTags = item.tags.map((t: string) => t.toLowerCase());
        return tagArray.some(tag => itemTags.includes(tag));
      });
    }

    // Sort items by date
    filteredItems.sort((a, b) => {
      const dateA = a.dates && a.dates.length > 0 ? new Date(a.dates[0].dateStart) : new Date(a.createdAt);
      const dateB = b.dates && b.dates.length > 0 ? new Date(b.dates[0].dateStart) : new Date(b.createdAt);

      return sortOrder === 'asc'
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    });

    // Format response
    const timelineItems = filteredItems.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      type: item.type,
      tags: item.tags,
      createdAt: item.createdAt,
      uploader: item.uploader,
      date: item.dates && item.dates.length > 0 ? {
        displayDate: item.dates[0].displayDate,
        dateStart: item.dates[0].dateStart,
        dateEnd: item.dates[0].dateEnd,
        isApproximate: item.dates[0].isApproximate,
        precision: item.dates[0].precision,
      } : null,
      facets: item.facets.map(f => ({
        id: f.facet.id,
        category: f.facet.category,
        value: f.facet.value,
      })),
    }));

    return NextResponse.json({
      success: true,
      items: timelineItems,
      count: timelineItems.length,
    });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch timeline',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
