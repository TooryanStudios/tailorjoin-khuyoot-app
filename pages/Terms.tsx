import React from 'react';
import { useApp } from '../context/AppContext';

export const Terms: React.FC = () => {
  const { appSettings } = useApp();
  
  // Robust check for content existence
  const rawContent = (appSettings as any)?.pageTexts?.termsAndConditions;
  const hasContent = rawContent && typeof rawContent === 'string' && rawContent.trim().length > 0;
  
  const content = hasContent 
    ? rawContent 
    : 'Terms and conditions will appear here when configured in Admin > Advanced > Pages.';

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 pt-24 pb-12">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-8">الشروط والأحكام</h1>
        <div className="prose prose-lg prose-slate dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed bg-white dark:bg-zinc-900/50 p-6 rounded-2xl border border-slate-100 dark:border-white/5">
          {content}
        </div>
      </div>
    </div>
  );
};

export default Terms;
