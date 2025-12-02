"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { FileText, Image, Archive, File, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { formatDistance } from 'date-fns';

interface ArchiveItem {
  id: string;
  title: string;
  description: string | null;
  type: string;
  fileUrl: string | null;
  fileName: string | null;
  mimeType: string | null;
  tags: string[];
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function BrowsePage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (session) {
      fetchItems(1, filterType);
    }
  }, [session, filterType]);

  const fetchItems = async (page: number, type: string = 'all') => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (type !== 'all') {
        queryParams.append('type', type);
      }

      const response = await fetch(`/api/items?${queryParams}`);
      const data = await response.json();

      setItems(data.items);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="w-6 h-6 text-blue-600" />;
      case 'photo':
        return <Image className="w-6 h-6 text-green-600" />;
      case 'archive':
        return <Archive className="w-6 h-6 text-purple-600" />;
      case 'video':
        return <FileText className="w-6 h-6 text-red-600" />;
      case 'audio':
        return <FileText className="w-6 h-6 text-yellow-600" />;
      default:
        return <File className="w-6 h-6 text-gray-600" />;
    }
  };

  const getThumbnail = (item: ArchiveItem) => {
    if (item.type === 'photo' && item.fileUrl) {
      return (
        <img
          src={item.fileUrl}
          alt={item.title}
          className="w-full h-48 object-cover"
        />
      );
    }
    return (
      <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        {getIcon(item.type)}
      </div>
    );
  };

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Please sign in to browse the archive.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Browse Archive</h1>

        {/* Filter by Type */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-900"
        >
          <option value="all">All Types</option>
          <option value="document">Documents</option>
          <option value="photo">Photos</option>
          <option value="video">Videos</option>
          <option value="audio">Audio</option>
          <option value="text">Text Files</option>
          <option value="archive">Archives</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 border rounded-lg dark:border-gray-700">
          <p className="text-gray-500 mb-4">No items found</p>
          <Link
            href="/upload"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition inline-block"
          >
            Upload your first item
          </Link>
        </div>
      ) : (
        <>
          {/* Items Grid */}
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/items/${item.id}`}
                className="border rounded-lg overflow-hidden hover:shadow-lg transition dark:border-gray-700"
              >
                {getThumbnail(item)}
                <div className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                      {item.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {item.tags.length > 3 && (
                      <span className="text-xs px-2 py-1 text-gray-500">
                        +{item.tags.length - 3}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatDistance(new Date(item.createdAt), new Date(), { addSuffix: true })}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button
                onClick={() => fetchItems(pagination.page - 1, filterType)}
                disabled={pagination.page === 1}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchItems(pagination.page + 1, filterType)}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
