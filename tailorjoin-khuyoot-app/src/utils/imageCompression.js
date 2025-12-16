/**
 * Image Compression Utility
 * 
 * Compresses images before upload to reduce storage costs and improve performance.
 * - Max width: 1600px
 * - JPEG quality: 0.75
 * - Converts PNG to JPEG
 * - Rejects files > 5MB before compression
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_WIDTH = 1600;
const JPEG_QUALITY = 0.75;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

/**
 * Validate and compress an image file
 * @param {File} file - Original image file
 * @returns {Promise<{blob: Blob, error: null} | {blob: null, error: string}>}
 */
export async function compressImage(file) {
  // Validate file type
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return {
      blob: null,
      error: 'نوع الملف غير مدعوم. استخدم JPG أو PNG فقط / Unsupported file type. Use JPG or PNG only.'
    };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      blob: null,
      error: `حجم الملف كبير جداً (الحد الأقصى 5 ميجا) / File too large (max 5MB). Current: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    };
  }

  try {
    // Load image
    const img = await loadImage(file);
    
    // Calculate new dimensions
    let width = img.width;
    let height = img.height;
    
    if (width > MAX_WIDTH) {
      height = Math.round((height * MAX_WIDTH) / width);
      width = MAX_WIDTH;
    }

    // Create canvas and draw resized image
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    // Convert to JPEG blob
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    });

    return { blob, error: null };
  } catch (err) {
    console.error('Image compression error:', err);
    return {
      blob: null,
      error: 'فشل ضغط الصورة / Failed to compress image'
    };
  }
}

/**
 * Load an image file into an HTMLImageElement
 * @param {File} file
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Compress multiple images in parallel
 * @param {File[]} files
 * @returns {Promise<{blobs: Blob[], errors: string[]}>}
 */
export async function compressImages(files) {
  const results = await Promise.all(files.map(f => compressImage(f)));
  const blobs = [];
  const errors = [];
  
  results.forEach((result, idx) => {
    if (result.error) {
      errors.push(`صورة ${idx + 1}: ${result.error}`);
    } else {
      blobs.push(result.blob);
    }
  });

  return { blobs, errors };
}
