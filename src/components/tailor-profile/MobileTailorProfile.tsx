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
    onProductClick
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
        <div className="min-h-screen bg-white dark:bg-[#0B0A13] pb-20 relative scrollbar-hide">
            {/* Immersive Hero Section */}
            <div className="relative w-full h-[55vh]">
                {/* Hero Background Image */}
                {bgImage ? (
                    <StableImage 
                        src={bgImage} 
                        alt="Background" 
                        aspectClass="w-full h-full" 
                        className="w-full h-full" 
                        imgClassName="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                        <ShoppingBag size={48} className="text-slate-400" />
                    </div>
                )}
                
                {/* Gradient Overlay - Starts transparent, goes via colored/transparent to solid page color */}
                <div className="absolute inset-x-0 bottom-0 h-[60%] bg-gradient-to-t from-white via-white/80 to-transparent dark:from-[#0B0A13] dark:via-[#0B0A13]/90 dark:to-transparent pointer-events-none" />

                {/* Hero Content - Sitting on the gradient */}
                <div className="absolute bottom-0 left-0 right-0 px-6 pb-8 flex flex-col items-center text-center z-10 animate-in slide-in-from-bottom-6 duration-700 delay-100">
                    
                    {/* Cinematic Title - Styled like 'A Magical Journey' */}
                    <div className="flex flex-col items-center justify-center mb-3 relative">
                        {tailor.approvalStatus === 'approved' && (
                            <div className="absolute -top-6 text-blue-500 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300" title="موثق">
                                <CheckCircle2 size={20} className="fill-blue-500/10" />
                            </div>
                        )}
                        <h1 className="text-6xl font-serif font-black text-slate-900 dark:text-white leading-[0.85] drop-shadow-lg tracking-tighter max-w-[10ch] mx-auto text-center mt-2">
                            {tailor.name}
                        </h1>
                    </div>
                    
                    {/* Tags Row - Reverted Font, No Italic */}
                    <div className="flex flex-wrap justify-center items-center gap-3 mb-2 text-slate-700 dark:text-slate-300 text-sm font-medium tracking-wide">
                        {/* Tiny Avatar integrated as a visual anchor */}
                        {mainImage && (
                            <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200 dark:border-white/20 shadow-sm opacity-90">
                                <StableImage 
                                    src={mainImage} 
                                    alt={tailor.name} 
                                    aspectClass="h-full" 
                                    className="h-full w-full" 
                                    imgClassName="object-cover w-full h-full" 
                                />
                            </div>
                        )}

                        <span>{getSpecializationLabel(tailor.specialization)}</span>
                        
                        <span className="opacity-40">•</span>
                        
                        <span>{tailor.location || 'مسقط'}</span>
                    </div>
                </div>
            </div>

            <div className="relative px-6 flex flex-col items-center">
                {/* Stats Info Bar - Minimal Capsul, Outlined Icons, Less Rounded, Smaller, No Border */}
                <div className="w-full max-w-sm bg-slate-900/5 dark:bg-white/5 backdrop-blur-md rounded-lg px-4 py-2 shadow-sm flex justify-between items-center mb-6 -mt-4 relative z-20">
                    
                    {/* Item 1: Models */}
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <ShoppingBag size={14} className="stroke-1" />
                        <span className="text-xs font-medium">{products.length} موديل</span>
                    </div>

                    {/* Separator */}
                    <div className="w-px h-3 bg-slate-400/30" />

                    {/* Item 2: Rating */}
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                         <Star size={14} className="stroke-1" />
                         <span className="text-xs font-medium">{tailor.rating} تقييم</span>
                    </div>

                    {/* Separator */}
                    <div className="w-px h-3 bg-slate-400/30" />

                    {/* Item 3: Followers */}
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                         <Heart size={14} className="stroke-1" />
                         <span className="text-xs font-medium">{tailor.followers || 0} متابع</span>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex w-full border-b border-slate-200 dark:border-white/10 mb-2">
                    <button 
                        onClick={() => setActiveTab('products')}
                        className={`flex-1 pb-3 text-sm font-bold text-center relative transition-colors ${activeTab === 'products' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`}
                    >
                        الموديلات
                        {activeTab === 'products' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 dark:bg-purple-400 rounded-t-full" />}
                    </button>
                    <button 
                        onClick={() => setActiveTab('portfolio')}
                        className={`flex-1 pb-3 text-sm font-bold text-center relative transition-colors ${activeTab === 'portfolio' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`}
                    >
                         نبذة
                        {activeTab === 'portfolio' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 dark:bg-purple-400 rounded-t-full" />}
                    </button>
                     <button 
                        onClick={() => setActiveTab('reviews')}
                        className={`flex-1 pb-3 text-sm font-bold text-center relative transition-colors ${activeTab === 'reviews' ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`}
                    >
                        التقييمات
                        {activeTab === 'reviews' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 dark:bg-purple-400 rounded-t-full" />}
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
                                     <div className="space-y-3">
                                         <h2 className="text-xs font-normal text-slate-900 dark:text-white px-1">
                                             جميع الموديلات
                                         </h2>
                                         <div className="relative -mx-6">
                                             <div className="flex gap-1.5 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-6 pb-2">
                                                 {products.map((product, index) => (
                                                     <div 
                                                         key={product.id}
                                                         className="flex-shrink-0 w-[135px] snap-start"
                                                         onClick={() => onProductClick(product.id)}
                                                     >
                                                         <div className="relative aspect-[2/3.5] rounded overflow-hidden group cursor-pointer">
                                                             <StableImage
                                                                 src={product.image}
                                                                 alt={product.name}
                                                                 aspectClass="w-full h-full"
                                                                 className="w-full h-full"
                                                                 imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                             />
                                                             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                                                             
                                                             {/* Top 10 Badge - First 2 cards */}
                                                             {index < 2 && (
                                                                 <div className="absolute top-2 left-2 bg-red-600 text-white text-[8px] font-bold px-1 py-0.5 rounded leading-tight flex flex-col items-center">
                                                                     <span>Top</span>
                                                                     <span>10</span>
                                                                 </div>
                                                             )}

                                                             {/* Action Icons - Top Right */}
                                                             <div className="absolute top-2 right-2 flex gap-1.5">
                                                                 <button 
                                                                     className="text-white hover:text-white/80 transition-colors"
                                                                     onClick={(e) => {
                                                                         e.stopPropagation();
                                                                         toggleLike && toggleLike(product.id, product.likeCount || 0);
                                                                     }}
                                                                 >
                                                                     <Heart size={14} className="stroke-2" />
                                                                 </button>
                                                                 <button 
                                                                     className="text-white hover:text-white/80 transition-colors"
                                                                     onClick={(e) => e.stopPropagation()}
                                                                 >
                                                                     <Bookmark size={14} className="stroke-2" />
                                                                 </button>
                                                             </div>

                                                             {/* Title & Price - Bottom */}
                                                             <div className="absolute bottom-0 left-0 right-0 p-3 text-center">
                                                                 <h3 className="text-white font-bold text-base line-clamp-2 mb-1">
                                                                     {product.name}
                                                                 </h3>
                                                                 <p className="text-white/80 text-[11px] font-medium">
                                                                     {formatOmr(product.price)} ر.ع
                                                                 </p>
                                                             </div>
                                                         </div>
                                                     </div>
                                                 ))}
                                             </div>
                                         </div>
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
