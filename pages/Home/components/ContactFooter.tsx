import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export const ContactFooter: React.FC = () => {
  const { appSettings } = useApp();
  
  const contactTexts = appSettings.siteTexts || {};
  const title = contactTexts.contactFooterTitle || 'تواصل معنا';
  const subtitle = contactTexts.contactFooterSubtitle || 'نحن هنا لخدمتك في أي وقت';
  const email = contactTexts.contactEmail || 'info@khuyoot.om';
  const phone = contactTexts.contactPhone || '+968 9999 9999';
  const address = contactTexts.contactAddress || 'مسقط، سلطنة عُمان';
  const copyright = contactTexts.copyrightText || '© 2025 خيوط - منصة التفصيل الذكي. جميع الحقوق محفوظة.';
  
  return (
    <div className="mt-12 mb-8 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{title}</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm">{subtitle}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-3">
              <Mail className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-white mb-1">البريد الإلكتروني</h4>
            <a href={`mailto:${email}`} className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
              {email}
            </a>
          </div>

          <div className="flex flex-col items-center text-center p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
              <Phone className="text-emerald-600 dark:text-emerald-400" size={24} />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-white mb-1">الهاتف</h4>
            <a href={`tel:${phone}`} className="text-blue-600 dark:text-blue-400 hover:underline text-sm" dir="ltr">
              {phone}
            </a>
          </div>

          <div className="flex flex-col items-center text-center p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mb-3">
              <MapPin className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
            <h4 className="font-bold text-slate-800 dark:text-white mb-1">الموقع</h4>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              {address}
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {copyright}
          </p>
          
          {/* Version Timestamp */}
          <div className="mt-4 inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg border border-white/20 font-medium">
            🕐 آخر تحديث: 11 ديسمبر 2025 - 09:20 م
          </div>
        </div>
      </div>
    </div>
  );
};
