import sharp from 'sharp';
import { uploadFile } from '@/lib/storage';

/**
 * PHASE 1.3: Media Processing Utilities
 *
 * Handles thumbnail generation, preview creation, and format conversion
 * for images, videos, and audio files.
 */

export interface MediaProcessingResult {
  thumbnailUrl?: string;
  previewUrl?: string;
  waveformUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Process image: Generate thumbnail and web-optimized version
 */
export async function processImage(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<MediaProcessingResult> {
  try {
    const result: MediaProcessingResult = {};

    // Get image metadata
    const metadata = await sharp(fileBuffer).metadata();
    result.metadata = {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
    };

    // Generate thumbnail (300x300, maintaining aspect ratio)
    const thumbnailBuffer = await sharp(fileBuffer)
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();

    const thumbnailFileName = `thumbnails/${fileName.replace(/\.[^/.]+$/, '')}-thumb.webp`;
    result.thumbnailUrl = await uploadFile(thumbnailBuffer, thumbnailFileName, 'image/webp');

    // Generate web-optimized preview (1200px max width)
    if (metadata.width && metadata.width > 1200) {
      const previewBuffer = await sharp(fileBuffer)
        .resize(1200, null, {
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();

      const previewFileName = `previews/${fileName.replace(/\.[^/.]+$/, '')}-preview.webp`;
      result.previewUrl = await uploadFile(previewBuffer, previewFileName, 'image/webp');
    } else {
      // For smaller images, use original as preview
      const previewBuffer = await sharp(fileBuffer)
        .webp({ quality: 85 })
        .toBuffer();

      const previewFileName = `previews/${fileName.replace(/\.[^/.]+$/, '')}-preview.webp`;
      result.previewUrl = await uploadFile(previewBuffer, previewFileName, 'image/webp');
    }

    return result;
  } catch (error) {
    console.error('Error processing image:', error);
    return {};
  }
}

/**
 * Process video: Extract thumbnail from first frame
 *
 * NOTE: This is a placeholder. Full implementation requires ffmpeg.
 * For production, you'll need to:
 * 1. Install fluent-ffmpeg: npm install fluent-ffmpeg @types/fluent-ffmpeg
 * 2. Ensure ffmpeg is installed in Docker container
 * 3. Update Dockerfile to include ffmpeg binary
 */
export async function processVideo(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<MediaProcessingResult> {
  try {
    console.log('Video processing requested for:', fileName);

    // TODO: Implement with ffmpeg
    // const ffmpeg = require('fluent-ffmpeg');
    //
    // Extract thumbnail at 1 second:
    // ffmpeg(inputPath)
    //   .screenshots({
    //     timestamps: ['1'],
    //     filename: 'thumbnail.jpg',
    //     size: '300x300'
    //   });
    //
    // Extract metadata:
    // ffmpeg.ffprobe(inputPath, (err, metadata) => { ... });

    // Placeholder: Return empty result until ffmpeg is integrated
    return {
      metadata: {
        type: 'video',
        mimeType,
        note: 'Video processing requires ffmpeg installation',
      },
    };
  } catch (error) {
    console.error('Error processing video:', error);
    return {};
  }
}

/**
 * Process audio: Generate waveform visualization
 *
 * NOTE: This is a placeholder. Full implementation requires ffmpeg or audiowaveform.
 * For production, you'll need to:
 * 1. Install audiowaveform or use ffmpeg
 * 2. Generate waveform data as JSON or PNG
 * 3. Upload to storage
 */
export async function processAudio(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<MediaProcessingResult> {
  try {
    console.log('Audio processing requested for:', fileName);

    // TODO: Implement with audiowaveform or ffmpeg
    // const { exec } = require('child_process');
    //
    // Generate waveform data:
    // audiowaveform -i input.mp3 -o waveform.json --pixels-per-second 20
    //
    // Or use ffmpeg to extract audio metadata:
    // ffmpeg.ffprobe(inputPath, (err, metadata) => { ... });

    // Placeholder: Return empty result until audio processing is integrated
    return {
      metadata: {
        type: 'audio',
        mimeType,
        note: 'Audio processing requires audiowaveform or ffmpeg installation',
      },
    };
  } catch (error) {
    console.error('Error processing audio:', error);
    return {};
  }
}

/**
 * Main media processor: Routes to appropriate handler based on file type
 */
export async function processMedia(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<MediaProcessingResult> {
  // Images: Full support with sharp
  if (mimeType.startsWith('image/')) {
    return await processImage(fileBuffer, fileName, mimeType);
  }

  // Videos: Placeholder (requires ffmpeg)
  if (mimeType.startsWith('video/')) {
    return await processVideo(fileBuffer, fileName, mimeType);
  }

  // Audio: Placeholder (requires ffmpeg/audiowaveform)
  if (mimeType.startsWith('audio/')) {
    return await processAudio(fileBuffer, fileName, mimeType);
  }

  // Unsupported type
  return {};
}

/**
 * Generate placeholder thumbnail for unsupported media types
 */
export async function generatePlaceholderThumbnail(
  type: 'video' | 'audio' | 'document' | 'archive'
): Promise<Buffer> {
  // Create a simple colored square with text using sharp
  const colors = {
    video: '#ef4444', // red
    audio: '#3b82f6', // blue
    document: '#10b981', // green
    archive: '#f59e0b', // amber
  };

  const color = colors[type];

  const svg = `
    <svg width="300" height="300">
      <rect width="300" height="300" fill="${color}"/>
      <text
        x="50%"
        y="50%"
        font-family="Arial"
        font-size="24"
        fill="white"
        text-anchor="middle"
        dominant-baseline="middle"
      >
        ${type.toUpperCase()}
      </text>
    </svg>
  `;

  return await sharp(Buffer.from(svg))
    .png()
    .toBuffer();
}
