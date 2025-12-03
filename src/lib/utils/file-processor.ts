import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import crypto from 'crypto';
import { extractTextFromImage } from '@/lib/ai/gemini';

/**
 * PHASE 1.1: Calculate SHA-256 hash of file for data integrity
 */
export function calculateFileHash(fileBuffer: Buffer): string {
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

/**
 * Extract text content from various file types
 * PHASE 1.1: Enhanced with OCR for images
 */
export async function extractTextFromFile(
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> {
  try {
    switch (mimeType) {
      case 'application/pdf':
        return await extractTextFromPDF(fileBuffer);

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        return await extractTextFromWord(fileBuffer);

      case 'text/plain':
        return fileBuffer.toString('utf-8');

      // PHASE 1.1: Image OCR using Gemini Vision
      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
      case 'image/webp':
        return await extractTextFromImage(fileBuffer, mimeType);

      // Audio/Video: No text extraction (handled separately in Phase 1.3)
      case 'audio/mpeg':
      case 'audio/wav':
      case 'audio/ogg':
      case 'video/mp4':
      case 'video/mpeg':
      case 'video/quicktime':
      case 'video/webm':
        return '';

      default:
        console.warn(`Unsupported file type for text extraction: ${mimeType}`);
        return '';
    }
  } catch (error) {
    console.error('Error extracting text from file:', error);
    return '';
  }
}

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text;
}

async function extractTextFromWord(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/**
 * Validate file type and size
 * PHASE 1.1: Added audio/video support
 */
export function validateFile(file: File, maxSizeMB: number = 100): { valid: boolean; error?: string } {
  const allowedTypes = [
    // Documents
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Audio (Phase 1.1)
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    'audio/m4a',
    // Video (Phase 1.1)
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/webm',
    'video/x-msvideo',
    // Archives
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
  ];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not supported' };
  }

  const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
