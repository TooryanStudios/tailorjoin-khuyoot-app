import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Tag, ShoppingBag, ChevronDown } from 'lucide-react';
import { Product, Tailor } from '../types';
import { getProducts, MOCK_TAILORS } from '../services/mockService';
import { MontHeader } from '../src/components/MontHeader';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

// ----------------------------------------------------------------------------
// CONSTANTS & HELPERS
// ----------------------------------------------------------------------------
const GENDERS = [
  { id: 'women', label: 'النساء' },
  { id: 'men', label: 'الرجال' },
];

// Default categories as fallback
const DEFAULT_CATEGORIES = [
  { id: 'all', label: 'الكل' },
  { id: 'dishdasha', label: 'دشداشة' },
  { id: 'abaya', label: 'عبايات' },
  { id: 'jacket', label: 'جاكيتات' },
  { id: 'dress', label: 'فساتين' },
  { id: 'thobe', label: 'ثوب' },
];

// ----------------------------------------------------------------------------
// CATEGORY DEFINITIONS
// ----------------------------------------------------------------------------
const MALE_KEYWORDS = ['dishdasha', 'thobe', 'kandora', 'men', 'male', 'دشداشة', 'ثوب'];
const FEMALE_KEYWORDS = ['abaya', 'dress', 'jalabiya', 'kaftan', 'women', 'female', 'عبaye', 'عبايات', 'فساتين'];

const INITIAL_VISIBLE_COUNT = 12; 
const LOAD_MORE_INCREMENT = 12;

// ----------------------------------------------------------------------------
// PRODUCT CARD
// ----------------------------------------------------------------------------
const ProductCard = React.memo(({ product }: { product: Product }) => {
  const navigate = useNavigate();
  // Include product.imageUrl fallback
  const allImages = product.images || (product.image ? [product.image] : product.imageUrl ? [product.imageUrl] : []);
  // Filter out non-http images (relative paths from bad uploads)
  const images = allImages.filter(img => img && (img.startsWith('http') || img.startsWith('blob:')));
  
  const [index, setIndex] = React.useState(0);
  const [imgError, setImgError] = React.useState(false);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleClick = React.useCallback(() => {
    navigate(`/product/${product.id}`);
  }, [navigate, product.id]);

  const startSlideshow = () => {
    if (images.length > 1 && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        setIndex((prev) => (prev + 1) % images.length);
      }, 1200);
    }
  };

  const stopSlideshow = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIndex(0);
  };

  if (!product) return null;

  return (
    <div className="cursor-pointer group h-full flex flex-col" onClick={handleClick}>
      <div 
        className="relative aspect-[3/4] bg-zinc-800 rounded-xl overflow-hidden mb-3 border border-white/5 shadow-sm hover:shadow-xl transition-all duration-500"
        onMouseEnter={startSlideshow}
        onMouseLeave={stopSlideshow}
      >
        {images.length > 0 && !imgError ? (
          images.map((img: string, i: number) => (
            <img 
              key={`${product.id}-${i}`}
              src={img} 
              className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-700 ${
                i === index ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
              }`}
              alt={product.name} 
              loading="lazy"
              decoding="async"
              fetchPriority={i === 0 ? "high" : "low"}
              onError={(e) => {
                console.error('Image load failed:', img);
                // If the main image fails, we might want to hide the whole card image or show placeholder
                if (i === 0) setImgError(true);
              }}
            />
          ))
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-900 border border-white/10">
            <Tag className="w-8 h-8 text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
        <button 
            className="absolute bottom-4 right-4 bg-white text-black w-10 h-10 rounded-full flex items-center justify-center translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10 shadow-xl" 
            onClick={(e) => { e.stopPropagation(); }}
            aria-label="Add to cart"
        >
          <ShoppingBag size={16} />
        </button>
      </div>
      <div className="px-2 mt-auto text-right" dir="rtl">
        <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider mb-1 line-clamp-1">
            {product.tailorName || 'مجموعة خيوط'}
        </p>
        <h4 className="text-sm font-bold text-black mb-1 line-clamp-1">{product.name}</h4>
        
        {/* Debug Info */}
        <div className="space-y-0.5 mb-1">
          {product.tailorId && (
            <div className="text-slate-400 text-[8px] font-mono">
              ID: {product.tailorId}
            </div>
          )}
          {product.category && (
            <div className="text-orange-500 text-[8px] font-mono">
              Cat: {product.category}
            </div>
          )}
          {product.categoryId && (
            <div className="text-purple-500 text-[8px] font-mono">
              CatID: {product.categoryId}
            </div>
          )}
        </div>

        <div className="text-xs text-zinc-400 font-medium flex items-center gap-1">
          <span>يبدأ من {product.price} ر.ع</span>
        </div>
      </div>
    </div>
  );
});

// ----------------------------------------------------------------------------
// FILTER BAR COMPONENT
// ----------------------------------------------------------------------------
const FilterBar = ({ 
  categories, 
  activeCategory, 
  onCategoryChange
}: any) => {
  return (
    <div className="flex items-center justify-center gap-4 w-full mb-8">
      {/* Category Tabs (Scrollable) */}
      <div className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
        <div className="flex gap-2 px-1">
          {categories.map((cat: any) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={`
                  whitespace-nowrap px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all border
                  ${isActive 
                    ? 'bg-black text-white border-black shadow-sm' 
                    : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400 hover:text-black'
                  }
                `}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// MAIN PAGE COMPONENT
// ----------------------------------------------------------------------------
export const ProductList = () => {
  const navigate = useNavigate();
  const { gender = 'women', category = 'all' } = useParams<{ gender: string; category: string }>();
  
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [tailorsMap, setTailorsMap] = useState<Record<string, Tailor>>({});
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  const [categories, setCategories] = useState<Array<{ id: string; label: string }>>([{ id: 'all', label: 'الكل' }]);
  const [categoryMap, setCategoryMap] = useState<Record<string, {id: string, nameAr: string, nameEn: string, slug: string}>>({});
  const [landingConfig, setLandingConfig] = useState<any>(null);

  // Load Landing Config to get selected filters
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const docRef = doc(db, 'site_config', 'landing_page');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setLandingConfig(docSnap.data());
        }
      } catch (err) {
        console.error('Error loading landing config:', err);
      }
    };
    loadConfig();
  }, []);

  // 1. Fetch Categories, Tailors & Products Logic
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // A. Fetch Level 2 Categories from productCategories collection (filtered by gender)
        try {
          const categoriesRef = collection(db, 'productCategories');
          const categoriesSnapshot = await getDocs(categoriesRef);
          const allDbCategories = categoriesSnapshot.docs.map(doc => ({
            id: doc.id,
            nameAr: doc.data().nameAr,
            nameEn: doc.data().nameEn,
            slug: doc.data().slug,
            level: doc.data().level,
            gender: doc.data().gender,
            isActive: doc.data().isActive
          }));
          
          // Determine current gender for filtering
          const currentGender = gender === 'men' ? 'male' : 'female';
          const genderKey = gender === 'men' ? 'male' : 'female';
          
          // Get allowed filters from config
          const allowedFilterIds = landingConfig?.[genderKey]?.productFilterCategories || [];
          
          // Filter categories by:
          // 1. Level 2 only
          // 2. Active categories
          // 3. Gender matches exactly
          // 4. If config has specific filters selected, only show those
          const level2Categories = allDbCategories
            .filter(cat => {
              if (!cat.isActive) return false;
              if (cat.level !== 2) return false;
              if (cat.gender !== currentGender) return false;
              
              // If we have specific filters configured, use them
              if (allowedFilterIds.length > 0) {
                return allowedFilterIds.includes(cat.id);
              }
              
              return true;
            })
            .map(cat => ({
              id: cat.slug || cat.id,
              label: cat.nameAr
            }));
          
          // Build category map for filtering (map both slug and ID to category data)
          const catMap: Record<string, {id: string, nameAr: string, nameEn: string, slug: string}> = {};
          allDbCategories.forEach(cat => {
            const data = { id: cat.id, nameAr: cat.nameAr, nameEn: cat.nameEn, slug: cat.slug };
            catMap[cat.id] = data; // Map by document ID
            if (cat.slug) catMap[cat.slug] = data; // Also map by slug
            if (cat.nameEn) catMap[cat.nameEn.toLowerCase()] = data; // Also map by English name
          });
          setCategoryMap(catMap);
          
          if (level2Categories.length > 0) {
            // Add "All" option at the beginning
            setCategories([{ id: 'all', label: 'الكل' }, ...level2Categories]);
          } else {
            // Fallback to defaults if no level 2 categories found
            setCategories(DEFAULT_CATEGORIES);
          }
        } catch (error) {
          console.warn('Could not fetch categories from database, using defaults', error);
          setCategories(DEFAULT_CATEGORIES);
        }

        // B. Fetch Shop/Tailor data for names and specialization mapping
        let tailorsList: Tailor[] = [];
        try {
           const usersRef = collection(db, 'users');
           // Fetch ALL approved users who are shops (tailors, boutiques, fabric stores, etc.)
           const q = query(usersRef, where('approvalStatus', '==', 'approved'));
           const snapshot = await getDocs(q);
           
           tailorsList = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Tailor))
            .filter(user => {
               // Include if role or type is any valid shop type
               const role = user.role;
               const type = (user as any).type || (user as any).shopType;
               const shopTypes = ['tailor', 'boutique', 'shop', 'fabric_store'];
               return shopTypes.includes(role) || shopTypes.includes(type);
            });
        } catch (err) {
           console.error('❌ Could not fetch shops from Firebase:', err);
        }

        // Create Map for quick lookup: tailorId -> Tailor Object
        const tMap: Record<string, Tailor> = {};
        tailorsList.forEach(t => { tMap[t.id] = t; });
        setTailorsMap(tMap);

        // C. Fetch All Products
        const products = await getProducts('all');
        
        // D. Enhance products with tailor info from map
        const enhancedProducts = products.map(p => {
          const t = p.tailorId ? tMap[p.tailorId] : null;
          return {
            ...p,
            tailorName: t?.name || t?.shopName || p.tailorName
          };
        });

        setAllProducts(enhancedProducts);

      } catch (error) {
        console.error('Error loading product page data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [gender, landingConfig]); // Re-fetch when gender or config changes

  // 2. Filter Logic (Tailor Specialization + Category)
  const displayedProducts = useMemo(() => {
    let filtered = allProducts;

    // Filter by Gender (based on tailor specialization)
    if (gender === 'men') {
       filtered = filtered.filter(p => {
          const tailor = p.tailorId ? tailorsMap[p.tailorId] : null;
          if (!tailor) return false;
          
          const spec = (tailor.specialization || '').toLowerCase();
          const tG = (tailor.tailorGender || '').toLowerCase();
          
          // Show if explicitly male OR general/both OR contains Arabic keyword
          return (
            spec === 'male' || spec === 'males' || spec === 'men' || 
            spec === 'general' || spec === 'both' ||
            tG === 'male' || spec.includes('رجال')
          );
       });
    } else if (gender === 'women') {
       filtered = filtered.filter(p => {
          const tailor = p.tailorId ? tailorsMap[p.tailorId] : null;
          
          if (!tailor) return false;
          
          const spec = (tailor.specialization || '').toLowerCase();
          const tG = (tailor.tailorGender || '').toLowerCase();
          
          // Show if explicitly female OR general/both OR contains Arabic keyword
          return (
            spec === 'female' || spec === 'females' || spec === 'women' || 
            spec === 'general' || spec === 'both' ||
            tG === 'female' || spec.includes('نسائ')
          );
       });
    }

    // 3. Category Filter (only if not "all")
    if (category && category !== 'all') {
      filtered = filtered.filter(p => {
        // Check if product has categoryId that matches
        if (p.categoryId) {
          const catData = categoryMap[p.categoryId];
          if (catData) {
            // Match against slug or ID
            return catData.slug === category || catData.id === category;
          }
        }
        
        // Fallback: check legacy category field
        if (p.category) {
          const catData = categoryMap[p.category] || categoryMap[p.category.toLowerCase()];
          if (catData) {
            return catData.slug === category || catData.id === category;
          }
          // Last resort: direct string match
          return p.category.toLowerCase().includes(category.toLowerCase());
        }
        
        return false;
      });
    }

    return filtered;
  }, [allProducts, gender, category, tailorsMap, categoryMap]);

  // 3. Pagination Logic
  const visibleProducts = useMemo(() => {
    return displayedProducts.slice(0, visibleCount);
  }, [displayedProducts, visibleCount]);

  const hasMore = visibleProducts.length < displayedProducts.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + LOAD_MORE_INCREMENT);
  };

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [gender, category]);

  // Layout Fix: Disable body scroll so inner container handles it
  useEffect(() => {
    const mainElement = document.querySelector('main.flex-1');
    if (mainElement) {
        (mainElement as HTMLElement).style.overflow = 'hidden';
        (mainElement as HTMLElement).style.height = '100vh'; 
    }
    return () => {
        if (mainElement) {
            (mainElement as HTMLElement).style.overflowY = 'auto'; // Original value
            (mainElement as HTMLElement).style.overflowX = 'hidden';
            (mainElement as HTMLElement).style.height = ''; 
        }
    };
  }, []);

  const handleGenderChange = (newGender: string) => {
    navigate(`/products/${newGender}/${category}`);
  };

  const handleCategoryChange = (newCat: string) => {
    navigate(`/products/${gender}/${newCat}`);
  };

  return (
    <div className="h-full flex flex-col font-sans bg-[#ededed]">
      <MontHeader />
      
      {/* Scrollable Content Container */}
      <div 
        className="flex-1 overflow-y-auto pb-24 custom-scrollbar"
        dir="rtl"
      >
        {/* Hero Banner */}
        <section className="px-4 md:px-8 py-3 max-w-[1400px] mx-auto">
          <div className="relative rounded-xl bg-[#63498b] p-6 md:p-8 overflow-hidden min-h-[140px] flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-4">
                {/* Title */}
                <div className="space-y-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    {gender === 'women' ? 'منتجات النساء' : gender === 'men' ? 'منتجات الرجال' : 'المنتجات'}
                  </h1>
                  <p className="text-white/70 text-sm">استكشف أفضل التصاميم من خياطينا المميزين</p>
                </div>

                {/* Stats */}
                <div className="flex gap-2">
                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/10 flex flex-col items-center justify-center min-w-[70px]">
                    <span className="text-xl md:text-2xl font-bold text-white">{displayedProducts.length}</span>
                    <span className="text-[9px] md:text-[10px] text-white/60">منتج متاح</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/10 flex flex-col items-center justify-center min-w-[70px]">
                    <span className="text-xl md:text-2xl font-bold text-white">{Object.keys(tailorsMap).length}</span>
                    <span className="text-[9px] md:text-[10px] text-white/60">خياط</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-[1400px] mx-auto px-2 md:px-8 pt-3">
          
          <FilterBar 
            categories={categories}
            activeCategory={category}
            onCategoryChange={handleCategoryChange}
          />
          
          {loading ? (
             <div className="h-96 flex items-center justify-center">
                 <div className="animate-spin w-6 h-6 border-2 border-black border-t-transparent rounded-full" />
             </div>
          ) : (
             <>
               <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm">
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5">
                 {visibleProducts.length > 0 ? (
                    visibleProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))
                 ) : (
                    <div className="col-span-full py-24 text-center flex flex-col items-center justify-center opacity-40">
                      <ShoppingBag className="w-16 h-16 text-zinc-300 mb-4" />
                      <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">لا توجد منتجات</p>
                    </div>
                 )}
                 </div>

                 {/* Show More Button - Always visible, disabled when no more items */}
                 {visibleProducts.length > 0 && (
                   <div className="mt-8 flex justify-center">
                     <button 
                       onClick={handleLoadMore}
                       disabled={!hasMore}
                       className={`flex items-center gap-2 px-8 py-3 rounded-full text-sm font-normal uppercase transition-all ${
                         hasMore 
                           ? 'bg-black text-white hover:scale-105 cursor-pointer' 
                           : 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
                       }`}
                     >
                       <span>{hasMore ? 'عرض المزيد' : 'لا يوجد المزيد'}</span>
                       {hasMore && <ChevronDown size={16} />}
                     </button>
                   </div>
                 )}
               </div>
             </>
          )}
        </div>
      </div>
    </div>
  );
};
