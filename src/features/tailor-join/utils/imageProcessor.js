// src/features/tailor-join/utils/imageProcessor.js

/**
 * Client-side image compression
 * Max width: 1600px, JPEG quality: 0.75
 */
export async function compressImage(file, maxWidth = 1600, quality = 0.75) {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image'));
      return;
    }
    
    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('File size too large (max 10MB)'));
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Create new file from blob
              const compressedFile = new File(
                [blob],
                file.name,
                { type: 'image/jpeg' }
              );
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Generate a preview URL for an image file
 */
export function getImagePreview(file) {
  return URL.createObjectURL(file);
}

/**
 * Revoke preview URL to free memory
 */
export function revokeImagePreview(url) {
  URL.revokeObjectURL(url);
}

/**
 * Validate image file
 */
export function validateImageFile(file) {
  const errors = [];
  
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    errors.push('Only JPEG, PNG, and WebP images are allowed');
  }
  
  // Check file size (10MB max)
  if (file.size > 10 * 1024 * 1024) {
    errors.push('Image must be less than 10MB');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
