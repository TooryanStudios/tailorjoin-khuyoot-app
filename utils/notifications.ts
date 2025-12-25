/**
 * Notification utilities for Khuyoot PWA
 * Uses toast notifications instead of browser notifications for better UX
 */

/**
 * Show a toast notification (replaces browser notifications)
 * @param title Notification title
 * @param body Notification body text
 * @param type Toast type: 'success', 'error', or 'info'
 */
export function showToast(
  title: string,
  body?: string,
  type: 'success' | 'error' | 'info' = 'info'
): void {
  // Create toast element
  const toast = document.createElement('div');
  const message = body ? `${title}: ${body}` : title;
  
  // Style based on type
  const typeStyles = {
    success: 'bg-emerald-600 text-white border-emerald-500',
    error: 'bg-red-600 text-white border-red-500',
    info: 'bg-blue-600 text-white border-blue-500'
  };
  
  toast.className = `fixed top-6 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 rounded-full shadow-2xl border font-bold text-sm flex items-center gap-2 animate-in slide-in-from-top-4 ${typeStyles[type]}`;
  toast.style.direction = 'rtl';
  toast.innerHTML = `
    ${type === 'success' ? '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>' : ''}
    ${type === 'error' ? '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>' : ''}
    ${type === 'info' ? '<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' : ''}
    <span>${message}</span>
  `;
  
  document.body.appendChild(toast);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-20px)';
    toast.style.transition = 'all 0.3s ease-out';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}

/**
 * Request notification permission (deprecated - now uses toasts)
 * Kept for backward compatibility
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  console.log('Using toast notifications instead of browser notifications');
  return 'granted'; // Return granted to not block functionality
}

/**
 * Show a local test notification (now uses toast)
 * @param title Notification title
 * @param body Notification body text
 */
export function showLocalTestNotification(
  title: string,
  body: string
): void {
  showToast(title, body, 'info');
}

/**
 * Check if notifications are supported (always true for toasts)
 */
export function isNotificationSupported(): boolean {
  return true;
}

/**
 * Get current notification permission status (always granted for toasts)
 */
export function getNotificationPermission(): NotificationPermission {
  return 'granted';
}
