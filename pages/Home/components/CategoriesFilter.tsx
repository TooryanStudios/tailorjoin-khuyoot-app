import React from 'react';

interface Category {
  id: string;
  name: string;
}

interface CategoriesFilterProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export const CategoriesFilter: React.FC<CategoriesFilterProps> = ({ 
  categories, 
  activeCategory, 
  onCategoryChange 
}) => {
  return (
    <div className="mb-8 overflow-x-auto no-scrollbar">
      <div className="flex items-center md:justify-center gap-2 min-w-max pb-2 px-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 border ${
              activeCategory === cat.id
                ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-105'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
};
