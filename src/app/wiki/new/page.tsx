"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FileText, Loader2 } from 'lucide-react';
import { TagInput } from '@/components/ui/TagInput';

export default function NewWikiPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [wikiContent, setWikiContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Please sign in to create wiki pages.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !wikiContent.trim()) {
      setError('Please fill in title and content');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/wiki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          wikiContent: wikiContent.trim(),
          tags,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create wiki page');
      }

      // Redirect to the wiki page
      router.push(`/items/${data.page.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wiki page');
      setCreating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <h1 className="text-3xl font-bold mb-8">Create New Wiki Page</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-900 text-lg"
            placeholder="Wiki Page Title"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-900"
            placeholder="Brief description of this page"
          />
        </div>

        {/* Content Editor */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Content *</label>
            <button
              type="button"
              onClick={() => setPreview(!preview)}
              className="text-sm text-blue-600 hover:underline"
            >
              {preview ? 'Edit' : 'Preview'}
            </button>
          </div>

          {preview ? (
            <div className="min-h-[400px] p-4 border rounded-lg dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{wikiContent}</div>
              </div>
            </div>
          ) : (
            <textarea
              value={wikiContent}
              onChange={(e) => setWikiContent(e.target.value)}
              rows={20}
              className="w-full px-4 py-3 border rounded-lg dark:border-gray-700 dark:bg-gray-900 font-mono text-sm"
              placeholder="Start writing your wiki page content here...

You can use plain text or markdown for formatting.

Internal linking to other pages and archive items will be added in future updates."
              required
            />
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Tip: Use markdown syntax for formatting (bold, italic, headers, lists, etc.)
          </p>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-2">Tags</label>
          <TagInput tags={tags} onChange={setTags} placeholder="Add tags to organize this page..." />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={creating}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {creating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Create Wiki Page
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 dark:border-gray-700"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Help Section */}
      <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="font-semibold mb-3">Wiki Page Tips</h3>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li>• Use descriptive titles to make pages easy to find</li>
          <li>• Add relevant tags to organize and categorize your content</li>
          <li>• Wiki pages support markdown formatting for better readability</li>
          <li>• You can edit pages later to add more information or fix errors</li>
          <li>• Use wiki pages for documentation, processes, meeting notes, and knowledge sharing</li>
        </ul>
      </div>
    </div>
  );
}
