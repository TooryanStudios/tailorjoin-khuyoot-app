
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, Star, MessageCircle, Clock, CheckCircle2, ShoppingBag, ImageIcon, User, RefreshCw, Grid3x3, LayoutGrid, List } from 'lucide-react';
import { Tailor, Product } from '../types';
import { getTailorById, getProducts } from '../services/mockService';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/Button';
import { useApp } from '../context/AppContext';
import { getSpecializationLabel } from '../utils/specializationHelper';
import { StableImage } from '../src/components/StableImage';

type ViewMode = 'grid' | 'compact' | 'list';

export const TailorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, toggleAuthModal } = useApp();
  const [tailor, setTailor] = useState<Tailor | null>(null);
  const [tailorProducts, setTailorProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'portfolio' | 'reviews'>('products');
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const handleContactClick = () => {
    if (!user) {
      toggleAuthModal(true);
    } else {
      // فتح نافذة المحادثة أو الانتقال لصفحة الرسائل
      alert('سيتم فتح المحادثة قريباً');
    }
  };

  const loadProducts = async () => {
    if (id) {
      const products = await getProducts(undefined, id);
      setTailorProducts(products);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setTimeout(() => setRefreshing(false), 500);
  };

  useEffect(() => {
    if (id) {
      getTailorById(id).then(setTailor);
      loadProducts();
    }
  }, [id]);

  if (!tailor) return <div className="p-10 text-center">جاري التحميل...</div>;

  return (
    <div className="pb-24">
      {/* Cover Image */}
         <div className="h-48 md:h-64 bg-slate-200 dark:bg-slate-800 relative">
             <StableImage
                src={tailor.coverImage || 'https://picsum.photos/1000/400?blur=2'}
                alt="Cover"
                aspectClass="h-full"
             />
         <div className="absolute inset-0 bg-black/30"></div>
         <button 
           onClick={() => navigate(-1)}
           className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
         >
           <ArrowRight size={20} />
         </button>
      </div>

      {/* Profile Header */}
      <div className="px-4 md:px-8 max-w-5xl mx-auto -mt-16 relative">
         <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-6 items-start md:items-end">
            <div className="w-32 h-32 rounded-2xl bg-slate-100 p-1 bg-white shadow-lg -mt-16 md:-mt-20 overflow-hidden">
               <StableImage src={tailor.image} alt={tailor.name} aspectClass="h-full" className="rounded-xl" />
            </div>
            
            <div className="flex-1">
               <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                       {tailor.name}
                       {tailor.approvalStatus === 'approved' && <CheckCircle2 size={20} className="text-blue-500" />}
                    </h1>
                    <div className="flex items-center gap-2 text-sm">
                      <p className="text-slate-500 dark:text-slate-400">{getSpecializationLabel(tailor.specialization)}</p>
                      {tailor.tailorGender && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          tailor.tailorGender === 'male' 
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' 
                            : 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400'
                        }`}>
                          {tailor.tailorGender === 'male' ? '👔 رجالي' : '👗 نسائي'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="text-center">
                        <p className="font-bold text-slate-900 dark:text-white">{tailor.followers}</p>
                        <p className="text-[10px] text-slate-500">متابع</p>
                     </div>
                     <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                     <div className="text-center">
                        <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1 justify-center">
                           {tailor.rating} <Star size={12} className="text-amber-500 fill-amber-500" />
                        </p>
                        <p className="text-[10px] text-slate-500">تقييم</p>
                     </div>
                  </div>
               </div>
               
               <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><MapPin size={16} /> {tailor.location}</span>
                  <span className="flex items-center gap-1"><Clock size={16} /> يفتح: 9:00 ص - 10:00 م</span>
               </div>
            </div>

            <Button 
              onClick={handleContactClick}
              className="shrink-0 flex items-center gap-2"
            >
               <MessageCircle size={18} /> {user ? 'تواصل' : 'سجّل للتواصل'}
            </Button>
         </div>
         
         {/* Bio */}
         {tailor.bio && (
            <div className="mt-6 px-2">
               <p className="text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">{tailor.bio}</p>
            </div>
         )}

         {/* Tabs */}
         <div className="mt-8 border-b border-slate-200 dark:border-slate-700 flex gap-6 items-center justify-between">
            <div className="flex gap-6">
               <button 
                  onClick={() => setActiveTab('products')}
                  className={`pb-3 font-bold text-sm transition-colors relative ${activeTab === 'products' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
               >
                  الموديلات
                  {activeTab === 'products' && <div className="absolute bottom-0 right-0 w-full h-0.5 bg-blue-600"></div>}
               </button>
               <button 
                  onClick={() => setActiveTab('portfolio')}
                  className={`pb-3 font-bold text-sm transition-colors relative ${activeTab === 'portfolio' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
               >
                  معرض الأعمال
                  {activeTab === 'portfolio' && <div className="absolute bottom-0 right-0 w-full h-0.5 bg-blue-600"></div>}
               </button>
               <button 
                  onClick={() => setActiveTab('reviews')}
                  className={`pb-3 font-bold text-sm transition-colors relative ${activeTab === 'reviews' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
               >
                  التقييمات
                  {activeTab === 'reviews' && <div className="absolute bottom-0 right-0 w-full h-0.5 bg-blue-600"></div>}
               </button>
            </div>
            
            {activeTab === 'products' && (
               <div className="flex items-center gap-2">
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
                  
                  <button
                     onClick={handleRefresh}
                     disabled={refreshing}
                     className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                     title="تحديث المنتجات"
                  >
                     <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                     <span>تحديث</span>
                  </button>
               </div>
            )}
         </div>

         {/* Content */}
         <div className="mt-6">
            {activeTab === 'products' && (
               <>
                  {tailorProducts.length > 0 ? (
                     <>
                        {viewMode === 'grid' && (
                           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {tailorProducts.map(p => (
                                 <div key={p.id} onClick={() => navigate(`/product/${p.id}`)} className="cursor-pointer">
                                    <ProductCard product={p} viewMode="grid" />
                                 </div>
                              ))}
                           </div>
                        )}

                        {viewMode === 'compact' && (
                           <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                              {tailorProducts.map(p => (
                                 <div key={p.id} onClick={() => navigate(`/product/${p.id}`)} className="cursor-pointer">
                                    <ProductCard product={p} viewMode="compact" />
                                 </div>
                              ))}
                           </div>
                        )}

                        {viewMode === 'list' && (
                           <div className="space-y-4">
                              {tailorProducts.map(p => (
                                 <div key={p.id} onClick={() => navigate(`/product/${p.id}`)} className="cursor-pointer">
                                    <ProductCard product={p} viewMode="list" />
                                 </div>
                              ))}
                           </div>
                        )}
                     </>
                  ) : (
                     <div className="py-10 text-center text-slate-400">
                        <ShoppingBag size={48} className="mx-auto mb-2 opacity-30" />
                        <p>لا توجد موديلات معروضة حالياً</p>
                     </div>
                  )}
               </>
            )}

            {activeTab === 'portfolio' && (
               <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {tailor.portfolio && tailor.portfolio.length > 0 ? (
                     tailor.portfolio.map((img, idx) => (
                                    <StableImage
                                       key={idx}
                                       src={img}
                                       alt={`Work ${idx}`}
                                       aspectClass="aspect-[3/4]"
                                       className="rounded-xl"
                                       imgClassName="hover:scale-105 duration-500"
                                    />
                     ))
                  ) : (
                     <div className="col-span-full py-10 text-center text-slate-400">
                        <ImageIcon size={48} className="mx-auto mb-2 opacity-30" />
                        <p>لا توجد صور في المعرض</p>
                     </div>
                  )}
               </div>
            )}

            {activeTab === 'reviews' && (
               <div className="space-y-4 max-w-2xl">
                  {tailor.reviews && tailor.reviews.length > 0 ? (
                     tailor.reviews.map(review => (
                        <div key={review.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                           <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                 <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                    <User size={14} className="text-slate-500" />
                                 </div>
                                 <span className="font-bold text-sm text-slate-900 dark:text-white">{review.userName}</span>
                              </div>
                              <div className="flex text-amber-500 text-xs">
                                 {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={12} fill={i < review.rating ? "currentColor" : "none"} className={i >= review.rating ? "text-slate-300" : ""} />
                                 ))}
                              </div>
                           </div>
                           <p className="text-slate-600 dark:text-slate-300 text-sm">{review.comment}</p>
                           <p className="text-xs text-slate-400 mt-2">{review.date}</p>
                        </div>
                     ))
                  ) : (
                     <div className="text-center py-10 text-slate-400">لا توجد تقييمات بعد</div>
                  )}
               </div>
            )}
         </div>

      </div>
    </div>
  );
};
