import React from 'react';
import { Mail, MapPin, FileText, X } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export const ContactFooter: React.FC = () => {
  const { appSettings } = useApp();
  const [modal, setModal] = React.useState<'privacy' | 'terms' | null>(null);
  const [agree, setAgree] = React.useState(false);
  
  const contactTexts = appSettings.siteTexts || {};
  const title = contactTexts.contactFooterTitle || 'تواصل معنا';
  const subtitle = contactTexts.contactFooterSubtitle || 'نحن هنا لخدمتك في أي وقت';
  const email = contactTexts.contactEmail || 'info@khuyoot.om';
  const address = contactTexts.contactAddress || 'مسقط، سلطنة عُمان';
  const copyright = contactTexts.copyrightText || '© 2025 خيوط - منصة التفصيل الذكي. جميع الحقوق محفوظة.';

  // Get privacy and terms from Block F settings
  const blockFConfig = (appSettings as any)?.homePageV2Layout?.blockConfig?.blockF;
  const blockFItems = Array.isArray(blockFConfig?.items) ? blockFConfig.items : [];
  
  const privacyItem = blockFItems.find((item: any) => 
    (item.title || '').toLowerCase().includes('خصوصية') || 
    (item.title || '').toLowerCase().includes('privacy')
  );
  
  const termsItem = blockFItems.find((item: any) => 
    (item.title || '').toLowerCase().includes('شروط') || 
    (item.title || '').toLowerCase().includes('terms')
  );

  // Read content from Block F config
  const privacyText = blockFConfig?.privacyContent || 'سياسة الخصوصية';
  const termsText = blockFConfig?.termsContent || 'الشروط والأحكام';
  
  return (
    <>
      <div className="mt-12 mb-8 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{title}</h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs">{subtitle}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col items-center text-center p-3 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center mb-2">
                <Mail className="text-blue-600 dark:text-blue-400" size={18} />
              </div>
              <h4 className="font-semibold text-slate-800 dark:text-white text-sm mb-1">البريد الإلكتروني</h4>
              <a href={`mailto:${email}`} className="text-blue-600 dark:text-blue-400 hover:underline text-xs">
                {email}
              </a>
            </div>

            <div className="flex flex-col items-center text-center p-3 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center mb-2">
                <MapPin className="text-purple-600 dark:text-purple-400" size={18} />
              </div>
              <h4 className="font-semibold text-slate-800 dark:text-white text-sm mb-1">الموقع</h4>
              <p className="text-slate-600 dark:text-slate-400 text-xs">
                {address}
              </p>
            </div>

            <div 
              onClick={() => {
                setAgree(false);
                setModal('privacy');
              }}
              className="flex flex-col items-center text-center p-3 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-green-400 hover:bg-green-50 dark:hover:bg-slate-700/50 transition"
            >
              <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center mb-2">
                <FileText className="text-green-600 dark:text-green-400" size={18} />
              </div>
              <h4 className="font-semibold text-slate-800 dark:text-white text-sm mb-1">سياسة الخصوصية</h4>
              <button
                onClick={(e) => e.stopPropagation()}
                className="text-green-600 dark:text-green-400 hover:underline text-xs font-medium"
              >
                اقرأ الآن
              </button>
            </div>

            <div 
              onClick={() => {
                setAgree(false);
                setModal('terms');
              }}
              className="flex flex-col items-center text-center p-3 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-slate-700/50 transition"
            >
              <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center mb-2">
                <FileText className="text-orange-600 dark:text-orange-400" size={18} />
              </div>
              <h4 className="font-semibold text-slate-800 dark:text-white text-sm mb-1">الشروط والأحكام</h4>
              <button
                onClick={(e) => e.stopPropagation()}
                className="text-orange-600 dark:text-orange-400 hover:underline text-xs font-medium"
              >
                اقرأ الآن
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-center">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {copyright}
            </p>
            
            {/* Version Timestamp */}
            <div className="mt-3 inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] px-2.5 py-1 rounded-full shadow-lg border border-white/20 font-medium">
              🕐 آخر تحديث: 11 ديسمبر 2025 - 09:20 م
            </div>
          </div>
        </div>
      </div>

      {/* Compact Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-xl max-h-[70vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="text-lg font-bold text-white">
                {modal === 'privacy' ? privacyItem?.title || 'سياسة الخصوصية' : termsItem?.title || 'الشروط والأحكام'}
              </h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Bright Text Box */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="bg-white dark:bg-slate-100 text-slate-900 p-5 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">
                {modal === 'privacy' ? privacyText : termsText}
              </div>
            </div>

            <div className="p-5 border-t border-white/10 flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span>أوافق</span>
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  disabled={!agree}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  قبول
                </button>
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="flex-1 px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white text-sm hover:bg-white/10 transition"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
