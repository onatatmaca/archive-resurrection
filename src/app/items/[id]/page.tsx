// PHASE 2: Universal Viewer - Complete Implementation
// This file contains all Phase 2 features integrated into the viewer
// Rename to page.tsx when ready to deploy

"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  FileText, Download, Edit, Trash2, User, Calendar, Loader2,
  Globe, ThumbsUp, ThumbsDown, Plus, BookOpen, Copy, Check, Languages
} from 'lucide-react';
import { format } from 'date-fns';
import { TagInput } from '@/components/ui/TagInput';
import {
  generateAPA,
  generateMLA,
  generateChicago,
  generateBibTeX,
  generatePlainText,
  type CitationData
} from '@/lib/utils/citation-generator';

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

interface Translation {
  id: string;
  languageCode: string;
  translatedTitle: string | null;
  translatedDescription: string | null;
  translatedContent: string | null;
  authorType: 'human' | 'ai';
  upvotes: number;
  downvotes: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  isOfficial: boolean;
  createdAt: string;
  author?: {
    id: string;
    name: string | null;
    email: string;
  };
}

export default function UniversalViewerPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const router = useRouter();

  // Item state
  const [item, setItem] = useState<ArchiveItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Translation state
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [selectedLang, setSelectedLang] = useState<string>('original');
  const [showAddTranslation, setShowAddTranslation] = useState(false);
  const [newTransLang, setNewTransLang] = useState('');
  const [newTransTitle, setNewTransTitle] = useState('');
  const [newTransDesc, setNewTransDesc] = useState('');
  const [newTransContent, setNewTransContent] = useState('');
  const [submittingTrans, setSubmittingTrans] = useState(false);

  // Citation state
  const [showCitation, setShowCitation] = useState(false);
  const [citationFormat, setCitationFormat] = useState<'apa' | 'mla' | 'chicago' | 'bibtex' | 'plaintext'>('apa');
  const [copied, setCopied] = useState(false);

  // Split-pane state
  const [splitView, setSplitView] = useState(false);

  useEffect(() => {
    if (session) {
      fetchItem();
      fetchTranslations();
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
      } else {
        console.error('Item not found');
      }
    } catch (error) {
      console.error('Error fetching item:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTranslations = async () => {
    try {
      const response = await fetch(`/api/items/${params.id}/translations`);
      const data = await response.json();

      if (response.ok) {
        setTranslations(data.translations);
      }
    } catch (error) {
      console.error('Error fetching translations:', error);
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

  const handleSubmitTranslation = async () => {
    if (!newTransLang || !newTransContent) {
      alert('Please fill in language code and content');
      return;
    }

    setSubmittingTrans(true);
    try {
      const response = await fetch(`/api/items/${params.id}/translations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          languageCode: newTransLang,
          translatedTitle: newTransTitle || null,
          translatedDescription: newTransDesc || null,
          translatedContent: newTransContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setTranslations([...translations, data.translation]);
        setShowAddTranslation(false);
        setNewTransLang('');
        setNewTransTitle('');
        setNewTransDesc('');
        setNewTransContent('');
        alert('Translation submitted successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to submit translation');
      }
    } catch (error) {
      console.error('Error submitting translation:', error);
      alert('Failed to submit translation');
    } finally {
      setSubmittingTrans(false);
    }
  };

  const handleVote = async (translationId: string, voteType: 'up' | 'down') => {
    try {
      const response = await fetch(`/api/translations/${translationId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType }),
      });

      if (response.ok) {
        fetchTranslations(); // Refresh translations
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const generateCitation = (): string => {
    if (!item) return '';

    const citationData: CitationData = {
      title: item.title,
      author: item.uploader?.name || undefined,
      date: item.createdAt,
      url: window.location.href,
      archiveName: 'Archive Resurrection',
      itemType: item.type,
    };

    switch (citationFormat) {
      case 'apa':
        return generateAPA(citationData);
      case 'mla':
        return generateMLA(citationData);
      case 'chicago':
        return generateChicago(citationData);
      case 'bibtex':
        return generateBibTeX(citationData);
      case 'plaintext':
        return generatePlainText(citationData);
      default:
        return '';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const getSelectedTranslation = () => {
    if (selectedLang === 'original') return null;
    return translations.find(t => t.languageCode === selectedLang);
  };

  const renderContent = (content: string | null) => {
    if (!content) return <p className="text-gray-500">No content available</p>;

    return (
      <div className="prose dark:prose-invert max-w-none">
        <pre className="whitespace-pre-wrap font-sans">{content}</pre>
      </div>
    );
  };

  const renderPreview = () => {
    if (!item) return null;

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

    return null;
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
  const selectedTranslation = getSelectedTranslation();

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      {/* Header with Translation Controls */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            {editing ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full text-3xl font-bold px-4 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-900"
              />
            ) : (
              <h1 className="text-3xl font-bold mb-2">{item.title}</h1>
            )}
          </div>

          <div className="flex gap-2 ml-4">
            {/* Translation Selector */}
            <div className="flex items-center gap-2 px-4 py-2 border rounded-lg dark:border-gray-700">
              <Languages className="w-4 h-4" />
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="bg-transparent border-none outline-none"
              >
                <option value="original">Original</option>
                {translations.map(t => (
                  <option key={t.id} value={t.languageCode}>
                    {t.languageCode.toUpperCase()} ({t.upvotes} ↑)
                  </option>
                ))}
              </select>
            </div>

            {/* Split View Toggle */}
            {selectedTranslation && (
              <button
                onClick={() => setSplitView(!splitView)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 dark:border-gray-700"
              >
                {splitView ? 'Single View' : 'Split View'}
              </button>
            )}

            {/* Citation Button */}
            <button
              onClick={() => setShowCitation(!showCitation)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 dark:border-gray-700"
            >
              <BookOpen className="w-4 h-4" />
              Cite
            </button>

            {isOwner && (
              <>
                <button
                  onClick={() => setEditing(!editing)}
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
              </>
            )}
          </div>
        </div>

        {/* Citation Generator */}
        {showCitation && (
          <div className="mb-6 p-6 border rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h3 className="text-lg font-semibold mb-4">Citation Generator</h3>
            <div className="flex gap-2 mb-4">
              {(['apa', 'mla', 'chicago', 'bibtex', 'plaintext'] as const).map(format => (
                <button
                  key={format}
                  onClick={() => setCitationFormat(format)}
                  className={`px-3 py-1 rounded ${
                    citationFormat === format
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="relative">
              <pre className="bg-white dark:bg-gray-800 p-4 rounded border dark:border-gray-700 text-sm overflow-x-auto">
                {generateCitation()}
              </pre>
              <button
                onClick={() => copyToClipboard(generateCitation())}
                className="absolute top-2 right-2 p-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Metadata */}
        {!editing && (
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
            {item.fileUrl && (
              <a
                href={item.fileUrl}
                download={item.fileName}
                className="flex items-center gap-2 text-blue-600 hover:underline"
              >
                <Download className="w-4 h-4" />
                Download ({formatFileSize(item.fileSize)})
              </a>
            )}
          </div>
        )}
      </div>

      {/* PHASE 2: Split-Pane View or Single View */}
      {splitView && selectedTranslation ? (
        <div className="grid grid-cols-2 gap-6">
          {/* Original Content */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Original Content
            </h3>
            {renderPreview() || renderContent(item.contentText)}
          </div>

          {/* Translation */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Languages className="w-5 h-5" />
              {selectedTranslation.languageCode.toUpperCase()} Translation
            </h3>
            {renderContent(selectedTranslation.translatedContent)}
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
              <button
                onClick={() => handleVote(selectedTranslation.id, 'up')}
                className="flex items-center gap-1 hover:text-green-600"
              >
                <ThumbsUp className="w-4 h-4" />
                {selectedTranslation.upvotes}
              </button>
              <button
                onClick={() => handleVote(selectedTranslation.id, 'down')}
                className="flex items-center gap-1 hover:text-red-600"
              >
                <ThumbsDown className="w-4 h-4" />
                {selectedTranslation.downvotes}
              </button>
              <span>by {selectedTranslation.author?.name || 'Anonymous'}</span>
              <span>({selectedTranslation.authorType})</span>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {selectedTranslation ? (
            <div>
              <h3 className="text-lg font-semibold mb-4">{selectedTranslation.languageCode.toUpperCase()} Translation</h3>
              {renderContent(selectedTranslation.translatedContent)}
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                <button
                  onClick={() => handleVote(selectedTranslation.id, 'up')}
                  className="flex items-center gap-1 hover:text-green-600"
                >
                  <ThumbsUp className="w-4 h-4" />
                  {selectedTranslation.upvotes}
                </button>
                <button
                  onClick={() => handleVote(selectedTranslation.id, 'down')}
                  className="flex items-center gap-1 hover:text-red-600"
                >
                  <ThumbsDown className="w-4 h-4" />
                  {selectedTranslation.downvotes}
                </button>
                <span>by {selectedTranslation.author?.name || 'Anonymous'}</span>
              </div>
            </div>
          ) : (
            renderPreview() || renderContent(item.contentText)
          )}
        </div>
      )}

      {/* PHASE 2: Add Translation UI */}
      <div className="mt-8 p-6 border rounded-lg dark:border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Collaborative Translations</h3>
          <button
            onClick={() => setShowAddTranslation(!showAddTranslation)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Translation
          </button>
        </div>

        {showAddTranslation && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Language Code (e.g., tr, de, fr)"
                value={newTransLang}
                onChange={(e) => setNewTransLang(e.target.value)}
                className="px-4 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-800"
              />
              <input
                type="text"
                placeholder="Translated Title (optional)"
                value={newTransTitle}
                onChange={(e) => setNewTransTitle(e.target.value)}
                className="px-4 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
            <textarea
              placeholder="Translated Description (optional)"
              value={newTransDesc}
              onChange={(e) => setNewTransDesc(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-800"
            />
            <textarea
              placeholder="Translated Content *"
              value={newTransContent}
              onChange={(e) => setNewTransContent(e.target.value)}
              rows={6}
              className="w-full px-4 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-800"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSubmitTranslation}
                disabled={submittingTrans}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {submittingTrans ? 'Submitting...' : 'Submit Translation'}
              </button>
              <button
                onClick={() => setShowAddTranslation(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Translation List */}
        <div className="space-y-4">
          {translations.map(trans => (
            <div key={trans.id} className="p-4 border rounded-lg dark:border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{trans.languageCode.toUpperCase()}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    by {trans.author?.name || 'Anonymous'} ({trans.authorType})
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleVote(trans.id, 'up')}
                    className="flex items-center gap-1 hover:text-green-600"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    {trans.upvotes}
                  </button>
                  <button
                    onClick={() => handleVote(trans.id, 'down')}
                    className="flex items-center gap-1 hover:text-red-600"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    {trans.downvotes}
                  </button>
                  <button
                    onClick={() => setSelectedLang(trans.languageCode)}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
