import React from 'react';
import { useApp } from '../context/AppContext';

export const Terms: React.FC = () => {
  const { appSettings } = useApp();
  const content =
    (appSettings as any)?.pageTexts?.termsAndConditions ||
    'Terms and conditions will appear here when configured in Admin > Advanced > Pages.';

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Terms & Conditions</h1>
      <div className="prose prose-slate dark:prose-invert max-w-none whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
};

export default Terms;
