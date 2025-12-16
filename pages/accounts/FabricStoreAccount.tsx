import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AlertTriangle } from 'lucide-react';

export const FabricStoreAccount = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl p-6 text-center border border-slate-200 dark:border-slate-700">
        <AlertTriangle className="mx-auto text-amber-600" size={32} />
        <h3 className="mt-3 font-bold text-slate-900 dark:text-white">تم إيقاف صفحة محلات الأقمشة</h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">نعتمد الآن على الأدوار فقط: بوتيك، خياط، مستخدم، آدمن.</p>
        <div className="mt-4 flex flex-col gap-2">
          <button 
            onClick={() => navigate('/account', { replace: true })} 
            className="w-full py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
          >
            الذهاب لصفحة الحساب
          </button>
        </div>
        {user && (
          <div className="mt-3 text-xs text-slate-500">دورك الحالي: {user.role}</div>
        )}
      </div>
    </div>
  );
};
