import React, { useEffect, useState } from 'react';
import { ArrowRight, Grid3x3, LayoutGrid, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { getProducts } from '../services/mockService';
import { ProductCard } from '../components/ProductCard';

type ViewMode = 'grid' | 'compact' | 'list';

export const ProductList = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    // Simulating fetching "jackets" specifically
    getProducts('jacket').then(setProducts);
  }, []);

  return (
    <div className="pb-24 pt-4 px-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between max-w-7xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <ArrowRight size={20} />
        </button>
        
        <div className="text-center">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">مقترحة لك</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">جاكيتات العيد</h1>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title="عرض شبكي"
          >
            <Grid3x3 size={16} />
          </button>
          <button
            onClick={() => setViewMode('compact')}
            className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
              viewMode === 'compact'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title="عرض مضغوط"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title="عرض قائمة"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Products Grid/List */}
      <div className="max-w-7xl mx-auto">
        {viewMode === 'grid' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {products.length > 0 ? (
              products.map((product) => (
                <ProductCard key={product.id} product={product} viewMode="grid" />
              ))
            ) : (
              <div className="col-span-full text-center py-20 text-slate-500">
                جاري التحميل...
              </div>
            )}
          </div>
        )}

        {viewMode === 'compact' && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {products.length > 0 ? (
              products.map((product) => (
                <ProductCard key={product.id} product={product} viewMode="compact" />
              ))
            ) : (
              <div className="col-span-full text-center py-20 text-slate-500">
                جاري التحميل...
              </div>
            )}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="space-y-4">
            {products.length > 0 ? (
              products.map((product) => (
                <ProductCard key={product.id} product={product} viewMode="list" />
              ))
            ) : (
              <div className="text-center py-20 text-slate-500">
                جاري التحميل...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};