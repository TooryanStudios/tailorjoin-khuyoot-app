import React from 'react';
import { Bell } from 'lucide-react';

interface NotificationButtonProps {
  onTestNotification: () => void;
  notificationStatus: string;
}

export const NotificationButton: React.FC<NotificationButtonProps> = ({ 
  onTestNotification, 
  notificationStatus 
}) => {
  return (
    <div className="mb-4 mt-4">
      <button
        onClick={onTestNotification}
        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-2xl py-4 px-6 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all"
      >
        <Bell size={24} />
        <div className="text-right">
          <div className="font-bold text-lg">تجربة التنبيهات</div>
          <div className="text-xs text-amber-100">اختبر استلام الإشعارات الفورية</div>
        </div>
      </button>
      {notificationStatus && (
        <div className="mt-2 text-center text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg py-2 px-4">
          {notificationStatus}
        </div>
      )}
    </div>
  );
};
