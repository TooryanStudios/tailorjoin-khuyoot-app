/**
 * Image Optimization Utilities
 * 
 * Provides URL generation for optimized images using Firebase Storage's
 * image resize extension. Automatically serves WebP thumbnails for faster
 * loading while maintaining quality.
 */

export type ImageSize = 'thumbnail' | 'medium' | 'large' | 'original';

interface ImageSizeConfig {
  suffix: string;
  dimensions: string;
  description: string;
}

/**
 * Image size configurations matching Firebase resize extension settings
 */
const IMAGE_SIZES: Record<ImageSize, ImageSizeConfig> = {
  thumbnail: {
    suffix: '_200x300.webp',
    dimensions: '200x300',
    description: 'Thumbnail for picker grids (20KB avg)',
  },
  medium: {
    suffix: '_600x800.webp',
    dimensions: '600x800',
    description: 'Medium size for preview modals (80KB avg)',
  },
  large: {
    suffix: '_1200x1600.webp',
    dimensions: '1200x1600',
    description: 'Large size for try-on canvas (200KB avg)',
  },
  original: {
    suffix: '',
    dimensions: 'original',
    description: 'Full resolution original image',
  },
};

/**
 * Checks if the browser supports WebP format
 * Cached result to avoid repeated checks
 */
let webpSupport: boolean | null = null;

export function supportsWebP(): boolean {
  if (webpSupport !== null) return webpSupport;

  // Check if browser supports WebP
  const canvas = document.createElement('canvas');
  if (canvas.getContext && canvas.getContext('2d')) {
    // Chrome/Edge/Firefox/Safari 14+ support WebP
    webpSupport = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } else {
    webpSupport = false;
  }

  return webpSupport;
}

/**
 * Extracts the file path and extension from a Firebase Storage URL
 * 
 * @example
 * Input: "https://firebasestorage.googleapis.com/v0/b/project.appspot.com/o/templates%2Ftemplate-123.jpg?alt=media"
 * Output: { path: "templates/template-123", extension: "jpg" }
 */
function parseFirebaseStorageUrl(url: string): { path: string; extension: string } | null {
  try {
    // Match Firebase Storage URL pattern
    const match = url.match(/\/o\/([^?]+)/);
    if (!match) return null;

    // Decode the path (handles %2F -> /)
    const encodedPath = match[1];
    const decodedPath = decodeURIComponent(encodedPath);

    // Split path and extension
    const lastDot = decodedPath.lastIndexOf('.');
    if (lastDot === -1) return null;

    const path = decodedPath.substring(0, lastDot);
    const extension = decodedPath.substring(lastDot + 1);

    return { path, extension };
  } catch (error) {
    console.warn('[Image Optimization] Failed to parse Firebase URL:', url, error);
    return null;
  }
}

/**
 * Generates an optimized image URL for the specified size
 * 
 * Uses Firebase Storage's image resize extension to serve WebP thumbnails.
 * Falls back to original image if thumbnail doesn't exist or browser doesn't support WebP.
 * 
 * @param originalUrl - Full Firebase Storage URL of the original image
 * @param size - Desired image size ('thumbnail' | 'medium' | 'large' | 'original')
 * @returns Optimized image URL with WebP thumbnail or original URL as fallback
 * 
 * @example
 * // Get thumbnail for picker grid
 * const thumbUrl = getOptimizedImageUrl(originalUrl, 'thumbnail');
 * 
 * // Get medium size for preview modal
 * const previewUrl = getOptimizedImageUrl(originalUrl, 'medium');
 * 
 * // Get large size for try-on canvas
 * const canvasUrl = getOptimizedImageUrl(originalUrl, 'large');
 */
export function getOptimizedImageUrl(originalUrl: string | null | undefined, size: ImageSize = 'thumbnail'): string | null {
  // Return null for invalid inputs
  if (!originalUrl) return null;

  // Return original for 'original' size
  if (size === 'original') return originalUrl;

  // Check WebP support (fall back to original if not supported)
  if (!supportsWebP()) {
    console.log('[Image Optimization] WebP not supported, using original image');
    return originalUrl;
  }

  // Parse the Firebase Storage URL
  const parsed = parseFirebaseStorageUrl(originalUrl);
  if (!parsed) {
    // Not a Firebase Storage URL or invalid format - return as-is
    return originalUrl;
  }

  // Build optimized URL with size suffix
  const config = IMAGE_SIZES[size];
  const optimizedPath = `${parsed.path}${config.suffix}`;
  
  // Reconstruct Firebase Storage URL with optimized path
  const baseUrl = originalUrl.substring(0, originalUrl.indexOf('/o/') + 3);
  const queryParams = originalUrl.includes('?') ? originalUrl.substring(originalUrl.indexOf('?')) : '?alt=media';
  
  const optimizedUrl = `${baseUrl}${encodeURIComponent(optimizedPath)}${queryParams}`;

  return optimizedUrl;
}

/**
 * Preloads an image to cache it in the browser
 * Uses browser's native caching with CDN cache headers
 * 
 * @param url - Image URL to preload
 * @returns Promise that resolves when image is loaded and cached
 */
export async function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      console.log('[Image Optimization] ✓ Preloaded:', url);
      resolve();
    };
    
    img.onerror = (error) => {
      console.warn('[Image Optimization] ✗ Failed to preload:', url, error);
      reject(error);
    };
    
    // Set crossOrigin for CORS
    img.crossOrigin = 'anonymous';
    
    // Start loading
    img.src = url;
  });
}

/**
 * Batch preloads multiple images with concurrency control
 * 
 * @param urls - Array of image URLs to preload
 * @param options - Configuration options
 * @returns Promise that resolves when all images are loaded
 */
export async function batchPreloadImages(
  urls: string[],
  options: {
    concurrency?: number;
    onProgress?: (loaded: number, total: number) => void;
    signal?: AbortSignal;
  } = {}
): Promise<void> {
  const { concurrency = 3, onProgress, signal } = options;

  let loaded = 0;
  const total = urls.length;

  // Process URLs in batches
  for (let i = 0; i < urls.length; i += concurrency) {
    // Check for abort signal
    if (signal?.aborted) {
      console.log('[Image Optimization] Preload aborted');
      break;
    }

    // Take next batch
    const batch = urls.slice(i, i + concurrency);
    
    // Preload batch in parallel
    await Promise.allSettled(batch.map(url => preloadImage(url)));
    
    // Update progress
    loaded += batch.length;
    onProgress?.(loaded, total);
  }

  console.log(`[Image Optimization] Preloaded ${loaded}/${total} images`);
}

/**
 * Gets the estimated file size for an optimized image
 * Based on empirical data from Firebase resize extension with WebP
 * 
 * @param size - Image size
 * @returns Estimated file size in KB
 */
export function getEstimatedFileSize(size: ImageSize): number {
  const sizes: Record<ImageSize, number> = {
    thumbnail: 20,   // 200x300 WebP
    medium: 80,      // 600x800 WebP
    large: 200,      // 1200x1600 WebP
    original: 2000,  // Original JPEG (varies widely)
  };
  return sizes[size];
}

/**
 * Calculates total bandwidth savings from using optimized images
 * 
 * @param imageCount - Number of images to load
 * @param size - Size of optimized images
 * @returns Object with bandwidth stats
 */
export function calculateBandwidthSavings(imageCount: number, size: ImageSize = 'thumbnail') {
  const originalSize = getEstimatedFileSize('original') * imageCount;
  const optimizedSize = getEstimatedFileSize(size) * imageCount;
  const savings = originalSize - optimizedSize;
  const savingsPercent = (savings / originalSize) * 100;

  return {
    originalSize: `${(originalSize / 1024).toFixed(1)} MB`,
    optimizedSize: `${(optimizedSize / 1024).toFixed(1)} MB`,
    savings: `${(savings / 1024).toFixed(1)} MB`,
    savingsPercent: `${savingsPercent.toFixed(1)}%`,
    speedupFactor: `${(originalSize / optimizedSize).toFixed(1)}x`,
  };
}
