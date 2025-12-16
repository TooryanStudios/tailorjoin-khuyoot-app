import React from 'react';
import { Search } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export const SearchBar: React.FC = () => {
  const { appSettings } = useApp();
  
  const searchPlaceholder = appSettings.siteTexts?.searchPlaceholder || 'ابحث عن دشداشة، قماش، أو خياط...';
  
  return (
    <div className="py-2 max-w-3xl mx-auto mb-4">
      <div className="relative">
        <input 
          type="text" 
          placeholder={searchPlaceholder}
          className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-12 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
        />
        <Search className="absolute top-1/2 -translate-y-1/2 right-4 text-slate-400" size={20} />
      </div>
    </div>
  );
};
