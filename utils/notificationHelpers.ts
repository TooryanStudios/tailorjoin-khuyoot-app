// Notification Helper Functions

export interface Notification {
  id: string;
  type: 'order' | 'payment' | 'delivery' | 'info' | 'tailor';
  title: string;
  message: string;
  orderId?: string;
  read: boolean;
  createdAt: string;
}

export const createNotification = (
  userId: string, 
  type: Notification['type'],
  title: string,
  message: string,
  orderId?: string
) => {
  const notifications = JSON.parse(localStorage.getItem(`notifications_${userId}`) || '[]');
  
  const newNotification: Notification = {
    id: `notif_${Date.now()}`,
    type,
    title,
    message,
    orderId,
    read: false,
    createdAt: new Date().toISOString()
  };
  
  notifications.unshift(newNotification); // Add to beginning
  localStorage.setItem(`notifications_${userId}`, JSON.stringify(notifications));
  
  return newNotification;
};

export const markNotificationAsRead = (userId: string, notificationId: string) => {
  const notifications = JSON.parse(localStorage.getItem(`notifications_${userId}`) || '[]');
  const updated = notifications.map((n: Notification) => 
    n.id === notificationId ? { ...n, read: true } : n
  );
  localStorage.setItem(`notifications_${userId}`, JSON.stringify(updated));
};

export const deleteNotification = (userId: string, notificationId: string) => {
  const notifications = JSON.parse(localStorage.getItem(`notifications_${userId}`) || '[]');
  const updated = notifications.filter((n: Notification) => n.id !== notificationId);
  localStorage.setItem(`notifications_${userId}`, JSON.stringify(updated));
};

export const getUnreadCount = (userId: string): number => {
  const notifications = JSON.parse(localStorage.getItem(`notifications_${userId}`) || '[]');
  return notifications.filter((n: Notification) => !n.read).length;
};
