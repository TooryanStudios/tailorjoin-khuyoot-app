/**
 * Image utility functions for handling profile images
 */

/**
 * Check if an image URL is a base64 data URL (deprecated format)
 * Base64 images cause performance issues and should be re-uploaded
 */
export function isBase64Image(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('data:');
}

/**
 * Check if an image URL is a valid HTTP/HTTPS URL
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Get a safe image URL for display
 * - Returns the URL if it's a valid HTTP URL
 * - Returns null if it's a base64 image (should show placeholder instead)
 * - Returns null if no URL provided
 */
export function getSafeImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  
  // Block base64 images - they cause performance issues
  if (url.startsWith('data:')) {
    console.warn('[imageUtils] Blocked base64 image - user should re-upload');
    return null;
  }
  
  // Allow HTTP/HTTPS URLs
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Block anything else
  return null;
}

/**
 * Get display props for a profile image
 * Returns either the image URL or placeholder info
 */
export function getProfileImageDisplay(
  profileImage: string | null | undefined,
  userName: string | null | undefined
): {
  type: 'image' | 'initials' | 'reupload';
  imageUrl?: string;
  initials?: string;
  showReuploadWarning?: boolean;
} {
  const safeUrl = getSafeImageUrl(profileImage);
  
  if (safeUrl) {
    return { type: 'image', imageUrl: safeUrl };
  }
  
  // Check if this was a base64 image that got blocked
  if (isBase64Image(profileImage)) {
    return { 
      type: 'reupload', 
      initials: getInitials(userName),
      showReuploadWarning: true 
    };
  }
  
  // No image at all - show initials
  return { 
    type: 'initials', 
    initials: getInitials(userName) 
  };
}

/**
 * Get initials from a name (for avatar placeholder)
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (name[0] || 'U').toUpperCase();
}
