import React, { useRef, useEffect, useState } from 'react';
import { ArrowRight, MapPin, Star, MessageCircle, Clock, CheckCircle2, ShoppingBag, Grid3x3, LayoutGrid, List, User, RefreshCw, Trash2, Heart } from 'lucide-react';
import { Tailor, Product, Review } from '../../../types';
import { StableImage } from '../../../components/StableImage';
import { Button } from '../../../components/Button';
import { getSpecializationLabel } from '../../../utils/specializationHelper';
import { ViewMode, TailorProductCard } from './TailorProductCard';

interface DesktopTailorProfileProps {
    tailor: Tailor;
    products: Product[];
    reviews: Review[];
    shopReviews: Review[]; // For the reviews tab
    activeTab: 'products' | 'portfolio' | 'reviews';
    setActiveTab: (tab: 'products' | 'portfolio' | 'reviews') => void;
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    onBack: () => void;
    onContact: () => void;
    user: any;
    loadingProducts: boolean;
    refreshing: boolean;
    handleRefresh: () => void;
    onProductClick: (id: string) => void;
    toggleLike?: (id: string, count: number) => void;
    
    // Reviews Handling
    reviewRating: number;
    setReviewRating: (r: number) => void;
    reviewComment: string;
    setReviewComment: (c: string) => void;
    reviewSubmitting: boolean;
    submitReview: () => void;
    handleDeleteReview: (id: string) => void;
    hasReviewed: boolean;
    loadingReviews: boolean;
    termsAccepted: boolean;
    setTermsAccepted: (accepted: boolean) => void;
    hasMore?: boolean;
    onLoadMore?: () => void;
}

export const DesktopTailorProfile: React.FC<DesktopTailorProfileProps> = ({
    tailor,
    products: tailorProducts,
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,
    onBack,
    onContact,
    user,
    loadingProducts,
    refreshing,
    handleRefresh,
    onProductClick,
    toggleLike,
    shopReviews,
    loadingReviews,
    reviewRating,
    setReviewRating,
    reviewComment,
    setReviewComment,
    reviewSubmitting,
    submitReview,
    handleDeleteReview,
    hasReviewed,
    termsAccepted,
    setTermsAccepted,
    hasMore,
    onLoadMore
}) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [reviewHover, setReviewHover] = useState(0);

    return (
        <div className="min-h-screen bg-[#ededed] font-['Cairo'] pb-20 pt-8">
             {/* Profile Header Card */}
             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mb-8">
                {/* Back Button */}
                <button 
                   onClick={onBack}
                   className="mb-4 w-10 h-10 rounded-full bg-white text-zinc-700 flex items-center justify-center hover:bg-zinc-50 shadow-sm transition-all"
                >
                   <ArrowRight size={20} />
                </button>

                 <div className="bg-white rounded-[2rem] shadow-sm border border-black/5 p-6 flex flex-col md:flex-row gap-6 items-center">
                     {/* Avatar */}
                     <div className="w-32 h-32 rounded-[1.5rem] bg-zinc-50 p-1 border border-zinc-100 shrink-0 overflow-hidden">
                        {tailor.image ? (
                           <StableImage 
                                src={tailor.image} 
                                alt={tailor.name} 
                                aspectClass="h-full" 
                                className="rounded-[1.2rem] h-full w-full" 
                                imgClassName="object-cover w-full h-full" 
                            />
                        ) : (
                           <div className="h-full w-full rounded-[1.2rem] bg-zinc-100 flex items-center justify-center text-zinc-300">
                              <ShoppingBag size={32} />
                           </div>
                        )}
                     </div>

                     {/* Info */}
                     <div className="flex-1 w-full">
                        <div className="flex justify-between items-start">
                             <div>
                                <h1 className="text-2xl font-bold text-black flex items-center gap-2">
                                   {tailor.name}
                                   {tailor.approvalStatus === 'approved' && <CheckCircle2 size={20} className="text-[var(--theme-primary)] fill-[var(--theme-surface-lavender)]" />}
                                </h1>
                                <div className="flex items-center gap-3 text-sm mt-2 text-zinc-500">
                                   <span className="bg-zinc-100 px-3 py-1 rounded-full text-zinc-700 font-medium">
                                        {getSpecializationLabel(tailor.specialization)}
                                   </span>
                                   {tailor.tailorGender && (
                                      <span className="flex items-center gap-1">
                                         {tailor.tailorGender === 'male' ? 'خياطة رجالية' : 'خياطة نسائية'}
                                      </span>
                                   )}
                                </div>
                             </div>

                             <div className="flex gap-3">
                                <button className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-red-500 hover:border-red-200 transition-colors">
                                    <Heart size={20} />
                                </button>
                                <button 
                                    onClick={onContact}
                                    className="bg-[var(--theme-primary)] hover:opacity-90 text-white shadow-sm flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-colors"
                                >
                                    <MessageCircle size={18} />
                                    تواصل
                                </button>
                             </div>
                        </div>

                        <div className="mt-6 flex items-center gap-8 border-t border-zinc-100 pt-4">
                             <div className="flex items-center gap-2">
                                 <Star size={18} className="text-amber-500 fill-amber-500" />
                                 <span className="font-bold text-lg text-black">{tailor.rating ? Number(tailor.rating).toFixed(1) : '0'}</span>
                                 <span className="text-zinc-400 text-sm">({tailor.reviewsCount || 0} تقييم)</span>
                             </div>
                             <div className="w-px h-8 bg-zinc-100" />
                             <div className="flex items-center gap-2">
                                 <MapPin size={18} className="text-zinc-400" />
                                 <span className="text-zinc-600">{tailor.location || 'مسقط'}</span>
                             </div>
                             <div className="w-px h-8 bg-zinc-100" />
                             <div className="flex items-center gap-2">
                                 <Clock size={18} className="text-zinc-400" />
                                 <span className="text-zinc-600">يفتح: 9:00 ص - 10:00 م</span>
                             </div>
                        </div>
                     </div>
                 </div>
             </div>

             {/* Tabs & Content */}
             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-[2rem] shadow-sm border border-black/5 min-h-[500px]">
                    
                    {/* Tabs Header */}
                    <div className="border-b border-zinc-100 px-6 flex items-center justify-between">
                        <div className="flex gap-8">
                            <button 
                                onClick={() => setActiveTab('products')}
                                className={`py-4 text-sm font-light border-b-2 transition-colors ${activeTab === 'products' ? 'border-[var(--theme-primary)] text-[var(--theme-primary)]' : 'border-transparent text-zinc-500 hover:text-black'}`}
                            >
                                الموديلات
                            </button>
                            <button 
                                onClick={() => setActiveTab('reviews')}
                                className={`py-4 text-sm font-light border-b-2 transition-colors ${activeTab === 'reviews' ? 'border-[var(--theme-primary)] text-[var(--theme-primary)]' : 'border-transparent text-zinc-500 hover:text-black'}`}
                            >
                                التقييمات ({tailor.reviewsCount || 0} ★)
                            </button>
                            <button 
                                onClick={() => setActiveTab('portfolio')}
                                className={`py-4 text-sm font-light border-b-2 transition-colors ${activeTab === 'portfolio' ? 'border-[var(--theme-primary)] text-[var(--theme-primary)]' : 'border-transparent text-zinc-500 hover:text-black'}`}
                            >
                                نبذة عن الخياط
                            </button>
                        </div>
                        
                        {/* View Toggle (Only for products) */}
                        {activeTab === 'products' && (
                             <div className="flex bg-zinc-100 p-1 rounded-lg">
                                 <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-[var(--theme-primary)]' : 'text-zinc-400 hover:text-zinc-600'}`}
                                 >
                                     <LayoutGrid size={18} />
                                 </button>
                                 <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-[var(--theme-primary)]' : 'text-zinc-400 hover:text-zinc-600'}`}
                                 >
                                     <List size={18} />
                                 </button>
                             </div>
                        )}
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'products' && (
                             <>
                                {loadingProducts ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {[1,2,3,4].map(i => (
                                            <div key={i} className="bg-zinc-50 animate-pulse rounded-xl aspect-[3/4]" />
                                        ))}
                                    </div>
                                ) : tailorProducts.length > 0 ? (
                                    <>
                                        <div className="bg-[#52554e] text-white rounded-[2rem] px-6 py-8 relative overflow-hidden mb-8">
                                            {/* Subtle Pattern Overlay */}
                                            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
                                            
                                            <div className={`relative z-10 grid gap-6 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
                                                {tailorProducts.map((product) => (
                                                    <TailorProductCard
                                                        key={product.id}
                                                        product={product}
                                                        viewMode={viewMode}
                                                        onClick={() => onProductClick(product.id)}
                                                        onToggleLike={toggleLike}
                                                        compact={true} // Cleaner desktop look
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Load More Button */}
                                        {hasMore && (
                                            <div className="mt-10 flex justify-center pb-4">
                                                <button
                                                    onClick={onLoadMore}
                                                    className="bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-400 px-8 py-2.5 rounded-full font-medium transition-all shadow-sm flex items-center gap-2 active:scale-95"
                                                >
                                                    {loadingProducts ? (
                                                        <RefreshCw size={18} className="animate-spin" />
                                                    ) : (
                                                        <ArrowRight size={18} className="rotate-90" />
                                                    )}
                                                    عرض المزيد
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-20 text-zinc-400">
                                        <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
                                        <p>لا توجد موديلات حالياً</p>
                                    </div>
                                )}
                             </>
                        )}
                        
                        {/* Other tabs remain largely the same logic but containerized */}
                        {activeTab === 'portfolio' && (
                            <div className="max-w-3xl mx-auto py-8">
                                <h3 className="text-xl font-bold text-black mb-4">نبذة تعريفية</h3>
                                <div className="prose max-w-none text-zinc-600 leading-relaxed">
                                    {tailor.bio || 'لا توجد نبذة متوفرة.'}
                                </div>
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="max-w-3xl mx-auto">
                                {/* Only show review form if logged in */}
                                {user && !hasReviewed && (
                                    <div className="bg-zinc-50 rounded-xl p-6 mb-8 border border-zinc-100">
                                        <h3 className="font-bold text-black mb-4">أضف تقييمك</h3>
                                        <div className="flex gap-2 mb-4">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    onClick={() => setReviewRating(star)}
                                                    onMouseEnter={() => setReviewHover(star)}
                                                    onMouseLeave={() => setReviewHover(0)}
                                                    className="transition-transform hover:scale-110 focus:outline-none"
                                                >
                                                    <Star
                                                        size={28}
                                                        className={`${
                                                            star <= (reviewHover || reviewRating)
                                                                ? 'fill-amber-400 text-amber-400'
                                                                : 'text-zinc-300'
                                                        }`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        <textarea
                                            value={reviewComment}
                                            onChange={(e) => setReviewComment(e.target.value)}
                                            placeholder="شاركنا تجربتك مع هذا الخياط..."
                                            className="w-full p-3 rounded-lg border border-zinc-200 focus:border-[var(--theme-primary)] focus:ring-1 focus:ring-[var(--theme-primary)] outline-none min-h-[100px] mb-4 bg-white text-zinc-800 placeholder:text-zinc-400 text-sm"
                                        />
                                        <div className="flex items-center justify-between">
                                             <label className="flex items-center gap-2 cursor-pointer group">
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${termsAccepted ? 'bg-[var(--theme-primary)] border-[var(--theme-primary)]' : 'border-zinc-300 bg-white'}`} onClick={() => setTermsAccepted(!termsAccepted)}>
                                                    {termsAccepted && <CheckCircle2 size={14} className="text-white" />}
                                                </div>
                                                <span className="text-xs text-zinc-500 group-hover:text-zinc-700">أؤكد أن هذا التقييم بناءً على تجربة فعلية</span>
                                             </label>
                                             <button
                                                onClick={submitReview}
                                                disabled={reviewSubmitting || !reviewRating || !termsAccepted}
                                                className={`px-6 py-2 rounded-lg text-sm font-bold text-white transition-all ${
                                                    reviewSubmitting || !reviewRating || !termsAccepted
                                                        ? 'bg-zinc-300 cursor-not-allowed'
                                                        : 'bg-[var(--theme-primary)] hover:opacity-90 shadow-sm hover:shadow'
                                                }`}
                                             >
                                                {reviewSubmitting ? 'جاري النشر...' : 'نشر التقييم'}
                                             </button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    {shopReviews.length > 0 ? (
                                        shopReviews.map((review) => (
                                            <div key={review.id} className="border-b border-zinc-100 last:border-0 pb-6 last:pb-0">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 font-bold">
                                                            {review.userName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-black text-sm">{review.userName}</div>
                                                            <div className="flex items-center gap-1">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star key={i} size={12} className={i < review.rating ? "fill-amber-400 text-amber-400" : "text-zinc-200"} />
                                                                ))}
                                                                <span className="text-xs text-zinc-400 mr-2">
                                                                    {new Date(review.date || review.createdAt || Date.now()).toLocaleDateString('ar-EG')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {(user?.uid === review.userId || user?.role === 'admin') && (
                                                        <button 
                                                            onClick={() => handleDeleteReview(review.id)}
                                                            className="text-zinc-300 hover:text-red-500 transition-colors p-2"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-zinc-600 text-sm leading-relaxed pr-13">{review.comment}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-zinc-400 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                                            <MessageCircle size={32} className="mx-auto mb-2 opacity-20" />
                                            <p>لا توجد تقييمات مكتوبة بعد</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
             </div>
        </div>
    );
};

