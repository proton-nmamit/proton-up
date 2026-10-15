import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import crypto from 'crypto';
import {
  sanitizeAndConvertToWebP,
  SupportedFormat,
  ImageProcessingOptions,
} from './image-processor';

// Ensure this module is never executed on the client
if (typeof window !== 'undefined') {
  throw new Error('[Security Exception] Cloudinary storage module must only be used on the server.');
}

/**
 * Validates whether all required server-side Cloudinary environment variables are present.
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Initializes and returns the configured Cloudinary v2 SDK instance.
 */
function getCloudinaryClient() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      '[Cloudinary Config Error] Missing required Cloudinary credentials: ' +
      'Ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set in environment variables.'
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return cloudinary;
}

export const STORAGE_PRESETS = {
  MEMBER_AVATARS: {
    folder: 'proton/members/avatars',
    maxSizeBytes: 3 * 1024 * 1024, // 3 MB
    maxWidth: 2048,
    maxHeight: 2048,
    maxPixels: 6_000_000,
    quality: 82,
    allowedFormats: ['jpeg', 'png', 'webp'] as SupportedFormat[],
  },
  EVENT_POSTERS: {
    folder: 'proton/events/posters',
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
    maxWidth: 3840,
    maxHeight: 3840,
    maxPixels: 16_000_000,
    quality: 84,
    allowedFormats: ['jpeg', 'png', 'webp'] as SupportedFormat[],
  },
  GALLERY_IMAGES: {
    folder: 'proton/gallery',
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    maxWidth: 4096,
    maxHeight: 4096,
    maxPixels: 20_000_000,
    quality: 85,
    allowedFormats: ['jpeg', 'png', 'webp'] as SupportedFormat[],
  },
} as const;

export interface UploadOptions {
  buffer: Buffer;
  folder: string;
  filename?: string;
  publicId?: string;
  tags?: string[];
  maxSizeBytes?: number;
  maxWidth?: number;
  maxHeight?: number;
  maxPixels?: number;
  quality?: number;
  allowedFormats?: SupportedFormat[];
  skipProcessing?: boolean; // Used ONLY for already processed buffers
}

export interface UploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  bytes?: number;
  format?: string;
  width?: number;
  height?: number;
  originalSizeBytes?: number;
  error?: string;
}

/**
 * Sanitizes a path segment or filename to prevent directory traversal or control char injection.
 */
export function sanitizePathSegment(segment: string): string {
  if (!segment) return '';
  return segment
    .replace(/\0/g, '') // Null bytes
    .replace(/[\x00-\x1f\x7f]/g, '') // Control characters
    .replace(/\\/g, '/') // Normalize backslashes
    .replace(/\.\./g, '') // Path traversal prevention
    .replace(/[^a-zA-Z0-9_\-\/]/g, '_') // Whitelist safe alphanumeric characters and hyphens/underscores/slashes
    .replace(/^\/+|\/+$/g, ''); // Trim leading/trailing slashes
}

/**
 * Securely uploads an image to Cloudinary.
 * Always executes full server-side magic byte inspection, Sharp decoding,
 * dimension verification, metadata sanitization, and WebP re-encoding.
 */
export async function uploadToCloudinary(options: UploadOptions): Promise<UploadResult> {
  const {
    buffer,
    folder,
    filename,
    publicId,
    tags,
    maxSizeBytes,
    maxWidth,
    maxHeight,
    maxPixels,
    quality,
    allowedFormats,
    skipProcessing = false,
  } = options;

  if (!buffer || buffer.length === 0) {
    return { success: false, error: 'Empty or invalid file buffer provided.' };
  }

  if (!isCloudinaryConfigured()) {
    return {
      success: false,
      error: 'Cloudinary storage service is not configured on the server.',
    };
  }

  // 1. Mandatory server-side Image Sanitization & WebP Conversion
  let webpBuffer = buffer;
  let imgWidth: number | undefined;
  let imgHeight: number | undefined;
  let originalSize = buffer.length;

  if (!skipProcessing) {
    const processResult = await sanitizeAndConvertToWebP(buffer, {
      maxSizeBytes,
      maxWidth,
      maxHeight,
      maxPixels,
      quality,
      allowedFormats,
    });

    if (!processResult.success || !processResult.buffer) {
      return {
        success: false,
        error: processResult.error || 'Image validation and sanitization failed.',
      };
    }

    webpBuffer = processResult.buffer;
    imgWidth = processResult.width;
    imgHeight = processResult.height;
    originalSize = processResult.originalSizeBytes || buffer.length;
  }

  const client = getCloudinaryClient();

  // 2. Strict folder namespace sanitization
  const safeFolder = sanitizePathSegment(folder) || 'proton';
  if (!safeFolder.startsWith('proton')) {
    return {
      success: false,
      error: 'Security constraint violation: Upload folder must reside within the proton namespace.',
    };
  }

  // 3. Construct safe, unguessable public_id
  let safePublicId: string;
  const entropy = crypto.randomBytes(4).toString('hex');

  if (publicId) {
    const cleanId = sanitizePathSegment(publicId).replace(/\.webp$/i, '');
    safePublicId = `${cleanId}_${entropy}`;
  } else if (filename) {
    const baseName = sanitizePathSegment(filename.replace(/\.[^/.]+$/, ''));
    safePublicId = `${baseName}_${Date.now()}_${entropy}`;
  } else {
    safePublicId = `asset_${Date.now()}_${entropy}`;
  }

  return new Promise<UploadResult>((resolve) => {
    const uploadOptions: Record<string, any> = {
      folder: safeFolder,
      public_id: safePublicId,
      format: 'webp',
      resource_type: 'image',
      overwrite: true,
      tags: tags ? tags.map(sanitizePathSegment).filter(Boolean) : ['proton-cms'],
    };

    const uploadStream = client.uploader.upload_stream(
      uploadOptions,
      (error?: any, result?: UploadApiResponse) => {
        if (error || !result) {
          console.error('[Cloudinary Upload Error]:', error?.message || error);
          resolve({
            success: false,
            error: error?.message || 'Failed to upload asset to Cloudinary.',
          });
        } else {
          resolve({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            bytes: result.bytes,
            format: result.format || 'webp',
            width: result.width || imgWidth,
            height: result.height || imgHeight,
            originalSizeBytes: originalSize,
          });
        }
      }
    );

    uploadStream.end(webpBuffer);
  });
}

/**
 * Safely extracts the Cloudinary public_id from a full Cloudinary URL.
 * Strictly verifies namespace boundaries and rejects path traversal.
 */
export function extractCloudinaryPublicId(urlOrPublicId: string): string | null {
  if (!urlOrPublicId) return null;
  const trimmed = urlOrPublicId.trim();

  // If it's already a public_id (no http/https)
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    const sanitized = sanitizePathSegment(trimmed);
    return sanitized.startsWith('proton/') ? sanitized : null;
  }

  try {
    const urlObj = new URL(trimmed);
    if (!urlObj.hostname.includes('cloudinary.com')) {
      return null;
    }

    const pathname = urlObj.pathname;
    const uploadIndex = pathname.indexOf('/upload/');
    if (uploadIndex === -1) return null;

    let subPath = pathname.substring(uploadIndex + 8); // remove '/upload/'

    // Remove transformation parameters if present (e.g. f_auto,q_auto/)
    subPath = subPath.replace(/^([a-z]_[a-zA-Z0-9_\-]+,?)+\//, '');

    // Remove version prefix if present (e.g., v1790585624/)
    subPath = subPath.replace(/^v\d+\//, '');

    // Remove file extension
    const lastDotIndex = subPath.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      subPath = subPath.substring(0, lastDotIndex);
    }

    const sanitized = sanitizePathSegment(subPath);
    // Strict namespace guard: ensure public ID belongs to 'proton/'
    if (!sanitized.startsWith('proton/')) {
      return null;
    }

    return sanitized;
  } catch {
    return null;
  }
}

/**
 * Deletes an asset from Cloudinary given its public_id or full Cloudinary URL.
 * Enforces namespace isolation to prevent arbitrary or out-of-scope asset deletion.
 */
export async function deleteFromCloudinary(urlOrPublicId: string): Promise<{ success: boolean; error?: string }> {
  if (!urlOrPublicId) {
    return { success: false, error: 'No URL or public ID provided for deletion.' };
  }

  const publicId = extractCloudinaryPublicId(urlOrPublicId);
  if (!publicId) {
    // If not a valid Cloudinary PROTON URL (e.g. Supabase, local dev, or external), ignore safely
    return { success: true };
  }

  // Security guard: Only assets within 'proton/' namespace can be deleted
  if (!publicId.startsWith('proton/')) {
    console.warn(`[Cloudinary Security Warning] Blocked attempt to delete asset outside proton namespace: "${publicId}"`);
    return { success: false, error: 'Cannot delete assets outside the PROTON namespace.' };
  }

  if (!isCloudinaryConfigured()) {
    console.warn('[Cloudinary Storage Warning] Cannot delete asset: Cloudinary is not configured.');
    return { success: false, error: 'Cloudinary storage service is not configured.' };
  }

  try {
    const client = getCloudinaryClient();
    const result = await client.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });

    if (result.result === 'ok' || result.result === 'not found') {
      return { success: true };
    }

    return { success: false, error: `Cloudinary delete response: ${result.result}` };
  } catch (err: any) {
    console.error('[Cloudinary Deletion Error]:', err.message || err);
    return { success: false, error: err.message || 'Failed to delete asset from Cloudinary.' };
  }
}

/**
 * Injects automatic format and quality optimization (f_auto, q_auto) into Cloudinary delivery URLs.
 * If the URL is not a Cloudinary URL, it is returned unmodified.
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  options?: { width?: number; height?: number; crop?: string; quality?: string }
): string {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }

  const transforms: string[] = ['f_auto', 'q_auto'];

  if (options?.width) transforms.push(`w_${options.width}`);
  if (options?.height) transforms.push(`h_${options.height}`);
  if (options?.crop) transforms.push(`c_${options.crop}`);
  if (options?.quality) transforms.push(`q_${options.quality}`);

  const transformString = transforms.join(',');
  return url.replace('/upload/', `/upload/${transformString}/`);
}
