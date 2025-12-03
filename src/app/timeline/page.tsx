"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Clock, Filter, Calendar, Tag, Layers, ChevronDown, ChevronRight,
  Loader2, FileText, Image, Video, Music, Archive
} from 'lucide-react';
import Link from 'next/link';
import {
  renderFuzzyDate,
  clusterByPeriod,
  getAutoClusterLevel,
  formatClusterLabel,
  type FuzzyDate,
  type TimeCluster
} from '@/lib/utils/fuzzy-date';

interface TimelineItem {
  id: string;
  title: string;
  description: string | null;
  type: string;
  tags: string[];
  createdAt: string;
  uploader?: {
    id: string;
    name: string | null;
    email: string;
  };
  date: FuzzyDate | null;
  facets: Array<{
    id: string;
    category: string;
    value: string;
  }>;
}

export default function TimelinePage() {
  const { data: session } = useSession();
  const router = useRouter();

  // Timeline data
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtering state
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedFacets, setSelectedFacets] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Clustering state
  const [clusterLevel, setClusterLevel] = useState<TimeCluster>('decade');
  const [autoCluster, setAutoCluster] = useState(true);
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set());

  // Facets and tags for filtering
  const [availableFacets, setAvailableFacets] = useState<any>({});
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    if (session) {
      fetchTimeline();
      fetchFacets();
    }
  }, [session, startDate, endDate, selectedTags, selectedFacets, sortOrder]);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedTags.length > 0) params.append('tags', selectedTags.join(','));
      if (selectedFacets.length > 0) params.append('facetIds', selectedFacets.join(','));
      params.append('sort', sortOrder);

      const response = await fetch(`/api/timeline?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setItems(data.items);

        // Auto-determine cluster level
        if (autoCluster && data.items.length > 0) {
          const dates = data.items
            .filter((item: TimelineItem) => item.date)
            .map((item: TimelineItem) => new Date(item.date!.dateStart));

          if (dates.length > 0) {
            const minDate = new Date(Math.min(...dates.map((d: Date) => d.getTime())));
            const maxDate = new Date(Math.max(...dates.map((d: Date) => d.getTime())));
            setClusterLevel(getAutoClusterLevel(minDate, maxDate));
          }
        }

        // Extract unique tags
        const tags = new Set<string>();
        data.items.forEach((item: TimelineItem) => {
          item.tags.forEach(tag => tags.add(tag));
        });
        setAvailableTags(Array.from(tags).sort());
      }
    } catch (error) {
      console.error('Error fetching timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacets = async () => {
    try {
      const response = await fetch('/api/facets');
      const data = await response.json();

      if (response.ok) {
        setAvailableFacets(data.facets);
      }
    } catch (error) {
      console.error('Error fetching facets:', error);
    }
  };

  const toggleCluster = (key: string) => {
    const newExpanded = new Set(expandedClusters);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedClusters(newExpanded);
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const toggleFacet = (facetId: string) => {
    if (selectedFacets.includes(facetId)) {
      setSelectedFacets(selectedFacets.filter(f => f !== facetId));
    } else {
      setSelectedFacets([...selectedFacets, facetId]);
    }
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedTags([]);
    setSelectedFacets([]);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'photo':
        return <Image className="w-5 h-5" />;
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'audio':
        return <Music className="w-5 h-5" />;
      case 'archive':
        return <Archive className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  // Cluster items
  const itemsWithDates = items.filter((item): item is TimelineItem & { date: FuzzyDate } => item.date !== null);
  const clusteredItems = clusterByPeriod(itemsWithDates, clusterLevel);
  const sortedClusterKeys = Array.from(clusteredItems.keys()).sort((a, b) => {
    return sortOrder === 'desc' ? b.localeCompare(a) : a.localeCompare(b);
  });

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Please sign in to view the timeline.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Clock className="w-8 h-8" />
              Time Stream
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Explore historical archive items chronologically
            </p>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 dark:border-gray-700"
          >
            <Filter className="w-4 h-4" />
            Filters {(selectedTags.length + selectedFacets.length > 0) && `(${selectedTags.length + selectedFacets.length})`}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-6 border rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-900 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Filters</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:underline"
              >
                Clear all
              </button>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">From</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">To</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-800 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Facets */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Categories
              </label>
              <div className="space-y-3">
                {Object.entries(availableFacets).map(([category, facetList]: [string, any]) => (
                  <div key={category}>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      {category.replace(/_/g, ' ').toUpperCase()}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {facetList.map((facet: any) => (
                        <button
                          key={facet.id}
                          onClick={() => toggleFacet(facet.id)}
                          className={`px-2 py-1 rounded text-xs ${
                            selectedFacets.includes(facet.id)
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        >
                          {facet.value.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sort & Cluster */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium mb-2">Sort Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="w-full px-3 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-800 text-sm"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Cluster By</label>
                <select
                  value={clusterLevel}
                  onChange={(e) => {
                    setClusterLevel(e.target.value as TimeCluster);
                    setAutoCluster(false);
                  }}
                  className="w-full px-3 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-800 text-sm"
                >
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                  <option value="decade">Decade</option>
                  <option value="century">Century</option>
                  <option value="era">Era</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>No items found in timeline</p>
          <p className="text-sm mt-2">Try adjusting your filters or upload some items with dates</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-600 via-purple-600 to-pink-600"></div>

          {/* Clustered items */}
          <div className="space-y-8">
            {sortedClusterKeys.map(clusterKey => {
              const clusterItems = clusteredItems.get(clusterKey)!;
              const isExpanded = expandedClusters.has(clusterKey);

              return (
                <div key={clusterKey} className="relative">
                  {/* Cluster Header */}
                  <button
                    onClick={() => toggleCluster(clusterKey)}
                    className="flex items-center gap-3 mb-4 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg transition w-full"
                  >
                    <div className="relative z-10 w-16 h-16 bg-white dark:bg-gray-900 border-4 border-blue-600 rounded-full flex items-center justify-center font-bold text-blue-600 shadow-lg">
                      {isExpanded ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                    </div>
                    <div className="text-left">
                      <h2 className="text-2xl font-bold">{formatClusterLabel(clusterKey, clusterLevel)}</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{clusterItems.length} items</p>
                    </div>
                  </button>

                  {/* Cluster Items */}
                  {isExpanded && (
                    <div className="ml-20 space-y-6">
                      {clusterItems.map((item: any) => (
                        <Link
                          key={item.id}
                          href={`/items/${item.id}`}
                          className="block group"
                        >
                          <div className="relative">
                            {/* Timeline dot */}
                            <div className="absolute -left-[4.5rem] top-4 w-4 h-4 bg-purple-600 rounded-full border-4 border-white dark:border-gray-900 group-hover:scale-125 transition"></div>

                            {/* Item card */}
                            <div className="p-6 border rounded-lg dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition bg-white dark:bg-gray-900">
                              <div className="flex gap-4">
                                <div className="text-blue-600">{getTypeIcon(item.type)}</div>
                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-600 transition">
                                    {item.title}
                                  </h3>
                                  {item.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                      {item.description}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap gap-2 items-center text-xs text-gray-500">
                                    {item.date && (
                                      <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                                        <Calendar className="w-3 h-3" />
                                        {renderFuzzyDate(item.date)}
                                      </span>
                                    )}
                                    {item.uploader && (
                                      <span>by {item.uploader.name || item.uploader.email}</span>
                                    )}
                                  </div>
                                  {item.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                      {item.tags.map((tag: string, idx: number) => (
                                        <span
                                          key={idx}
                                          className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      {!loading && items.length > 0 && (
        <div className="mt-12 p-6 border rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h3 className="text-lg font-semibold mb-4">Timeline Statistics</h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-2xl font-bold text-blue-600">{items.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{sortedClusterKeys.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Time Periods</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-pink-600">
                {items.filter(i => i.date?.isApproximate).length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Fuzzy Dates</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
