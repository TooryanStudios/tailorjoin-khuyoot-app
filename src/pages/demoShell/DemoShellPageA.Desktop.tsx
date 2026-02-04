import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Play, ChevronLeft, ChevronRight, ChevronDown, Sparkles, User2, History as HistoryIcon, Home, LayoutGrid, HelpCircle, Crown, Heart, Tag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { DemoShellOutletContext } from './DemoShellLayout';
import type { FabricMaterial, Product, Tailor } from '../../../types';
import { useThumbnail } from '../../hooks/useThumbnailCache';
import { useApp } from '../../../context/AppContext';
import { DiscoverDesignerPromo } from './DemoShellPageA';


type PromoTile = {
  id: string;
  title: string;
  imageUrl?: string;
  href: string;
};

const getRegionName = (tailor: Tailor, regions: any[]) => {
  // Tailor.region is a STRING (like "Muscat"), match against region.name
  const tailorRegionName = (tailor as any).region || (tailor as any).location || '';
  
  if (!tailorRegionName) return 'Unknown';
  
  const matchedRegion = regions.find((r) => r.name === tailorRegionName);
  return matchedRegion?.name || tailorRegionName || 'Unknown';
};

const ProductCard = React.memo(function ProductCard({ 
  product, 
  showBadge,
  variant = 'default'
}: { 
  product: Product; 
  showBadge?: boolean;
  variant?: 'women' | 'men' | 'default';
}) {
  const navigate = useNavigate();
  const displaySrc = useThumbnail(product.image, { maxEntries: 100 });

  const cardStyles = {
    women: "aspect-[3/4.5] rounded-[2rem]",
    men: "aspect-[2/3] rounded-lg",
    default: "aspect-[2/3] rounded-xl"
  }[variant];

  return (
    <article 
      className="group cursor-pointer"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div className={`relative w-full ${cardStyles} bg-[var(--studio-card)] overflow-hidden border border-[var(--studio-card-border)] shadow-sm transition-transform duration-300 group-hover:scale-[1.02]`}>
        {displaySrc ? (
          <img
            src={displaySrc}
            alt={product.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-200 animate-pulse" />
        )}
        
        {/* Floating Icons - Vertical Stack (Hover Only) */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
           <button 
             type="button" 
             onClick={(e) => { e.stopPropagation(); /* Add like logic if needed */ }}
             className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-white hover:text-red-500 transition border border-white/10 shadow-lg"
           >
             <Heart size={16} />
           </button>
           <button 
             type="button" 
             onClick={(e) => { e.stopPropagation(); /* Add tag logic if needed */ }}
             className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-white hover:text-blue-500 transition border border-white/10 shadow-lg"
           >
             <Tag size={16} />
           </button>
        </div>

        {/* Badge (Always Visible) */}
        {showBadge && (
          <div className="absolute top-3 right-3 bg-blue-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-tighter shadow-sm z-10">
            90% OFF
          </div>
        )}

        {/* Info Overlay (Row with Name and Price) */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between gap-2">
          {/* Name - Visible only on hover */}
          <div className="flex-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 min-w-0">
            <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded text-white text-[10px] leading-tight truncate border border-white/10">
              {product.name}
            </div>
          </div>
          
          {/* Price - Always Visible */}
          <div className="shrink-0 px-2 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold shadow-lg">
            {product.price} ر.ع
          </div>
        </div>

        {/* Recently Added Badge (Optional) */}
        {(product as any)._isNewArrival && (
          <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-lg z-20 animate-pulse">
            NEW
          </div>
        )}
      </div>
    </article>
  );
});

const CategoryTile = React.memo(function CategoryTile({ 
  category, 
  onClick 
}: { 
  category: any; 
  onClick: () => void;
}) {
  const displaySrc = useThumbnail(category.image || category.imageUrl, { maxEntries: 100 });

  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left w-full h-full"
    >
      <div className="relative h-[280px] w-full bg-[var(--studio-card)] rounded-[2.5rem] overflow-hidden border border-[var(--studio-card-border)] shadow-sm transition-transform duration-300 group-hover:scale-[1.02]">
        {displaySrc ? (
          <img
            src={displaySrc}
            alt={category.nameAr || category.name}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-800 flex items-center justify-center p-4">
            <div className="w-full h-px bg-white/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
           <h3 className="text-white font-bold text-lg tracking-tight leading-tight">
             {category.nameAr || category.name}
           </h3>
           <span className="text-blue-400 text-[10px] uppercase font-bold tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Explore</span>
        </div>
      </div>
    </button>
  );
});

const TailorCardDesktop = React.memo(function TailorCardDesktop({ 
  tailor, 
  regionName, 
  isVerified,
  onClick 
}: { 
  tailor: Tailor; 
  regionName: string; 
  isVerified?: boolean;
  onClick: () => void;
}) {
  const displaySrc = useThumbnail(tailor.profileImage || tailor.image, { maxEntries: 100 });

  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-center w-[220px] shrink-0"
    >
      <div className="relative aspect-square w-full bg-[var(--studio-card)] rounded-2xl overflow-hidden border border-[var(--studio-card-border)] shadow-sm transition-transform duration-300 group-hover:scale-[1.02]">
        {displaySrc ? (
          <img
            src={displaySrc}
            alt={tailor.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="absolute inset-0 bg-zinc-200 animate-pulse" />
        )}
      </div>
      
      <div className="mt-3">
        <div className="flex items-center justify-center gap-1 min-w-0">
          <h3 className="text-sm font-medium text-[var(--studio-text)] truncate">
            {tailor.name}
          </h3>
          {isVerified && (
            <div className="shrink-0 text-blue-500">
               <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                 <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
               </svg>
            </div>
          )}
        </div>
        <p className="text-[10px] text-[var(--studio-text-muted)] font-normal uppercase tracking-widest mt-0.5">
          {regionName}
        </p>
      </div>
    </button>
  );
});

const HeroBanner = () => {
  const displaySrc = useThumbnail('/auth-panel.jpg', { maxEntries: 10 });
  
  return (
    <section className="relative w-full h-[200px] bg-zinc-900 rounded-[3rem] overflow-hidden flex items-center justify-center p-8 border border-[var(--studio-card-border)] mb-12 group">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={displaySrc || '/auth-panel.jpg'} 
          className="w-full h-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-105" 
          alt="" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/40 to-transparent" />
      </div>

      <div className="text-center space-y-3 max-w-xl relative z-10" dir="rtl">
        <h1 className="text-3xl font-bold tracking-tight text-white leading-tight">
          خيوط: <span className="text-blue-400 italic">نسيجٌ من التواصل</span>
        </h1>
        <p className="text-lg text-zinc-300 font-normal">تجربة خياطة متميزة تجمع المجتمعات وتنسج الروابط.</p>
      </div>

      {/* Floating Logo - Simplified and smaller */}
      <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-4 z-10">
        <div className="w-16 h-28 bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl rotate-[5deg] border border-white/10">
          <img src="/logo_big.png" className="w-full h-full object-contain p-3" alt="" />
        </div>
      </div>
    </section>
  );
};

const SectionHeader = ({ 
  title, 
  onNext, 
  onPrev,
  onViewAll 
}: { 
  title: string; 
  onNext?: () => void; 
  onPrev?: () => void;
  onViewAll?: () => void;
}) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-2xl font-normal tracking-tight text-[var(--studio-text)]">{title}</h2>
    <div className="flex items-center gap-3">
      {onViewAll && (
        <button 
          onClick={onViewAll}
          className="text-sm font-normal text-blue-500 hover:text-blue-600 transition-colors px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100"
        >
          View All
        </button>
      )}
      {(onNext || onPrev) && (
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={onNext} 
            className="h-7 w-7 flex items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:bg-zinc-50 transition-colors shadow-sm"
          >
            <ChevronRight size={14} />
          </button>
          <button 
            type="button"
            onClick={onPrev} 
            className="h-7 w-7 flex items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:bg-zinc-50 transition-colors shadow-sm"
          >
            <ChevronLeft size={14} />
          </button>
        </div>
      )}
    </div>
  </div>
);

export function DemoShellPageADesktop() {
  const { user } = useApp();
  const navigate = useNavigate();
  const studiosRef = React.useRef<HTMLDivElement>(null);
  const womenRef = React.useRef<HTMLDivElement>(null);
  const menRef = React.useRef<HTMLDivElement>(null);

  const scroll = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (!ref.current) return;
    const scrollAmount = 400;
    ref.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const {
    dbProducts,
    isDbLoading,
    dbTailors,
    isTailorsLoading,
    dbCategories,
    isCategoriesLoading,
  } = useOutletContext<DemoShellOutletContext>();
  const { theme } = useApp();

  const [selectedWomenCategoryId, setSelectedWomenCategoryId] = React.useState<string | null>(null);
  const [selectedMenCategoryId, setSelectedMenCategoryId] = React.useState<string | null>(null);
  const [selectedRecentCategoryId, setSelectedRecentCategoryId] = React.useState<string | null>(null);
  const [selectedRegionId, setSelectedRegionId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Use regions from context - matched via tailor.region -> dbRegions.name
  const dbRegions = (useOutletContext<DemoShellOutletContext>() as any).dbRegions || [];

  const filteredTailors = React.useMemo(() => {
    if (!selectedRegionId) return dbTailors || [];
    const targetRegion = dbRegions.find((r: any) => r.id === selectedRegionId);
    if (!targetRegion) return dbTailors || [];
    
    return (dbTailors || []).filter((t: any) => {
      const tailorRegion = t.regionId || t.region || t.location;
      return tailorRegion === targetRegion.id || tailorRegion === targetRegion.name;
    });
  }, [selectedRegionId, dbTailors, dbRegions]);

  // Hierarchical categories
  const womenRootId = '41CUgvhXUiehlhuKxS6k';
  const womenRoot = dbCategories.find(c => c.id === womenRootId || (c.level === 1 && c.nameAr === 'الملابس النسائية'));
  const menRoot = dbCategories.find(c => 
    (c.level === 1 || c.level === 0) && 
    (c.nameAr === 'الملابس الرجالية' || (c.nameEn || '').toLowerCase().includes('men') || (c.name || '').toLowerCase().includes('men'))
  );
  
  const womenSubCategories = womenRoot ? dbCategories.filter(c => (c.parentId === womenRoot.id || c.id === womenRoot.id) && c.isActive !== false) : [];
  const menSubCategories = menRoot ? dbCategories.filter(c => (c.parentId === menRoot.id || c.id === menRoot.id) && c.isActive !== false) : [];

  const womenExclusiveProducts = React.useMemo(() => {
    const womenIds = new Set(womenSubCategories.map(c => c.id));
    const womenNames = new Set(womenSubCategories.map(c => (c.nameEn || c.name || '').toLowerCase()));
    if (womenRoot) {
      womenIds.add(womenRoot.id);
      womenNames.add((womenRoot.nameEn || womenRoot.name || '').toLowerCase());
    }

    return (dbProducts || []).filter((p: any) => {
      const cid = p.categoryId || p.subCategoryId;
      const catName = (p.category || '').toLowerCase();
      
      if (selectedWomenCategoryId) return cid === selectedWomenCategoryId;
      return womenIds.has(cid) || womenNames.has(catName);
    });
  }, [selectedWomenCategoryId, dbProducts, womenSubCategories, womenRoot]);

  const menExclusiveProducts = React.useMemo(() => {
    const menIds = new Set(menSubCategories.map(c => c.id));
    const menNames = new Set(menSubCategories.map(c => (c.nameEn || c.name || '').toLowerCase()));
    if (menRoot) {
      menIds.add(menRoot.id);
      menNames.add((menRoot.nameEn || menRoot.name || '').toLowerCase());
    }

    return (dbProducts || []).filter((p: any) => {
      const cid = p.categoryId || p.subCategoryId;
      const catName = (p.category || '').toLowerCase();

      if (selectedMenCategoryId) return cid === selectedMenCategoryId;
      return menIds.has(cid) || menNames.has(catName);
    });
  }, [selectedMenCategoryId, dbProducts, menSubCategories, menRoot]);

  const recentlyAddedProducts = React.useMemo(() => {
    // dbProducts is already sorted newest first in firebase.ts
    const filtered = (dbProducts || []).filter((p: any) => {
      // Functional search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = (p.name || '').toLowerCase().includes(query);
        const matchesDesc = (p.description || '').toLowerCase().includes(query);
        const matchesTailor = (p.tailorName || '').toLowerCase().includes(query);
        const matchesCat = (p.category || '').toLowerCase().includes(query);
        if (!(matchesName || matchesDesc || matchesTailor || matchesCat)) return false;
      }

      if (!selectedRecentCategoryId) return true;
      const cid = p.categoryId || p.subCategoryId;
      const catName = (p.category || '').toLowerCase();
      
      // Check if selected category is a root (Women/Men)
      if (selectedRecentCategoryId === womenRootId) {
        const womenIds = new Set(womenSubCategories.map(c => c.id));
        return cid === womenRootId || womenIds.has(cid) || catName.includes('women');
      }
      if (selectedRecentCategoryId === menRoot?.id) {
        const menIds = new Set(menSubCategories.map(c => c.id));
        return cid === menRoot.id || menIds.has(cid) || catName.includes('men');
      }

      return cid === selectedRecentCategoryId;
    });

    return filtered.slice(0, 30).map(p => ({ ...p, _isNewArrival: true }));
  }, [dbProducts, searchQuery, selectedRecentCategoryId, womenSubCategories, menSubCategories, menRoot]);

  return (
    <div className="w-full">
      {/* 1. Hero Banner */}
      <HeroBanner />

      {/* Global Search Bar */}
      <div className="max-w-xl mx-auto -mt-8 relative z-20 px-4 mb-16">
        <div className="relative group">
          <input
            type="text"
            placeholder="Search products, tailors, or collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-[var(--studio-card-border)] rounded-full py-4 pl-14 pr-6 text-sm shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all group-hover:shadow-2xl"
          />
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Tailor Shops Section */}
      <section className="mb-16">
        <SectionHeader 
          title="أفضل مشاغل الخياطة - Top Tailor Shops" 
          onPrev={() => scroll(studiosRef, 'left')}
          onNext={() => scroll(studiosRef, 'right')}
        />
        
        {/* Region Filter Chips */}
        <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => setSelectedRegionId(null)}
            className={`px-5 py-2 rounded-full text-xs transition-all whitespace-nowrap border ${
              selectedRegionId === null
                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                : 'bg-[var(--studio-card)] border-[var(--studio-card-border)] text-[var(--studio-text-muted)] hover:border-blue-500/50'
            }`}
          >
            All Regions
          </button>
          {dbRegions.map((region: any) => (
            <button
              key={region.id}
              onClick={() => setSelectedRegionId(region.id)}
              className={`px-5 py-2 rounded-full text-xs transition-all whitespace-nowrap border ${
                selectedRegionId === region.id
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                  : 'bg-[var(--studio-card)] border-[var(--studio-card-border)] text-[var(--studio-text-muted)] hover:border-blue-500/50'
              }`}
            >
              {region.name}
            </button>
          ))}
        </div>

        {isTailorsLoading ? (
          <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide no-scrollbar">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="aspect-square w-[220px] bg-zinc-100 rounded-2xl animate-pulse shrink-0" />
            ))}
          </div>
        ) : (
          <div 
            ref={studiosRef}
            className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide no-scrollbar -mx-4 px-4"
          >
            {filteredTailors?.slice(0, 8).map((tailor, idx) => (
              <TailorCardDesktop
                key={tailor.id}
                tailor={tailor}
                isVerified={idx < 2}
                regionName={getRegionName(tailor, dbRegions)}
                onClick={() => navigate(`/tailor/${tailor.id}`)}
              />
            ))}
            {filteredTailors.length === 0 && (
              <div className="w-full py-10 text-center text-zinc-500">
                <p>No studios found in this region.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 3. Recently Added Products */}
      <section className="mb-16">
        <SectionHeader 
          title="أحدث الإضافات - Recently Added" 
          onViewAll={() => navigate('/collections')}
        />
        
        {/* Category Filter Chips for Recently Added */}
        <div className="flex flex-wrap gap-2 mb-3 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => setSelectedRecentCategoryId(null)}
            className={`px-5 py-2 rounded-full text-xs transition-all whitespace-nowrap border ${
              selectedRecentCategoryId === null
                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                : 'bg-[var(--studio-card)] border-[var(--studio-card-border)] text-[var(--studio-text-muted)] hover:border-blue-500/50'
            }`}
          >
            All New Arrivals
          </button>
          
          {/* Main Categories only (Level 1 or root) */}
          {dbCategories.filter(c => c.level === 1 || !c.parentId || c.id === womenRootId).slice(0, 8).map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setSelectedRecentCategoryId(cat.id)}
              className={`px-5 py-2 rounded-full text-xs transition-all whitespace-nowrap border ${
                selectedRecentCategoryId === cat.id
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                  : 'bg-[var(--studio-card)] border-[var(--studio-card-border)] text-[var(--studio-text-muted)] hover:border-blue-500/50'
              }`}
            >
              {cat.nameAr || cat.name || cat.nameEn}
            </button>
          ))}
        </div>
        
        {isDbLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="aspect-[2/3] bg-zinc-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {recentlyAddedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
            {recentlyAddedProducts.length === 0 && (
              <div className="col-span-full py-10 text-center text-zinc-500">
                No new products found in this category.
              </div>
            )}
          </div>
        )}
      </section>



      {/* 5. Women's Exclusive Releases */}
      <section id="exclusive-women" className="mb-16">
        <SectionHeader 
          title={(womenRoot?.nameAr || "Women's") + " - Exclusive Releases"} 
          onViewAll={() => navigate('/collections')}
        />
        
        <div className="flex flex-wrap gap-2 mb-3 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => setSelectedWomenCategoryId(null)}
            className={`px-5 py-2 rounded-full text-xs transition-all whitespace-nowrap border ${
              selectedWomenCategoryId === null
                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                : 'bg-[var(--studio-card)] border-[var(--studio-card-border)] text-[var(--studio-text-muted)] hover:border-blue-500/50'
            }`}
          >
            All Collections
          </button>
          {womenSubCategories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setSelectedWomenCategoryId(cat.id)}
              className={`px-5 py-2 rounded-full text-xs transition-all whitespace-nowrap border ${
                selectedWomenCategoryId === cat.id
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                  : 'bg-[var(--studio-card)] border-[var(--studio-card-border)] text-[var(--studio-text-muted)] hover:border-blue-500/50'
              }`}
            >
              {cat.nameAr || cat.name || cat.nameEn}
            </button>
          ))}
        </div>

        {isDbLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
               <div key={i} className="aspect-[3/4.5] bg-zinc-100 rounded-[2rem] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {womenExclusiveProducts.slice(0, 30).map((product: any) => (
              <ProductCard key={product.id} product={product} showBadge={true} variant="women" />
            ))}
          </div>
        )}
      </section>

      {/* 6. Men's Exclusive Releases */}
      <section id="exclusive-men" className="mb-16">
        <SectionHeader 
          title={(menRoot?.nameAr || "Men's") + " - Exclusive Releases"} 
          onViewAll={() => navigate('/collections')}
        />
        
        <div className="flex flex-wrap gap-2 mb-3 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => setSelectedMenCategoryId(null)}
            className={`px-5 py-2 rounded-full text-xs transition-all whitespace-nowrap border ${
              selectedMenCategoryId === null
                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                : 'bg-[var(--studio-card)] border-[var(--studio-card-border)] text-[var(--studio-text-muted)] hover:border-blue-500/50'
            }`}
          >
            All Collections
          </button>
          {menSubCategories.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setSelectedMenCategoryId(cat.id)}
              className={`px-5 py-2 rounded-full text-xs transition-all whitespace-nowrap border ${
                selectedMenCategoryId === cat.id
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                  : 'bg-[var(--studio-card)] border-[var(--studio-card-border)] text-[var(--studio-text-muted)] hover:border-blue-500/50'
              }`}
            >
              {cat.nameAr || cat.name || cat.nameEn}
            </button>
          ))}
        </div>

        {isDbLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
               <div key={i} className="aspect-[2/3] bg-zinc-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {menExclusiveProducts.slice(0, 30).map((product: any) => (
              <ProductCard key={product.id} product={product} showBadge={true} variant="men" />
            ))}
          </div>
        )}
      </section>

      {/* Promo Row */}
      <DiscoverDesignerPromo tiles={[]} />
    </div>
  );
}
