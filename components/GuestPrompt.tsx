import React from 'react';
import { Lock, Sparkles, CheckCircle2, UserPlus } from 'lucide-react';
import { Button } from './Button';
import { useApp } from '../context/AppContext';

interface GuestPromptProps {
  title?: string;
  description?: string;
  features?: string[];
}

export const GuestPrompt: React.FC<GuestPromptProps> = ({ 
  title = "سجّل الآن واستمتع بميزات خاصة!",
  description = "للوصول الكامل لهذه الميزة والاستفادة من جميع خدمات خيوط، يرجى تسجيل الدخول أو إنشاء حساب جديد",
  features = [
    "حفظ مقاساتك بشكل دائم",
    "تتبع طلباتك بسهولة",
    "التواصل المباشر مع الخياطين",
    "الحصول على عروض حصرية"
  ]
}) => {
  const { toggleAuthModal } = useApp();

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Icon with animation */}
        <div className="relative mb-8 flex justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-2xl animate-pulse"></div>
          </div>
          <div className="relative w-24 h-24 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/30 transform hover:scale-105 transition-transform">
            <Lock size={40} className="text-white" />
            <div className="absolute -top-2 -right-2">
              <Sparkles size={20} className="text-yellow-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white text-center mb-3">
          {title}
        </h2>
        
        {/* Description */}
        <p className="text-slate-600 dark:text-slate-400 text-center mb-8 leading-relaxed">
          {description}
        </p>

        {/* Features */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 mb-8 border border-blue-100 dark:border-blue-800">
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="flex items-start gap-3 animate-in slide-in-from-left duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mt-0.5">
                  <CheckCircle2 size={20} className="text-green-600 dark:text-green-400" />
                </div>
                <span className="text-slate-700 dark:text-slate-300 text-sm flex-1">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={() => toggleAuthModal(true)}
            className="w-full py-4 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/30"
          >
            <UserPlus size={22} />
            تسجيل الدخول
          </Button>
          
          <button
            onClick={() => toggleAuthModal(true)}
            className="w-full py-3 text-base border-2 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors font-medium"
          >
            تسجيل مستخدم جديد
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-3 text-base text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-medium"
          >
            العودة للرئيسية
          </button>
          
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            انضم لآلاف المستخدمين الراضين عن خدماتنا ✨
          </p>
        </div>

        {/* Trust badges */}
        <div className="mt-8 flex items-center justify-center gap-6 text-slate-400 dark:text-slate-600 text-xs">
          <div className="flex items-center gap-1">
            <CheckCircle2 size={14} className="text-green-500" />
            <span>آمن 100%</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 size={14} className="text-green-500" />
            <span>مجاني</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 size={14} className="text-green-500" />
            <span>سريع</span>
          </div>
        </div>
      </div>
    </div>
  );
};
