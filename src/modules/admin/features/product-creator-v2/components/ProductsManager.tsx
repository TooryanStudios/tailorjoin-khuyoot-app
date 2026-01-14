import React, { useState } from 'react';
import { Search, Filter, MoreVertical, Edit2, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { CardGridSection, FeatureCardData } from './ui';
import { useCategoriesWithProducts } from '../hooks/useCategoriesWithProducts';

interface ProductDisplay {
  id: string;
  name: string;
  image: string;
  category: string;
  price: string;
  status: 'published' | 'draft' | 'hidden';
  createdAt: string;
}

const statusConfig = {
  published: { label: 'منشور', color: 'bg-lime-400/10 text-lime-400' },
  draft: { label: 'مسودة', color: 'bg-amber-400/10 text-amber-400' },
  hidden: { label: 'مخفي', color: 'bg-slate-400/10 text-slate-400' },
};

// Explore Styles data
const exploreStylesCards: FeatureCardData[] = [
  {
    id: 'behind-scenes',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=400&fit=crop',
    title: 'Behind the Scenes',
    description: 'Turn photos into behind-the-scenes videos',
    badge: { text: 'NEW', variant: 'new' },
  },
  {
    id: 'game-dump',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=400&fit=crop',
    title: 'Game Dump',
    description: 'Transform yourself into 12 iconic video game styles',
    badge: { text: 'TOP', variant: 'top' },
  },
  {
    id: 'nano-strike',
    image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b0b0e?w=300&h=400&fit=crop',
    title: 'Nano Strike',
    description: 'Turn you or your crew into tactical shooters',
    badge: { text: 'NEW', variant: 'new' },
  },
  {
    id: 'nano-theft',
    image: 'https://images.unsplash.com/photo-1493711662062-fa541f7f3d24?w=300&h=400&fit=crop',
    title: 'Nano Theft',
    description: 'See yourself in a realistic open-world game style',
    badge: { text: 'NEW', variant: 'new' },
  },
  {
    id: 'simlife',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300&h=400&fit=crop',
    title: 'Simlife',
    description: 'Transform yourself into a stylized life simulation character',
    badge: { text: 'TOP', variant: 'top' },
  },
];

export const ProductsManager: React.FC = () => {
  const { categorySections, allProductsList, loading, error } = useCategoriesWithProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Transform allProductsList to ProductDisplay format
  const products: ProductDisplay[] = allProductsList.map(p => ({
    id: p.id,
    name: p.name,
    image: p.image,
    category: p.category,
    price: p.price,
    status: p.status,
    createdAt: p.createdAt,
  }));

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || product.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-lime-400" />
        <span className="mr-3 text-slate-400">جاري تحميل البيانات...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <p className="text-sm text-red-400">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 rounded-lg bg-white/5 text-slate-300 text-xs hover:bg-white/10 transition-colors"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Explore Styles Section */}
      <CardGridSection
        id="explore-styles"
        title="EXPLORE STYLES"
        subtitle="Step into iconic fashion worlds and trending styles"
        cards={exploreStylesCards}
        layout="scroll"
        cardDimensions={{ width: 'w-44', aspectRatio: 'aspect-[4/5]' }}
        showArrows={true}
        gap="gap-3"
      />

      {/* Category Sections from Firebase */}
      {categorySections.map((section) => (
        <CardGridSection
          key={section.category.id}
          id={section.category.id}
          title={section.category.nameAr}
          subtitle={section.category.descriptionAr || `منتجات ${section.category.nameAr}`}
          cards={section.cards}
          layout="scroll"
          cardDimensions={{ width: 'w-40', aspectRatio: 'aspect-[3/4]' }}
          showArrows={true}
          gap="gap-3"
          dir="rtl"
        />
      ))}

      {/* Show message if no categories have products */}
      {categorySections.length === 0 && !loading && (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center">
          <p className="text-sm text-slate-400">لا توجد منتجات في التصنيفات بعد</p>
          <p className="text-xs text-slate-600 mt-1">أضف منتجات جديدة لتظهر هنا</p>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث في المنتجات..."
            className="w-full bg-white/[0.02] border border-white/5 rounded-lg pr-9 pl-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-white/20 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none bg-white/[0.02] border border-white/5 rounded-lg pr-8 pl-6 py-2 text-xs text-slate-200 outline-none focus:border-white/20 transition-colors cursor-pointer"
            >
              <option value="all">الكل</option>
              <option value="published">منشور</option>
              <option value="draft">مسودة</option>
              <option value="hidden">مخفي</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Stats */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span>{filteredProducts.length} منتج</span>
        <span>•</span>
        <span>{products.filter(p => p.status === 'published').length} منشور</span>
        <span>•</span>
        <span>{products.filter(p => p.status === 'draft').length} مسودة</span>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <Search size={24} className="text-slate-600" />
          </div>
          <p className="text-sm text-slate-400">لا توجد منتجات</p>
          <p className="text-xs text-slate-600 mt-1">جرب تغيير معايير البحث</p>
        </div>
      )}
    </div>
  );
};

const ProductCard: React.FC<{ product: ProductDisplay }> = ({ product }) => {
  const [showMenu, setShowMenu] = useState(false);
  const status = statusConfig[product.status];

  return (
    <div className="group relative rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden hover:border-white/10 transition-all">
      {/* Image */}
      <div className="relative aspect-square bg-slate-900">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-slate-600">لا توجد صورة</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Quick Actions on Hover */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white transition-colors">
            <Edit2 size={14} />
          </button>
          <button className="p-2 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white transition-colors">
            {product.status === 'hidden' ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <button className="p-2 rounded-lg bg-red-500/20 backdrop-blur-sm hover:bg-red-500/30 text-red-400 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-medium text-slate-200 truncate">{product.name}</h4>
            <p className="text-[10px] text-slate-500 mt-0.5">{product.category}</p>
          </div>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <MoreVertical size={14} />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs font-semibold text-lime-400">{product.price} ر.ع</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Dropdown Menu */}
      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute top-12 left-2 z-20 w-32 rounded-lg border border-white/10 bg-slate-900 shadow-xl py-1">
            <button className="w-full px-3 py-2 text-right text-xs text-slate-300 hover:bg-white/5 flex items-center gap-2">
              <Edit2 size={12} />
              تعديل
            </button>
            <button className="w-full px-3 py-2 text-right text-xs text-slate-300 hover:bg-white/5 flex items-center gap-2">
              {product.status === 'hidden' ? <Eye size={12} /> : <EyeOff size={12} />}
              {product.status === 'hidden' ? 'إظهار' : 'إخفاء'}
            </button>
            <button className="w-full px-3 py-2 text-right text-xs text-red-400 hover:bg-white/5 flex items-center gap-2">
              <Trash2 size={12} />
              حذف
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ProductsManager;
