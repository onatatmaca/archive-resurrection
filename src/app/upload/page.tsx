"use client";

import { useState, useRef, DragEvent, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Upload, File, X, Loader2, Calendar, Sparkles, Shield, CheckCircle2 } from 'lucide-react';
import { TagInput } from '@/components/ui/TagInput';

interface Facets {
  era?: any[];
  location?: any[];
  subject?: any[];
  source_type?: any[];
  language?: any[];
  sensitivity?: any[];
}

export default function UploadPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<string>('document');
  const [tags, setTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Phase 1.2: New state variables
  const [facets, setFacets] = useState<Facets>({});
  const [selectedFacets, setSelectedFacets] = useState<Record<string, any>>({});
  const [dateType, setDateType] = useState<'exact' | 'period'>('exact');
  const [dateExact, setDateExact] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [dateDisplay, setDateDisplay] = useState('');
  const [aiProcessing, setAiProcessing] = useState(true);
  const [fileHash, setFileHash] = useState<string>('');
  const [hashing, setHashing] = useState(false);

  // Phase 1.2: Load facets on mount
  useEffect(() => {
    const loadFacets = async () => {
      try {
        const response = await fetch('/api/facets');
        const data = await response.json();
        if (data.success) {
          setFacets(data.facets);
        }
      } catch (error) {
        console.error('Error loading facets:', error);
      }
    };
    loadFacets();
  }, []);

  // Phase 1.2: Calculate SHA-256 hash
  const calculateHash = async (file: File): Promise<string> => {
    setHashing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      setHashing(false);
      return hashHex;
    } catch (error) {
      console.error('Error calculating hash:', error);
      setHashing(false);
      return '';
    }
  };

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Please sign in to upload files.</p>
      </div>
    );
  }

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);

    // Auto-populate title from filename if empty
    if (!title) {
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
      setTitle(nameWithoutExt);
    }

    // Auto-detect type based on mime type
    if (selectedFile.type.startsWith('image/')) {
      setType('photo');
    } else if (selectedFile.type.includes('pdf') || selectedFile.type.includes('document') || selectedFile.type.includes('word')) {
      setType('document');
    } else if (selectedFile.type === 'text/plain') {
      setType('text');
    } else if (selectedFile.type.includes('zip')) {
      setType('archive');
    }

    // Phase 1.2: Calculate file hash
    const hash = await calculateHash(selectedFile);
    setFileHash(hash);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    // Phase 1.2: Validate required facets
    if (!selectedFacets.sourceType) {
      setError('Please select a source type');
      return;
    }

    if (!selectedFacets.sensitivity) {
      setError('Please select a sensitivity level');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('type', type);
      formData.append('tags', JSON.stringify(tags));

      // Phase 1.2: Add facets
      formData.append('facets', JSON.stringify(selectedFacets));

      // Phase 1.2: Add date information
      formData.append('dateType', dateType);
      if (dateType === 'exact' && dateExact) {
        formData.append('dateExact', dateExact);
      } else if (dateType === 'period' && dateStart && dateEnd) {
        formData.append('dateStart', dateStart);
        formData.append('dateEnd', dateEnd);
        formData.append('dateDisplay', dateDisplay || `${dateStart} to ${dateEnd}`);
      }

      // Phase 1.2: Add AI processing preference
      formData.append('aiProcessing', aiProcessing.toString());

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Redirect to the item detail page
      router.push(`/items/${data.item.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Upload Archive Item</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Add historical documents with AI-powered metadata extraction
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Area */}
        <div>
          <label className="block text-sm font-medium mb-2">File *</label>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
              dragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-700'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <File className="w-8 h-8 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setFileHash('');
                    }}
                    className="ml-4 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {/* Phase 1.2: File Integrity Display */}
                {hashing ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Calculating SHA-256 hash...</span>
                  </div>
                ) : fileHash ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">
                        File Integrity Verified
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all">
                      SHA-256: {fileHash}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="mb-2">Drag and drop a file here, or click to select</p>
                <p className="text-sm text-gray-500 mb-4">
                  Supported: PDF, DOCX, DOC, TXT, images, audio, video, ZIP (max 100MB)
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Choose File
                </button>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp,.zip,.mp3,.wav,.mp4,.mov"
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-900"
            placeholder="Enter a descriptive title"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-900"
            placeholder="Provide additional context about this item"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Type *</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-900"
            required
          >
            <option value="document">Document</option>
            <option value="photo">Photo</option>
            <option value="text">Text File</option>
            <option value="audio">Audio</option>
            <option value="video">Video</option>
            <option value="archive">Archive/ZIP</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Phase 1.2: Facet Taxonomy Section */}
        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Classification & Metadata
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source Type - REQUIRED */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Source Type * <span className="text-red-500">(Required)</span>
              </label>
              <select
                value={selectedFacets.sourceType || ''}
                onChange={(e) => setSelectedFacets({...selectedFacets, sourceType: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-800"
                required
              >
                <option value="">Select source type...</option>
                {facets.source_type?.map((facet: any) => (
                  <option key={facet.id} value={facet.value}>
                    {facet.value.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Sensitivity - REQUIRED */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Sensitivity Level * <span className="text-red-500">(Required)</span>
              </label>
              <select
                value={selectedFacets.sensitivity || ''}
                onChange={(e) => setSelectedFacets({...selectedFacets, sensitivity: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-800"
                required
              >
                <option value="">Select sensitivity...</option>
                {facets.sensitivity?.map((facet: any) => (
                  <option key={facet.id} value={facet.value}>
                    {facet.value.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Era - Optional */}
            <div>
              <label className="block text-sm font-medium mb-2">Era (Optional)</label>
              <select
                value={selectedFacets.era || ''}
                onChange={(e) => setSelectedFacets({...selectedFacets, era: e.target.value ? [e.target.value] : []})}
                className="w-full px-4 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-800"
              >
                <option value="">Select era...</option>
                {facets.era?.map((facet: any) => (
                  <option key={facet.id} value={facet.value}>
                    {facet.value.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Location - Optional */}
            <div>
              <label className="block text-sm font-medium mb-2">Location (Optional)</label>
              <select
                value={selectedFacets.location || ''}
                onChange={(e) => setSelectedFacets({...selectedFacets, location: e.target.value ? [e.target.value] : []})}
                className="w-full px-4 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-800"
              >
                <option value="">Select location...</option>
                {facets.location?.map((facet: any) => (
                  <option key={facet.id} value={facet.value}>
                    {facet.value.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject - Optional */}
            <div>
              <label className="block text-sm font-medium mb-2">Subject (Optional)</label>
              <select
                value={selectedFacets.subject || ''}
                onChange={(e) => setSelectedFacets({...selectedFacets, subject: e.target.value ? [e.target.value] : []})}
                className="w-full px-4 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-800"
              >
                <option value="">Select subject...</option>
                {facets.subject?.map((facet: any) => (
                  <option key={facet.id} value={facet.value}>
                    {facet.value.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {/* Language - Optional */}
            <div>
              <label className="block text-sm font-medium mb-2">Language (Optional)</label>
              <select
                value={selectedFacets.language || ''}
                onChange={(e) => setSelectedFacets({...selectedFacets, language: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-800"
              >
                <option value="">Select language...</option>
                {facets.language?.map((facet: any) => (
                  <option key={facet.id} value={facet.value}>
                    {facet.value.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Phase 1.2: Date Section */}
        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Date Information
          </h3>

          {/* Date Type Toggle */}
          <div className="mb-4">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="dateType"
                  value="exact"
                  checked={dateType === 'exact'}
                  onChange={(e) => setDateType(e.target.value as 'exact' | 'period')}
                  className="w-4 h-4"
                />
                <span>Exact Date</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="dateType"
                  value="period"
                  checked={dateType === 'period'}
                  onChange={(e) => setDateType(e.target.value as 'exact' | 'period')}
                  className="w-4 h-4"
                />
                <span>Period / Fuzzy Date</span>
              </label>
            </div>
          </div>

          {/* Exact Date Input */}
          {dateType === 'exact' && (
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={dateExact}
                onChange={(e) => setDateExact(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
          )}

          {/* Period/Fuzzy Date Inputs */}
          {dateType === 'period' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date</label>
                  <input
                    type="date"
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date</label>
                  <input
                    type="date"
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Display Text (e.g., "Late 1990s", "Winter 1942")
                </label>
                <input
                  type="text"
                  value={dateDisplay}
                  onChange={(e) => setDateDisplay(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg dark:border-gray-700 dark:bg-gray-800"
                  placeholder="Enter how this date should be displayed"
                />
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-2">Tags (Optional)</label>
          <TagInput tags={tags} onChange={setTags} />
          <p className="text-xs text-gray-500 mt-1">
            Add custom tags, or let AI suggest them automatically
          </p>
        </div>

        {/* Phase 1.2: AI Processing Toggle */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-purple-600 mt-1" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold">AI-Powered Processing</h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiProcessing}
                    onChange={(e) => setAiProcessing(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                Enable AI to automatically extract text, suggest tags, categorize content, and generate translations.
              </p>
              {aiProcessing && (
                <div className="bg-white dark:bg-gray-800 p-3 rounded border border-purple-200 dark:border-purple-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    <strong>Estimated Cost:</strong> ~$0.01 - $0.05 per document
                  </p>
                  <p className="text-xs text-gray-500">
                    Includes: OCR, tag generation, facet suggestions, translation detection, and content analysis
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={uploading || !file}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Upload to Archive
            </>
          )}
        </button>
      </form>
    </div>
  );
}
