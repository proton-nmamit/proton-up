import sharp from 'sharp';

// Server-only runtime security assertion
if (typeof window !== 'undefined') {
  throw new Error('[Security Exception] Image processing module must only be used on the server.');
}

export type SupportedFormat = 'jpeg' | 'png' | 'webp';

export interface ImageProcessingOptions {
  maxSizeBytes?: number;
  maxWidth?: number;
  maxHeight?: number;
  maxPixels?: number;
  quality?: number;
  allowedFormats?: SupportedFormat[];
}

export interface ProcessedImageResult {
  success: boolean;
  buffer?: Buffer;
  format?: 'webp';
  width?: number;
  height?: number;
  originalFormat?: SupportedFormat;
  originalSizeBytes?: number;
  processedSizeBytes?: number;
  error?: string;
}

/**
 * Validates binary file signatures (magic bytes) to guarantee authenticity.
 * Prevents forged MIME types, polyglot files, SVG injections, and disguised executables.
 */
export function validateMagicBytes(buffer: Buffer): { valid: boolean; format?: SupportedFormat; error?: string } {
  if (!buffer || buffer.length < 12) {
    return { valid: false, error: 'File is empty or too small to be a valid image.' };
  }

  // 1. JPEG signature: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, format: 'jpeg' };
  }

  // 2. PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, format: 'png' };
  }

  // 3. WebP signature: "RIFF" .... "WEBP"
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 && // "RIFF"
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50 // "WEBP"
  ) {
    return { valid: true, format: 'webp' };
  }

  return {
    valid: false,
    error: 'Invalid file signature. Only genuine JPEG, PNG, and WebP images are permitted.',
  };
}

/**
 * Decodes, validates dimensions, sanitizes metadata, and converts input image to clean WebP.
 * Never allows raw uploaded bytes to reach storage directly.
 */
export async function sanitizeAndConvertToWebP(
  inputBuffer: Buffer,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImageResult> {
  const {
    maxSizeBytes,
    maxWidth = 4096,
    maxHeight = 4096,
    maxPixels = 20_000_000,
    quality = 82,
    allowedFormats = ['jpeg', 'png', 'webp'],
  } = options;

  try {
    // 1. Size pre-validation
    if (!inputBuffer || inputBuffer.length === 0) {
      return { success: false, error: 'No image data provided.' };
    }

    if (maxSizeBytes && inputBuffer.length > maxSizeBytes) {
      const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(1);
      return { success: false, error: `Image size exceeds the maximum limit of ${maxMb} MB.` };
    }

    // 2. Binary magic byte inspection
    const magicCheck = validateMagicBytes(inputBuffer);
    if (!magicCheck.valid || !magicCheck.format) {
      return { success: false, error: magicCheck.error || 'Unsupported or corrupted image file format.' };
    }

    if (!allowedFormats.includes(magicCheck.format)) {
      return {
        success: false,
        error: `Format '${magicCheck.format}' is not accepted. Allowed formats: ${allowedFormats.join(', ')}.`,
      };
    }

    // 3. Sharp image instantiation & decompression bomb check
    const pipeline = sharp(inputBuffer, {
      failOnError: true,
      animated: false,
      limitInputPixels: maxPixels,
    });

    const metadata = await pipeline.metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (!width || !height || width <= 0 || height <= 0) {
      return { success: false, error: 'Could not decode image dimensions.' };
    }

    if (width * height > maxPixels) {
      return {
        success: false,
        error: `Image dimensions (${width}x${height}) exceed the maximum allowable pixel limit.`,
      };
    }

    // 4. Transform pipeline:
    // - Auto-rotate based on EXIF orientation
    // - Downscale if larger than maximum allowable bounds (without enlarging small images)
    // - Strip all EXIF, GPS, camera metadata and comments
    // - Encode to pure, fresh WebP
    let transform = pipeline.rotate();

    if (width > maxWidth || height > maxHeight) {
      transform = transform.resize({
        width: maxWidth,
        height: maxHeight,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    const webpBuffer = await transform
      .webp({
        quality,
        effort: 4,
        force: true,
      })
      .toBuffer();

    const outputMetadata = await sharp(webpBuffer).metadata();

    return {
      success: true,
      buffer: webpBuffer,
      format: 'webp',
      width: outputMetadata.width || width,
      height: outputMetadata.height || height,
      originalFormat: magicCheck.format,
      originalSizeBytes: inputBuffer.length,
      processedSizeBytes: webpBuffer.length,
    };
  } catch (err: any) {
    console.error('[Image Sanitization Error]:', err.message || err);
    return {
      success: false,
      error: 'Failed to process or decode image. The file may be damaged or corrupted.',
    };
  }
}
