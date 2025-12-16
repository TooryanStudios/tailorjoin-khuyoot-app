import React, { useState } from 'react';
import { LayoutGrid, Rows, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProductCard } from '../../../components/ProductCard';
import { Modal } from '../../../components/Modal';
import { Product } from '../../../types';
import { useApp } from '../../../context/AppContext';

interface ProductsGridProps {
  products: Product[];
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

export const ProductsGrid: React.FC<ProductsGridProps> = ({ 
  products, 
  viewMode, 
  onViewModeChange 
}) => {
  const navigate = useNavigate();
  const { appSettings, user } = useApp();
  const isDev = (import.meta as any)?.env?.DEV === true;
  // Admins should always see inspector; keep var for potential future use
  const canDebug = user?.role === 'admin';
  const [inspected, setInspected] = useState<any | null>(null);
  
  const productsTitle = appSettings.siteTexts?.productsTitle || 'أحدث الموديلات';

  if (!products || products.length === 0) return null;

  return (
    <div className="mb-12 w-full dir-rtl px-4 md:px-6">
      
      {/* --- Premium Header --- */}
      <div className="flex flex-row items-center justify-between mb-6">
        
        {/* Title Section */}
        <div className="flex items-center gap-3">
           {/* Decorative Accent Bar */}
           <div className="h-8 w-1.5 bg-indigo-600 rounded-full" />
           <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-none">
                {productsTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                {products.length} منتج متوفر
              </p>
           </div>
        </div>

        {/* Toolbar Container */}
        <div className="flex items-center bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
          
          {/* View Toggles */}
          <div className="flex gap-1">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded-xl transition-all duration-300 ${
                viewMode === 'grid'
                  ? 'bg-slate-900 text-white shadow-md scale-100' // Dark active state for premium feel
                  : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              aria-label="عرض شبكي"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded-xl transition-all duration-300 ${
                viewMode === 'list'
                  ? 'bg-slate-900 text-white shadow-md scale-100'
                  : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              aria-label="عرض قائمة"
            >
              <Rows size={18} />
            </button>
          </div>

          {/* Vertical Divider */}
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2 hidden sm:block"></div>

          {/* See All Button */}
          <button 
            onClick={() => navigate('/jackets')}
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-2 rounded-xl transition-colors"
          >
            عرض الكل
            <ArrowLeft size={14} />
          </button>
        </div>
      </div>
      
      {/* --- Grid/List Content --- */}
      <div className={`transition-all duration-300 ${
        viewMode === 'grid'
          ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6'
          : 'flex flex-col gap-4'
      }`}>
        {products.map((product) => (
          <div key={product.id} className="relative">
            {canDebug && (
              <button
                type="button"
                className="absolute z-20 top-2 left-2 px-2 py-1 text-[10px] rounded bg-slate-900/80 text-white hover:bg-slate-900"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setInspected(product as any);
                }}
                title="Inspect product fields"
              >
                ℹ︎ Inspect
              </button>
            )}
            <ProductCard 
              product={product} 
              viewMode={viewMode}
              showLegacyBadge
              legacyBadgeText="نظام قديم"
              legacyBadgeClassName="bg-indigo-600/90"
            />
          </div>
        ))}
      </div>

      {/* Admin-only inspector modal */}
      {canDebug && (
        <Modal
          isOpen={!!inspected}
          onClose={() => setInspected(null)}
          title="Product Inspector"
          maxWidth="max-w-2xl"
        >
          {inspected && (
            <div className="text-sm space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-slate-500">ID:</span> <span className="font-mono break-all">{inspected.id}</span></div>
                <div><span className="text-slate-500">Name:</span> <span>{inspected.name}</span></div>
                <div><span className="text-slate-500">Price:</span> <span>{inspected.price}</span></div>
                <div><span className="text-slate-500">CategoryId:</span> <span className="font-mono">{inspected.categoryId || inspected.category}</span></div>
                <div><span className="text-slate-500">CoverIndex:</span> <span>{inspected.coverImageIndex ?? '-'}</span></div>
                <div><span className="text-slate-500">TailorId:</span> <span className="font-mono break-all">{inspected.tailorId}</span></div>
              </div>

              <div className="mt-2">
                <div className="text-slate-500 mb-1">Image (cover):</div>
                {inspected.image ? (
                  <img src={inspected.image} alt="cover" className="h-24 w-24 object-cover rounded border" />
                ) : (
                  <div className="text-xs text-slate-500">(no cover image)</div>
                )}
              </div>

              <div className="mt-2">
                <div className="text-slate-500 mb-1">Images array:</div>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(inspected.images) && inspected.images.length > 0 ? (
                    inspected.images.map((src: string, idx: number) => (
                      <img key={idx} src={src} alt={`img-${idx}`} className="h-16 w-16 object-cover rounded border" />
                    ))
                  ) : (
                    <div className="text-xs text-slate-500">(images empty)</div>
                  )}
                </div>
              </div>

              <div className="mt-2">
                <div className="text-slate-500 mb-1">Legacy imageUrls:</div>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray((inspected as any).imageUrls) && (inspected as any).imageUrls.length > 0 ? (
                    (inspected as any).imageUrls.map((src: string, idx: number) => (
                      <img key={idx} src={src} alt={`legacy-${idx}`} className="h-16 w-16 object-cover rounded border" />
                    ))
                  ) : (
                    <div className="text-xs text-slate-500">(imageUrls empty)</div>
                  )}
                </div>
              </div>

              <div className="mt-2">
                <div className="text-slate-500 mb-1">Raw JSON:</div>
                <pre className="text-xs bg-slate-50 dark:bg-slate-800 p-2 rounded border overflow-auto max-h-60">
{JSON.stringify(inspected, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Mobile "See All" Link (Visible only on small screens below grid) */}
      <div className="mt-4 flex justify-center sm:hidden">
        <button 
            onClick={() => navigate('/jackets')}
            className="text-xs font-bold text-slate-500 flex items-center gap-1 hover:text-indigo-600 transition-colors"
        >
            مشاهدة جميع المنتجات <ArrowLeft size={12} />
        </button>
      </div>
    </div>
  );
};