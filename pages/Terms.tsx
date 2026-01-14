import React from 'react';
import { useLayoutStore } from '../src/modules/homepage-v2/store/useLayoutStore';

export const Terms: React.FC = () => {
  const cfg = useLayoutStore((s) => s.blockConfig.blockF);
  const content = cfg?.termsContent || 'Terms and conditions will appear here when configured in Admin > Homepage 2.1 > Block F.';

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
