import React, { useRef, useEffect } from 'react';
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
}) => {
    const contentRef = useRef<HTMLDivElement>(null);
    const [reviewHover, setReviewHover] = React.useState(0);

    return (
        <div className="min-h-screen bg-white dark:bg-[#0B0A13]">
             {/* Cover Image */}
         <div className="h-48 md:h-64 bg-slate-200 dark:bg-slate-800 relative group">
            {tailor.coverImage ? (
               <StableImage
                  src={tailor.coverImage}
                  alt="Cover"
                  aspectClass="h-full"
                  className="w-full h-full"
                  imgClassName="w-full h-full object-cover"
               />
            ) : (
               <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />
            )}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <button 
               onClick={onBack}
               className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-black/40 transition-colors backdrop-blur-sm"
            >
               <ArrowRight size={20} />
            </button>
         </div>

         {/* Profile Header */}
         <div className="px-2 sm:px-3 md:px-6 max-w-5xl mx-auto -mt-16 relative z-10">
            <div className="bg-white dark:bg-[#1E1E2E] rounded-2xl p-6 shadow-xl border border-slate-100 dark:border-slate-700/50 flex flex-col md:flex-row gap-6 items-start md:items-end">
               <div className="w-32 h-32 rounded-2xl bg-white dark:bg-[#1E1E2E] p-1 shadow-lg -mt-16 md:-mt-20 overflow-hidden shrink-0">
                  {tailor.image ? (
                     <StableImage src={tailor.image} alt={tailor.name} aspectClass="h-full" className="rounded-xl h-full w-full" imgClassName="object-cover" />
                  ) : (
                     <div className="h-full w-full rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <User size={40} className="text-slate-400" />
                     </div>
                  )}
               </div>
               
               <div className="flex-1 w-full">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                     <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                           {tailor.name}
                           {tailor.approvalStatus === 'approved' && <CheckCircle2 size={20} className="text-blue-500" />}
                        </h1>
                        <div className="flex items-center gap-2 text-sm mt-1">
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
                     <div className="flex items-center gap-6 divide-x divide-x-reverse divide-slate-200 dark:divide-slate-700">
                        <div className="text-center px-2">
                           <p className="font-bold text-slate-900 dark:text-white">{tailor.followers}</p>
                           <p className="text-[10px] text-slate-500 uppercase tracking-wider">متابع</p>
                        </div>
                        <div className="text-center px-2">
                           <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1 justify-center">
                              {tailor.rating} <Star size={12} className="text-amber-500 fill-amber-500" />
                           </p>
                           <p className="text-[10px] text-slate-500 uppercase tracking-wider">تقييم</p>
                        </div>
                     </div>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
                     <span className="flex items-center gap-1"><MapPin size={16} /> {tailor.location}</span>
                     <span className="flex items-center gap-1"><Clock size={16} /> يفتح: 9:00 ص - 10:00 م</span>
                  </div>
               </div>

               <Button 
                  onClick={onContact}
                  className="shrink-0 flex items-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-900 hover:opacity-90 transition-opacity"
               >
                  <MessageCircle size={18} /> {user ? 'تواصل' : 'سجّل للتواصل'}
               </Button>
            </div>
            
            {/* Bio */}
            {tailor.bio && (
                  <div className="mt-8 px-2 max-w-3xl">
                     <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">عن الخياط</h3>
                     <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{tailor.bio}</p>
                  </div>
            )}

            {/* Tabs */}
            <div className="mt-10 border-b border-slate-200 dark:border-slate-700 flex gap-8 items-center justify-between">
                  <div className="flex gap-8">
                     <button 
                        onClick={() => setActiveTab('products')}
                        className={`pb-4 font-bold text-sm transition-all relative ${activeTab === 'products' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                     >
                        الموديلات
                        {activeTab === 'products' && <div className="absolute bottom-0 right-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"></div>}
                     </button>
                     <button 
                        onClick={() => setActiveTab('reviews')}
                        className={`pb-4 font-bold text-sm transition-all relative ${activeTab === 'reviews' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                     >
                        التقييمات
                        {activeTab === 'reviews' && <div className="absolute bottom-0 right-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full"></div>}
                     </button>
                  </div>
                  
                  {activeTab === 'products' && (
                     <div className="flex items-center gap-3">
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
            <div
                  className="mt-8 pb-12"
                  ref={contentRef}
            >
                  {activeTab === 'products' && (
                     <>
                        {loadingProducts && tailorProducts.length === 0 ? (
                           <div className="py-20 text-center text-slate-400">جاري تحميل الموديلات...</div>
                        ) : tailorProducts.length > 0 ? (
                           <>
                              {viewMode === 'grid' && (
                                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {tailorProducts.map((p, idx) => (
                                       <TailorProductCard
                                       key={p.id}
                                       product={p}
                                       viewMode={viewMode}
                                       onClick={() => onProductClick(p.id)}
                                                          onLikeChange={(count) => toggleLike && toggleLike(p.id, count)}
                                       isHot={idx < 2}
                                       />
                                    ))}
                                 </div>
                              )}

                              {viewMode === 'compact' && (
                                 <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                                    {tailorProducts.map((p, idx) => (
                                       <TailorProductCard
                                       key={p.id}
                                       product={p}
                                       viewMode={viewMode}
                                       onClick={() => onProductClick(p.id)}
                                                          onLikeChange={(count) => toggleLike && toggleLike(p.id, count)}
                                       isHot={idx < 2}
                                       />
                                    ))}
                                 </div>
                              )}

                              {viewMode === 'list' && (
                                 <div className="space-y-3">
                                    {tailorProducts.map((p, idx) => (
                                       <TailorProductCard
                                       key={p.id}
                                       product={p}
                                       viewMode={viewMode}
                                       onClick={() => onProductClick(p.id)}
                                                          onLikeChange={(count) => toggleLike && toggleLike(p.id, count)}
                                       isHot={idx < 2}
                                       />
                                    ))}
                                 </div>
                              )}
                           </>
                        ) : (
                           <div className="py-20 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                              <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
                              <p className="text-lg">لا توجد موديلات معروضة حالياً</p>
                           </div>
                        )}
                     </>
                  )}

                  {activeTab === 'reviews' && (
                     <div className="grid md:grid-cols-3 gap-8">
                         <div className="md:col-span-1">
                            <div className="bg-zinc-50 dark:bg-zinc-900/30 p-6 rounded-2xl border border-zinc-200 dark:border-white/5 sticky top-24">
                            <h3 className="font-bold text-lg mb-4">أضف تقييمك</h3>
                           <div className="flex flex-col gap-4 mb-4">
                              <div className="flex items-center gap-1 justify-center py-2" dir="ltr">
                                 {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                       key={star}
                                       type="button"
                                       onClick={() => setReviewRating(star)}
                                       onMouseEnter={() => setReviewHover(star)}
                                       onMouseLeave={() => setReviewHover(0)}
                                       className="focus:outline-none transition-transform hover:scale-110 p-1"
                                       aria-label={`Rate ${star}`}
                                    >
                                       <Star
                                          className={
                                             'w-8 h-8 ' +
                                             (star <= (reviewHover || reviewRating)
                                                ? 'fill-amber-400 text-amber-400'
                                                : 'text-zinc-300 dark:text-zinc-700')
                                          }
                                       />
                                    </button>
                                 ))}
                              </div>
                              {reviewRating > 0 && (
                                 <div className="text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                    {reviewRating === 1 && 'ضعيف'}
                                    {reviewRating === 2 && 'مقبول'}
                                    {reviewRating === 3 && 'جيد'}
                                    {reviewRating === 4 && 'جيد جداً'}
                                    {reviewRating === 5 && 'ممتاز'}
                                 </div>
                              )}
                           </div>
                           
                           {hasReviewed && (
                              <div className="text-center mb-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/20 px-3 py-2 rounded-lg">
                                 لقد قمت بتقييم هذا الخياط مسبقاً
                              </div>
                           )}

                           <textarea
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              className="w-full px-4 py-3 text-sm border-0 bg-white dark:bg-black/20 rounded-xl shadow-sm ring-1 ring-zinc-200 dark:ring-white/10 focus:ring-2 focus:ring-purple-500/50 resize-y min-h-[100px] text-zinc-900 dark:text-white placeholder:text-zinc-400"
                              rows={3}
                              placeholder="اكتب تعليقك هنا..."
                           />

                           <div className="mt-4 flex flex-col gap-4">
                              {user ? (
                                 !termsAccepted ? (
                                    <label className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 cursor-pointer select-none">
                                       <input
                                          type="checkbox"
                                          className="rounded border-zinc-300 dark:border-zinc-700 text-purple-600 focus:ring-purple-500/30"
                                          checked={termsAccepted}
                                          onChange={(e) => setTermsAccepted(e.target.checked)}
                                       />
                                       <span>
                                          أوافق على <a className="text-zinc-700 dark:text-zinc-300 hover:underline" href="/terms" target="_blank" rel="noreferrer">الشروط</a>
                                       </span>
                                    </label>
                                 ) : (
                                    <div className="text-xs text-zinc-400 flex items-center gap-1">
                                       <CheckCircle2 size={14} />
                                       <span>تم قبول الشروط</span>
                                    </div>
                                 )
                              ) : (
                                 <div className="text-center text-sm text-zinc-500 bg-zinc-100 dark:bg-white/5 py-2 rounded-lg">سجل الدخول لتتمكن من التقييم</div>
                              )}

                              <button
                                 type="button"
                                 disabled={reviewSubmitting || hasReviewed || (user && !termsAccepted) || !user}
                                 onClick={submitReview}
                                 className="w-full px-4 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                 {reviewSubmitting ? 'جاري النشر...' : 'نشر التقييم'}
                              </button>
                           </div>
                        </div>
                         </div>

                         <div className="md:col-span-2 space-y-4">
                             <h3 className="font-bold text-lg mb-2">التقييمات ({shopReviews.length})</h3>
                            {loadingReviews && shopReviews.length === 0 ? (
                               <div className="text-center py-20 text-slate-400">جاري تحميل التقييمات...</div>
                            ) : shopReviews.length > 0 ? (
                               shopReviews.map((review) => (
                                  <div key={review.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                     <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                           <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                              <User size={18} className="text-slate-500" />
                                           </div>
                                           <div>
                                               <span className="font-bold text-slate-900 dark:text-white block">{review.userName}</span>
                                               {review.date && <span className="text-xs text-slate-400">{review.date}</span>}
                                           </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                           <div className="flex text-amber-500" dir="ltr">
                                              {[...Array(5)].map((_, i) => (
                                                 <Star
                                                    key={i}
                                                    size={14}
                                                    fill={i < review.rating ? 'currentColor' : 'none'}
                                                    className={i >= review.rating ? 'text-slate-200 dark:text-slate-600' : ''}
                                                 />
                                              ))}
                                           </div>
                                           {user && user.id === review.userId && (
                                              <button
                                                 onClick={() => handleDeleteReview(review.id)}
                                                 className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-700"
                                                 title="حذف التقييم"
                                              >
                                                 <Trash2 size={16} />
                                              </button>
                                           )}
                                        </div>
                                     </div>
                                     <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{review.comment}</p>
                                  </div>
                               ))
                            ) : (
                               <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                   <MessageCircle size={32} className="mx-auto text-slate-300 mb-3" />
                                   <p className="text-slate-500">لا توجد تقييمات بعد، كن أول من يقيم هذا الخياط</p>
                               </div>
                            )}
                         </div>
                     </div>
                  )}
            </div>
         </div>
         </div>
    );
};
