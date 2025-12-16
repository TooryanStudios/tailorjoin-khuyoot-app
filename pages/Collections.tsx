import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Grid3x3, List, Filter, SlidersHorizontal, Heart, Share2, Sparkles } from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { Product } from '../types';

const MOCK_COLLECTIONS = [
  {
    id: 'summer-2025',
    name: 'مجموعة صيف 2025',
    description: 'تشكيلة أنيقة من الدشاديش الصيفية الخفيفة',
    image: 'https://picsum.photos/800/400?random=1',
    itemCount: 12,
    featured: true
  },
  {
    id: 'eid-collection',
    name: 'تشكيلة العيد الفاخرة',
    description: 'أرقى التصاميم لإطلالة مميزة في العيد',
    image: 'https://picsum.photos/800/400?random=2',
    itemCount: 18,
    featured: true
  },
  {
    id: 'wedding-special',
    name: 'مجموعة الأعراس',
    description: 'تصاميم راقية للمناسبات الخاصة',
    image: 'https://picsum.photos/800/400?random=3',
    itemCount: 15,
    featured: false
  },
  {
    id: 'casual-wear',
    name: 'الأزياء اليومية',
    description: 'راحة وأناقة للاستخدام اليومي',
    image: 'https://picsum.photos/800/400?random=4',
    itemCount: 24,
    featured: false
  },
  {
    id: 'traditional',
    name: 'التراث العماني',
    description: 'تصاميم تقليدية أصيلة',
    image: 'https://picsum.photos/800/400?random=5',
    itemCount: 20,
    featured: false
  }
];

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'دشداشة عمانية بيضاء',
    price: 45.0,
    image: 'https://picsum.photos/400/500?random=10',
    category: 'dishdasha',
    tailorId: 't1',
    tailorName: 'خياط الأصالة',
    rating: 4.8,
    inStock: true
  },
  {
    id: '2',
    name: 'دشداشة مطرزة فاخرة',
    price: 75.0,
    image: 'https://picsum.photos/400/500?random=11',
    category: 'dishdasha',
    tailorId: 't1',
    tailorName: 'خياط الأصالة',
    rating: 4.9,
    inStock: true
  },
  {
    id: '3',
    name: 'عباية سوداء كلاسيكية',
    price: 60.0,
    image: 'https://picsum.photos/400/500?random=12',
    category: 'abaya',
    tailorId: 't2',
    tailorName: 'دار الحرير',
    rating: 4.7,
    inStock: true
  },
  {
    id: '4',
    name: 'بدلة رسمية رجالية',
    price: 120.0,
    image: 'https://picsum.photos/400/500?random=13',
    category: 'jacket',
    tailorId: 't3',
    tailorName: 'المقص الذهبي',
    rating: 4.9,
    inStock: false
  }
];

export const Collections = () => {
  const navigate = useNavigate();
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const handleCollectionClick = (collectionId: string) => {
    setSelectedCollection(collectionId === selectedCollection ? null : collectionId);
  };

  return (
    <div className="pb-24 px-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <ShoppingBag className="text-blue-600 dark:text-blue-400" size={32} />
                المجموعات
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                اكتشف أحدث التشكيلات والمجموعات المنسقة خصيصاً لك
              </p>
            </div>
            
            {/* View Toggle */}
            <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Grid3x3 size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <List size={20} />
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <SlidersHorizontal size={18} />
              <span>تصفية</span>
            </button>
            
            <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {['الكل', 'مميز', 'جديد', 'الأكثر مبيعاً'].map((filter) => (
                <button
                  key={filter}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Featured Collections */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="text-amber-500" size={24} />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            المجموعات المميزة
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {MOCK_COLLECTIONS.filter(c => c.featured).map((collection) => (
            <div
              key={collection.id}
              onClick={() => handleCollectionClick(collection.id)}
              className="group relative rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <div className="aspect-[2/1] relative">
                <img
                  src={collection.image}
                  alt={collection.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">{collection.name}</h3>
                <p className="text-slate-200 text-sm mb-3">{collection.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    {collection.itemCount} قطعة
                  </span>
                  <div className="flex items-center gap-2">
                    <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors">
                      <Heart size={18} />
                    </button>
                    <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors">
                      <Share2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Collections */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          جميع المجموعات
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {MOCK_COLLECTIONS.filter(c => !c.featured).map((collection) => (
            <div
              key={collection.id}
              onClick={() => handleCollectionClick(collection.id)}
              className="group bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all cursor-pointer shadow-sm hover:shadow-lg"
            >
              <div className="aspect-video relative overflow-hidden">
                <img
                  src={collection.image}
                  alt={collection.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                  {collection.name}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  {collection.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-500">
                    {collection.itemCount} قطعة
                  </span>
                  <button className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">
                    استكشف →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Products from Selected Collection */}
      {selectedCollection && (
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 mb-6 border border-blue-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  {MOCK_COLLECTIONS.find(c => c.id === selectedCollection)?.name}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  {MOCK_COLLECTIONS.find(c => c.id === selectedCollection)?.description}
                </p>
              </div>
              <button
                onClick={() => setSelectedCollection(null)}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {MOCK_PRODUCTS.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
