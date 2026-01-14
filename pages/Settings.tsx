import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Settings as SettingsIcon } from 'lucide-react';
import { PageTransition } from '../src/components/PageTransition';

/**
 * Settings Page - SPA Persistence Test
 * This page demonstrates that the app is a true SPA:
 * - Navigate here from Home
 * - Go back to Home
 * - Your "Temporary Note" input should still have the text you typed
 */
export const Settings: React.FC = () => {
  return (
    <PageTransition>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <SettingsIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              الإعدادات
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            هذه صفحة اختبار لإثبات أن التطبيق يعمل كـ SPA حقيقي
          </p>
        </div>

        {/* SPA Test Explanation */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            ✓ اختبار الثبات (Persistence Test)
          </h2>
          
          <div className="space-y-4 text-slate-600 dark:text-slate-400">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold">
                1
              </div>
              <p>
                ارجع إلى الصفحة الرئيسية باستخدام الزر أدناه
              </p>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold">
                2
              </div>
              <p>
                اكتب أي نص في حقل "ملاحظة مؤقتة"
              </p>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold">
                3
              </div>
              <p>
                ارجع إلى هذه الصفحة مرة أخرى
              </p>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
                ✓
              </div>
              <p className="font-semibold text-slate-900 dark:text-white">
                إذا كان النص لا يزال موجودًا، فالتطبيق يعمل كـ SPA حقيقي! 🎉
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>ملاحظة:</strong> في تطبيقات الويب التقليدية، سيتم مسح النص عند التنقل. 
              في SPA، يبقى النص لأن الصفحة لا يتم إعادة تحميلها بالكامل.
            </p>
          </div>
        </div>

        {/* Back Button */}
        <Link
          to="/"
          className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <ArrowRight className="w-5 h-5" />
          <span>العودة إلى الصفحة الرئيسية</span>
        </Link>

        {/* Additional Info */}
        <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>
            هذا التطبيق مبني باستخدام React + React Router + Firebase
          </p>
          <p className="mt-1">
            جميع التنقلات فورية بدون إعادة تحميل الصفحة
          </p>
        </div>
      </div>
    </div>
    </PageTransition>
  );
};

export default Settings;
