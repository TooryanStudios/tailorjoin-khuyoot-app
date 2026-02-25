import React from 'react';
import { ArrowRight, MoreVertical, Play, Headphones, MapPin, Clock, Star, MessageCircle, ShoppingBag, CheckCircle2, Share2, Heart, Bookmark } from 'lucide-react';
import { Tailor, Product, Review } from '../../../types';
import { StableImage } from '../../../components/StableImage';
import { getSpecializationLabel } from '../../../utils/specializationHelper';
import { ViewMode, TailorProductCard } from './TailorProductCard';

interface MobileTailorProfileProps {
    tailor: Tailor;
    products: Product[];
    reviews: Review[];
    activeTab: 'products' | 'portfolio' | 'reviews';
    setActiveTab: (tab: 'products' | 'portfolio' | 'reviews') => void;
    onBack: () => void;
    onContact: () => void;
    user: any;
    shopReviews: Review[];
    loadingProducts: boolean;
    viewMode: ViewMode;
    toggleLike?: (id: string, count: number) => void;
    onProductClick: (id: string) => void;
    hasMore?: boolean;
    onLoadMore?: () => void;
}

export const MobileTailorProfile: React.FC<MobileTailorProfileProps> = ({
    tailor,
    products,
    shopReviews,
    activeTab,
    setActiveTab,
    onBack,
    onContact,
    user,
    viewMode,
    toggleLike,
    onProductClick,
    hasMore,
    onLoadMore
}) => {
    // Helper to format OMR
    const formatOmr = (price: number | string | undefined): string => {
        if (!price) return '0.000';
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        return numPrice.toFixed(3);
    };

    // Background Image: Prefer the first product image, fallback to tailor cover/profile
    const bgImage = (products.length > 0 && products[0].image) ? products[0].image : (tailor.coverImage || tailor.image);
    
    // Main Visual: Keep user profile/cover as the sharp "card" image if available, else product
    const mainImage = tailor.image || tailor.coverImage || (products.length > 0 ? products[0].image : null);

    return (
        <div className="min-h-screen bg-[#ededed] pb-20 relative font-['Cairo'] text-right" dir="rtl">
            
            {/* Standard Profile Header (Matches App Theme) */}
            <div className="bg-white pb-4 mb-4 shadow-sm border-b border-zinc-200">
                
                {/* Cover Image / Banner */}
                <div className="relative h-32 md:h-48 w-full overflow-hidden bg-zinc-100">
                    {tailor.coverImage ? (
                        <StableImage 
                            src={tailor.coverImage} 
                            alt="Cover" 
                            aspectClass="w-full h-full" 
                            className="w-full h-full" 
                            imgClassName="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                             {/* Neutral placeholder */}
                        </div>
                    )}
                    <button 
                        onClick={onBack}
                        className="absolute top-4 right-4 bg-white/90 backdrop-blur text-zinc-700 w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all z-10"
                    >
                        <ArrowRight size={18} />
                    </button>
                </div>

                {/* Profile Info Row */}
                <div className="px-4 flex items-end -mt-10 relative z-10 gap-3">
                    {/* Profile Pic */}
                    <div className="w-20 h-20 rounded-xl bg-white p-1 shadow-md border border-zinc-100">
                        {tailor.image ? (
                            <StableImage 
                                src={tailor.image} 
                                alt={tailor.name} 
                                aspectClass="h-full" 
                                className="w-full h-full rounded-lg overflow-hidden" 
                                imgClassName="object-cover w-full h-full" 
                            />
                        ) : (
                            <div className="w-full h-full bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-300">
                                <ShoppingBag size={24} />
                            </div>
                        )}
                    </div>

                    {/* Basic Info */}
                    <div className="flex-1 pb-1">
                         <div className="flex items-center gap-1">
                            <h1 className="text-xl font-bold text-black leading-tight flex items-center gap-1.5">
                                {tailor.name}
                                {tailor.approvalStatus === 'approved' && (
                                    <CheckCircle2 size={16} className="text-blue-500 fill-blue-50" />
                                )}
                            </h1>
                         </div>
                         <div className="text-xs text-zinc-500 mt-0.5 flex items-center gap-2">
                            <span>{getSpecializationLabel(tailor.specialization)}</span>
                            {tailor.tailorGender && (
                                <span className="text-zinc-400 text-[10px]">{tailor.tailorGender}</span>
                            )}
                         </div>
                    </div>
                </div>

                <div className="px-4 mt-3 flex items-center justify-between">
                     <div className="flex gap-4 text-xs font-medium text-zinc-600">
                        <div className="flex items-center gap-1">
                             <Star size={13} className="text-amber-500 fill-amber-500" />
                             <span className="font-bold text-black">{tailor.rating || 0}</span>
                             <span className="text-zinc-400 font-normal">تقييم</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <MapPin size={13} className="text-zinc-400" />
                            <span>{tailor.location || 'مسقط'}</span>
                             <span className="text-zinc-300">|</span>
                             <Clock size={13} className="text-zinc-400" />
                             <span>يفتح: 9:00 ص - 10:00 م</span>
                        </div>
                     </div>
                     
                     <button
                        onClick={onContact}
                        className="bg-[var(--theme-primary)] hover:opacity-90 text-white text-xs font-light px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm transition-colors"
                     >
                         <MessageCircle size={14} />
                         تواصل
                     </button>
                </div>
            </div>

            <div className="px-2">
                {/* Tabs - Underline Style (Matching App) */}
                <div className="bg-white rounded-lg shadow-sm border border-zinc-100 p-1 mb-4 flex">
                    <button 
                        onClick={() => setActiveTab('products')}
                        className={`flex-1 py-2 text-sm font-light text-center rounded-md transition-all ${activeTab === 'products' ? 'bg-[var(--theme-surface-lavender)] text-[var(--theme-primary)]' : 'text-zinc-500 hover:text-black hover:bg-zinc-50'}`}
                    >
                        الموديلات
                    </button>
                     <button 
                        onClick={() => setActiveTab('reviews')}
                        className={`flex-1 py-2 text-sm font-light text-center rounded-md transition-all ${activeTab === 'reviews' ? 'bg-[var(--theme-surface-lavender)] text-[var(--theme-primary)]' : 'text-zinc-500 hover:text-black hover:bg-zinc-50'}`}
                    >
                        التقييمات
                    </button>
                    <button 
                        onClick={() => setActiveTab('portfolio')}
                        className={`flex-1 py-2 text-sm font-light text-center rounded-md transition-all ${activeTab === 'portfolio' ? 'bg-[var(--theme-surface-lavender)] text-[var(--theme-primary)]' : 'text-zinc-500 hover:text-black hover:bg-zinc-50'}`}
                    >
                         نبذة
                    </button>
                </div>

                {/* Content Area */}
                <div className="w-full">
                     {activeTab === 'portfolio' && (
                         <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                             {/* Description with Drop Cap */}
                             {tailor.bio ? (
                                 <div className="prose dark:prose-invert text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
                                     <span className="float-right text-4xl font-serif font-bold text-slate-900 dark:text-white leading-[0.8] ml-2 mt-1">
                                         {tailor.bio.charAt(0)}
                                     </span>
                                     {tailor.bio.slice(1)}
                                 </div>
                             ) : (
                                 <p className="text-center text-slate-400 py-10">لا توجد نبذة تعريفية</p>
                             )}
                             
                             {/* Tags/Chips */}
                             <div className="flex flex-wrap gap-2 justify-center">
                                 {tailor.tailorGender && (
                                     <span className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                                         {tailor.tailorGender === 'male' ? 'خياطة رجالية' : 'خياطة نسائية'}
                                     </span>
                                 )}
                                 <span className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                                     {getSpecializationLabel(tailor.specialization)}
                                 </span>
                                 <span className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                                     {tailor.location || 'مسقط'}
                                 </span>
                             </div>
                         </div>
                     )}

                     {activeTab === 'products' && (
                         <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                             {products.length === 0 ? (
                                 <div className="text-center py-10 text-slate-400">
                                     لا توجد موديلات
                                 </div>
                             ) : (
                                 <>
                                     {/* Category: All Models */}
                                     <div className="space-y-4">
                                         <h2 className="text-sm font-bold text-slate-900 dark:text-white px-1">
                                             جميع الموديلات
                                         </h2>
                                         <div className="bg-[#52554e] text-white rounded-[1.5rem] px-4 py-6 relative overflow-hidden mb-4 mx-1">
                                             {/* Subtle Pattern Overlay */}
                                             <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                                             
                                             <div className="relative z-10 grid grid-cols-2 gap-3">
                                                 {products.map((product, index) => (
                                                     <TailorProductCard
                                                         key={product.id}
                                                         product={product}
                                                         viewMode="grid"
                                                         onClick={() => onProductClick(product.id)}
                                                         onToggleLike={toggleLike}
                                                     />
                                                 ))}
                                             </div>
                                         </div>

                                         {hasMore && (
                                            <div className="flex justify-center pb-8 pt-2">
                                                <button 
                                                    onClick={onLoadMore}
                                                    className="px-6 py-2 bg-white text-zinc-700 border border-zinc-200 rounded-full text-sm font-medium hover:bg-zinc-50 transition-colors shadow-sm"
                                                >
                                                    عرض المزيد
                                                </button>
                                            </div>
                                         )}
                                     </div>
                                 </>
                             )}
                         </div>
                     )}
                     
                     {/* Simplified Reviews for Mobile */}
                     {activeTab === 'reviews' && (
                         <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             {shopReviews.length > 0 ? shopReviews.map(review => (
                                 <div key={review.id} className="bg-white dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                                     <div className="flex justify-between items-start mb-2">
                                         <span className="font-bold text-sm">{review.userName}</span>
                                         <div className="flex text-amber-500" dir="ltr">
                                             <Star size={12} fill="currentColor" />
                                             <span className="ml-1 text-xs">{review.rating}</span>
                                         </div>
                                     </div>
                                     <p className="text-xs text-slate-600 dark:text-slate-400">{review.comment}</p>
                                 </div>
                             )) : (
                                  <div className="text-center py-10 text-slate-400">لا توجد تقييمات</div>
                             )}
                         </div>
                     )}
                </div>
            </div>
        </div>
    );
};
