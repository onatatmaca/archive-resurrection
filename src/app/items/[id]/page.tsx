"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FileText, Download, Edit, Trash2, User, Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { TagInput } from '@/components/ui/TagInput';

interface ArchiveItem {
  id: string;
  title: string;
  description: string | null;
  type: string;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: string | null;
  mimeType: string | null;
  contentText: string | null;
  wikiContent: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  uploaderId: string;
  uploader?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [item, setItem] = useState<ArchiveItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editWikiContent, setEditWikiContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (session) {
      fetchItem();
    }
  }, [session, params.id]);

  const fetchItem = async () => {
    try {
      const response = await fetch(`/api/items/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setItem(data.item);
        setEditTitle(data.item.title);
        setEditDescription(data.item.description || '');
        setEditTags(data.item.tags);
        setEditWikiContent(data.item.wikiContent || '');
      } else {
        console.error('Item not found');
      }
    } catch (error) {
      console.error('Error fetching item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!item) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/items/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          tags: editTags,
          wikiContent: editWikiContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setItem(data.item);
        setEditing(false);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/items/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/browse');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Failed to delete item');
    } finally {
      setDeleting(false);
    }
  };

  const formatFileSize = (bytes: string | null) => {
    if (!bytes) return 'Unknown';
    const size = parseInt(bytes, 10);
    if (size === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return Math.round(size / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const renderPreview = () => {
    if (!item) return null;

    if (item.type === 'wiki_page') {
      return (
        <div className="prose dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap">{item.wikiContent}</div>
        </div>
      );
    }

    if (item.type === 'photo' && item.fileUrl) {
      return (
        <img
          src={item.fileUrl}
          alt={item.title}
          className="max-w-full h-auto rounded-lg"
        />
      );
    }

    if (item.type === 'document' && item.mimeType === 'application/pdf' && item.fileUrl) {
      return (
        <iframe
          src={item.fileUrl}
          className="w-full h-[600px] border rounded-lg dark:border-gray-700"
        />
      );
    }

    if (item.type === 'text' && item.contentText) {
      return (
        <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
          {item.contentText}
        </pre>
      );
    }

    return (
      <div className="text-center py-12 border rounded-lg dark:border-gray-700">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500">Preview not available</p>
        {item.fileUrl && (
          <a
            href={item.fileUrl}
            download={item.fileName}
            className="inline-flex items-center gap-2 mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Download className="w-4 h-4" />
            Download File
          </a>
        )}
      </div>
    );
  };

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Please sign in to view this item.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Item not found</p>
      </div>
    );
  }

  const isOwner = session?.user?.email === item.uploader?.email;

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        {editing ? (
          <div className="space-y-4">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full text-3xl font-bold px-4 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-900"
            />
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              placeholder="Description"
              className="w-full px-4 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-900"
            />
            {item.type === 'wiki_page' && (
              <div>
                <label className="block text-sm font-medium mb-2">Wiki Content</label>
                <textarea
                  value={editWikiContent}
                  onChange={(e) => setEditWikiContent(e.target.value)}
                  rows={15}
                  className="w-full px-4 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-900 font-mono text-sm"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <TagInput tags={editTags} onChange={setEditTags} />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditTitle(item.title);
                  setEditDescription(item.description || '');
                  setEditTags(item.tags);
                  setEditWikiContent(item.wikiContent || '');
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 dark:border-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{item.title}</h1>
                {item.description && (
                  <p className="text-gray-600 dark:text-gray-400">{item.description}</p>
                )}
              </div>
              {isOwner && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 dark:border-gray-700"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-2 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}
            </div>

            {/* Tags */}
            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {item.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap gap-6 text-sm text-gray-600 dark:text-gray-400">
              {item.uploader && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{item.uploader.name || item.uploader.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(item.createdAt), 'PPP')}</span>
              </div>
              {item.fileName && (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>{item.fileName} ({formatFileSize(item.fileSize)})</span>
                </div>
              )}
              {item.fileUrl && (
                <a
                  href={item.fileUrl}
                  download={item.fileName}
                  className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              )}
            </div>
          </>
        )}
      </div>

      {/* Preview */}
      {!editing && (
        <div className="mt-8">
          {renderPreview()}
        </div>
      )}
    </div>
  );
}
