
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, X, Package, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { db, firebaseService } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';

interface Notification {
  id: string;
  type: 'order' | 'payment' | 'delivery' | 'info' | 'warning' | 'success';
  title: string;
  message: string;
  orderId?: string;
  read: boolean;
  createdAt: string;
}

export const Notifications = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      console.log('❌ لا يوجد مستخدم مسجل دخول');
      setLoading(false);
      return;
    }

    console.log('📥 بدء الاستماع للإشعارات للمستخدم:', user.id, user.name);

    // التحقق من تهيئة Firebase
    if (!db) {
      console.error('❌ Firebase غير مهيأ!');
      setLoading(false);
      return;
    }

    // الاستماع للإشعارات من Firebase في الوقت الفعلي
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log(`🔔 تم استلام ${snapshot.docs.length} إشعار`);
      const loadedNotifications: Notification[] = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('  → إشعار:', doc.id, data.title);
        return {
          id: doc.id,
          type: data.type || 'info',
          title: data.title || '',
          message: data.message || '',
          orderId: data.orderId,
          read: data.read || false,
          createdAt: data.createdAt || new Date().toISOString()
        };
      });
      
      setNotifications(loadedNotifications);
      setLoading(false);
      console.log('✅ تم تحميل الإشعارات بنجاح');
    }, (error: any) => {
      console.error('❌ خطأ في تحميل الإشعارات:', error);
      console.error('كود الخطأ:', error.code);
      console.error('رسالة الخطأ:', error.message);
      setLoading(false);
    });

    return () => {
      console.log('🔴 إيقاف الاستماع للإشعارات');
      unsubscribe();
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      const notificationRef = doc(db, 'notifications', id);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('خطأ في تحديث الإشعار:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const promises = unreadNotifications.map(n => {
        const notificationRef = doc(db, 'notifications', n.id);
        return updateDoc(notificationRef, { read: true });
      });
      await Promise.all(promises);
    } catch (error) {
      console.error('خطأ في تحديث الإشعارات:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const notificationRef = doc(db, 'notifications', id);
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error('خطأ في حذف الإشعار:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.orderId) {
      navigate(`/order/${notification.orderId}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package size={20} className="text-blue-500" />;
      case 'payment':
        return <AlertCircle size={20} className="text-amber-500" />;
      case 'delivery':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'success':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'warning':
        return <AlertCircle size={20} className="text-amber-500" />;
      case 'info':
      default:
        return <Info size={20} className="text-slate-500" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    return `منذ ${diffDays} يوم`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!user) {
    return (
      <div className="pb-24 pt-6 px-4">
        <div className="max-w-2xl mx-auto text-center py-12">
          <Bell size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">يرجى تسجيل الدخول لرؤية الإشعارات</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-6 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">الإشعارات</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-slate-500 mt-1">
                لديك {unreadCount} إشعار جديد
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
            >
              <Check size={14} />
              تحديد الكل كمقروء
            </button>
          )}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-500">جاري التحميل...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">لا توجد إشعارات</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`relative bg-white dark:bg-slate-800 rounded-xl p-4 border transition-all cursor-pointer ${
                  notification.read
                    ? 'border-slate-200 dark:border-slate-700'
                    : 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10'
                }`}
              >
                {/* Unread Indicator */}
                {!notification.read && (
                  <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full"></div>
                )}

                <div className="flex gap-3">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    notification.read 
                      ? 'bg-slate-100 dark:bg-slate-700' 
                      : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className={`font-bold text-sm mb-1 ${
                      notification.read 
                        ? 'text-slate-700 dark:text-slate-300' 
                        : 'text-slate-900 dark:text-white'
                    }`}>
                      {notification.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                      {notification.message}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {getTimeAgo(notification.createdAt)}
                    </span>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
