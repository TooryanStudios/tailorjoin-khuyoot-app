import React from 'react';

export const QuickActionPanel: React.FC = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-gold-400">إجراءات سريعة</h3>
      <button className="w-full py-3 rounded-xl font-bold khiyoot-glass hover:bg-white/10 transition">طلب جديد</button>
      <button className="w-full py-3 rounded-xl font-bold khiyoot-glass hover:bg-white/10 transition">إرسال للمصمم</button>
      <button className="w-full py-3 rounded-xl font-bold khiyoot-glass hover:bg-white/10 transition">تصدير PDF</button>
      <div className="pt-2 text-xs text-white/60">الواجهة العربية - محاذاة يمين</div>
    </div>
  );
};

export default QuickActionPanel;
