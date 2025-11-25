import fs from 'fs/promises';
import path from 'path';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

// Storage directory - can be overridden by environment variable
const STORAGE_DIR = process.env.STORAGE_PATH || '/app/data/uploads';
const PUBLIC_URL_BASE = process.env.PUBLIC_URL || 'http://localhost:3000';

/**
 * Initialize storage directory
 */
async function ensureStorageDir() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating storage directory:', error);
  }
}

/**
 * Upload a file to local filesystem and return the public URL
 */
export async function uploadFile(
  file: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  await ensureStorageDir();

  // Create unique filename with timestamp
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueFileName = `${timestamp}-${sanitizedFileName}`;

  // Create subdirectories by date for better organization
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const subDir = path.join(STORAGE_DIR, year.toString(), month);

  await fs.mkdir(subDir, { recursive: true });

  const filePath = path.join(subDir, uniqueFileName);

  // Write file to disk
  await fs.writeFile(filePath, file);

  // Return URL path relative to storage dir
  const relativePath = path.relative(STORAGE_DIR, filePath);
  return `/api/files/${relativePath.replace(/\\/g, '/')}`;
}

/**
 * Delete a file from local filesystem
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    // Extract path from URL (remove /api/files/ prefix)
    const relativePath = fileUrl.replace('/api/files/', '');
    const filePath = path.join(STORAGE_DIR, relativePath);

    // Check if file exists before deleting
    await fs.access(filePath);
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

/**
 * Get file from local filesystem as buffer
 */
export async function getFile(fileUrl: string): Promise<Buffer> {
  try {
    // Extract path from URL
    const relativePath = fileUrl.replace('/api/files/', '');
    const filePath = path.join(STORAGE_DIR, relativePath);

    return await fs.readFile(filePath);
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
}

/**
 * Get file path from URL (for serving files)
 */
export function getFilePath(fileUrl: string): string {
  const relativePath = fileUrl.replace('/api/files/', '');
  return path.join(STORAGE_DIR, relativePath);
}

/**
 * Stream file from local filesystem
 */
export async function streamFile(fileUrl: string): Promise<ReadableStream> {
  const filePath = getFilePath(fileUrl);
  const fileHandle = await fs.open(filePath, 'r');
  const stream = fileHandle.createReadStream();

  return Readable.toWeb(stream) as ReadableStream;
}

/**
 * Check if file exists
 */
export async function fileExists(fileUrl: string): Promise<boolean> {
  try {
    const filePath = getFilePath(fileUrl);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file stats (size, modified date, etc.)
 */
export async function getFileStats(fileUrl: string) {
  const filePath = getFilePath(fileUrl);
  return await fs.stat(filePath);
}

// For compatibility with S3 version, we don't need presigned URLs for local storage
export async function getPresignedUploadUrl(
  fileName: string,
  mimeType: string
): Promise<{ url: string; key: string }> {
  // For local storage, we'll use direct upload endpoint
  // This is just for API compatibility
  const key = `${Date.now()}-${fileName}`;
  return {
    url: '/api/upload',
    key,
  };
}
