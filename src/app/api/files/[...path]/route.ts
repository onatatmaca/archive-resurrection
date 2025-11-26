import { NextRequest, NextResponse } from 'next/server';
import { getFile, getFilePath } from '@/lib/storage';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';

/**
 * Serve uploaded files from local storage
 * Route: /api/files/[...path]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Reconstruct the file path from params
    const filePath = params.path.join('/');
    const fileUrl = `/api/files/${filePath}`;

    // Get the actual file path on disk
    const diskPath = getFilePath(fileUrl);

    // Check if file exists and get stats
    const fileStats = await stat(diskPath);

    if (!fileStats.isFile()) {
      return NextResponse.json(
        { error: 'Not a file' },
        { status: 400 }
      );
    }

    // Read file as buffer
    const fileBuffer = await getFile(fileUrl);

    // Determine MIME type from extension
    const ext = filePath.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
      zip: 'application/zip',
    };

    const mimeType = mimeTypes[ext || ''] || 'application/octet-stream';

    // Convert Buffer to Uint8Array for NextResponse
    const uint8Array = new Uint8Array(fileBuffer);

    // Return file with appropriate headers
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileStats.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404 }
    );
  }
}
