/**
 * PHASE 3: Fuzzy Date Utilities
 *
 * Renders approximate dates with proper formatting and context
 */

export type DatePrecision = 'day' | 'month' | 'year' | 'decade' | 'century' | 'era';

export interface FuzzyDate {
  displayDate: string;
  dateStart: string;
  dateEnd: string;
  isApproximate: boolean;
  precision?: DatePrecision | null;
}

/**
 * Get decade from year (e.g., 1995 -> "1990s")
 */
export function getDecade(year: number): string {
  const decadeStart = Math.floor(year / 10) * 10;
  return `${decadeStart}s`;
}

/**
 * Get century from year (e.g., 1995 -> "20th Century")
 */
export function getCentury(year: number): string {
  const century = Math.ceil(year / 100);
  const suffix = century === 1 ? 'st' : century === 2 ? 'nd' : century === 3 ? 'rd' : 'th';
  return `${century}${suffix} Century`;
}

/**
 * Format date range as human-readable text
 */
export function formatDateRange(startDate: Date, endDate: Date): string {
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  // Same year
  if (startYear === endYear) {
    const startMonth = startDate.getMonth();
    const endMonth = endDate.getMonth();

    // Same month
    if (startMonth === endMonth) {
      const startDay = startDate.getDate();
      const endDay = endDate.getDate();

      // Same day
      if (startDay === endDay) {
        return startDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }

      // Different days, same month
      return `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${endDay}, ${startYear}`;
    }

    // Different months, same year
    return `${startDate.toLocaleDateString('en-US', { month: 'long' })} - ${endDate.toLocaleDateString('en-US', { month: 'long' })}, ${startYear}`;
  }

  // Different years
  return `${startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })} - ${endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`;
}

/**
 * Get approximate date descriptor based on precision
 */
export function getApproximateDescriptor(precision?: DatePrecision | null): string {
  switch (precision) {
    case 'decade':
      return 'circa';
    case 'century':
      return 'approximately';
    case 'era':
      return 'around';
    default:
      return 'circa';
  }
}

/**
 * Render fuzzy date as human-readable string
 */
export function renderFuzzyDate(fuzzyDate: FuzzyDate): string {
  // If custom display text is provided, use it
  if (fuzzyDate.displayDate && fuzzyDate.displayDate.trim()) {
    return fuzzyDate.displayDate;
  }

  const startDate = new Date(fuzzyDate.dateStart);
  const endDate = new Date(fuzzyDate.dateEnd);

  // Exact date (start === end)
  if (fuzzyDate.dateStart === fuzzyDate.dateEnd && !fuzzyDate.isApproximate) {
    return startDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // Approximate date with precision
  if (fuzzyDate.isApproximate) {
    const descriptor = getApproximateDescriptor(fuzzyDate.precision);

    if (fuzzyDate.precision === 'decade') {
      return `${descriptor} ${getDecade(startDate.getFullYear())}`;
    }

    if (fuzzyDate.precision === 'century') {
      return `${descriptor} ${getCentury(startDate.getFullYear())}`;
    }

    if (fuzzyDate.precision === 'year') {
      return `${descriptor} ${startDate.getFullYear()}`;
    }

    if (fuzzyDate.precision === 'month') {
      return `${descriptor} ${startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`;
    }
  }

  // Date range
  return formatDateRange(startDate, endDate);
}

/**
 * Get timeline position (0-100) based on date
 * Used for positioning items on vertical timeline
 */
export function getTimelinePosition(
  date: Date,
  minDate: Date,
  maxDate: Date
): number {
  const totalRange = maxDate.getTime() - minDate.getTime();
  const dateOffset = date.getTime() - minDate.getTime();
  return (dateOffset / totalRange) * 100;
}

/**
 * Cluster dates by time period
 */
export type TimeCluster = 'era' | 'century' | 'decade' | 'year' | 'month';

export function clusterByPeriod(
  items: Array<{ date: FuzzyDate }>,
  clusterType: TimeCluster
): Map<string, Array<{ date: FuzzyDate }>> {
  const clusters = new Map<string, Array<{ date: FuzzyDate }>>();

  items.forEach(item => {
    const date = new Date(item.date.dateStart);
    let key: string;

    switch (clusterType) {
      case 'year':
        key = date.getFullYear().toString();
        break;
      case 'decade':
        key = getDecade(date.getFullYear());
        break;
      case 'century':
        key = getCentury(date.getFullYear());
        break;
      case 'month':
        key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        break;
      case 'era':
        // Group by 100-year periods
        const eraStart = Math.floor(date.getFullYear() / 100) * 100;
        key = `${eraStart}-${eraStart + 99}`;
        break;
      default:
        key = date.getFullYear().toString();
    }

    if (!clusters.has(key)) {
      clusters.set(key, []);
    }

    clusters.get(key)!.push(item);
  });

  return clusters;
}

/**
 * Determine appropriate clustering level based on date range
 */
export function getAutoClusterLevel(minDate: Date, maxDate: Date): TimeCluster {
  const yearDiff = maxDate.getFullYear() - minDate.getFullYear();

  if (yearDiff >= 200) return 'century';
  if (yearDiff >= 50) return 'decade';
  if (yearDiff >= 5) return 'year';
  return 'month';
}

/**
 * Format cluster label for display
 */
export function formatClusterLabel(key: string, clusterType: TimeCluster): string {
  switch (clusterType) {
    case 'decade':
      return key; // Already formatted as "1990s"
    case 'century':
      return key; // Already formatted as "20th Century"
    case 'year':
      return key;
    case 'month':
      return key;
    case 'era':
      return key;
    default:
      return key;
  }
}
