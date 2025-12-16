/**
 * Notification utilities for Khuyoot PWA
 * Handles browser notification permissions and local test notifications
 */

/**
 * Request notification permission from the user
 * @returns Promise resolving to 'granted', 'denied', or 'default'
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  // Check if notifications are supported
  if (!('Notification' in window)) {
    console.warn('Notifications not supported in this browser');
    return 'denied';
  }

  // If already granted or denied, return current status
  if (Notification.permission !== 'default') {
    return Notification.permission;
  }

  // Request permission
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Show a local test notification
 * @param title Notification title
 * @param body Notification body text
 * @param options Optional notification options
 */
export function showLocalTestNotification(
  title: string,
  body: string,
  options?: NotificationOptions
): void {
  // Check if notifications are supported
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return;
  }

  // Check permission
  if (Notification.permission !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  // Show notification
  try {
    const notification = new Notification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      dir: 'rtl',
      lang: 'ar',
      ...options,
    });

    // Auto-close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);

    // Handle notification click
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

/**
 * Check if notifications are supported in the current browser
 */
export function isNotificationSupported(): boolean {
  return 'Notification' in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
}
