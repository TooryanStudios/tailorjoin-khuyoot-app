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
        <div className="min-h-screen bg-[var(--studio-bg)]">
             {/* Cover Image */}
         <div className="h-48 md:h-64 bg-[var(--studio-surface)] relative group overflow-hidden">
            {tailor.coverImage ? (
               <StableImage
                  src={tailor.coverImage}
                  alt="Cover"
                  aspectClass="h-full"
                  className="w-full h-full"
                  imgClassName="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
               />
            ) : (
               <div className="absolute inset-0 bg-gradient-to-br from-[var(--studio-surface)] to-[var(--studio-card)]" />
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
            <div className="bg-[var(--studio-card)] rounded-2xl p-6 shadow-xl border border-[var(--studio-card-border)] flex flex-col md:flex-row gap-6 items-start md:items-end">
               <div className="w-32 h-32 rounded-2xl bg-[var(--studio-card)] p-1 shadow-lg -mt-16 md:-mt-20 overflow-hidden shrink-0">
                  {tailor.image ? (
                     <StableImage src={tailor.image} alt={tailor.name} aspectClass="h-full" className="rounded-xl h-full w-full" imgClassName="object-cover" />
                  ) : (
                     <div className="h-full w-full rounded-xl bg-[var(--studio-surface)] flex items-center justify-center">
                        <User size={40} className="text-[var(--studio-text-muted)]" />
                     </div>
                  )}
               </div>
               
               <div className="flex-1 w-full">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                     <div>
                        <h1 className="text-2xl font-bold text-[var(--studio-text)] flex items-center gap-2">
                           {tailor.name}
                           {tailor.approvalStatus === 'approved' && <CheckCircle2 size={20} className="text-blue-500" />}
                        </h1>
                        <div className="flex items-center gap-2 text-sm mt-1">
                           <p className="text-[var(--studio-text-muted)]">{getSpecializationLabel(tailor.specialization)}</p>
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
                     <div className="flex items-center gap-6 divide-x divide-x-reverse divide-[var(--studio-card-border)]">
                        <div className="text-center px-2">
                           <p className="font-bold text-[var(--studio-text)]">{tailor.followers}</p>
                           <p className="text-[10px] text-[var(--studio-text-muted)] uppercase tracking-wider">متابع</p>
                        </div>
                        <div className="text-center px-2">
                           <p className="font-bold text-[var(--studio-text)] flex items-center gap-1 justify-center">
                              {tailor.rating} <Star size={12} className="text-amber-500 fill-amber-500" />
                           </p>
                           <p className="text-[10px] text-[var(--studio-text-muted)] uppercase tracking-wider">تقييم</p>
                        </div>
                     </div>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-[var(--studio-text-muted)]">
                     <span className="flex items-center gap-1"><MapPin size={16} /> {tailor.location}</span>
                     <span className="flex items-center gap-1"><Clock size={16} /> يفتح: 9:00 ص - 10:00 م</span>
                  </div>
               </div>

               <Button 
                  onClick={onContact}
                  className="shrink-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all"
               >
                  <MessageCircle size={18} /> {user ? 'تواصل' : 'سجّل للتواصل'}
               </Button>
            </div>
            
            {/* Bio */}
            {tailor.bio && (
                  <div className="mt-8 px-2 max-w-3xl">
                     <h3 className="text-lg font-bold text-[var(--studio-text)] mb-2">عن الخياط</h3>
                     <p className="text-[var(--studio-text-muted)] leading-relaxed">{tailor.bio}</p>
                  </div>
            )}

            {/* Tabs */}
            <div className="mt-10 border-b border-[var(--studio-card-border)] flex gap-8 items-center justify-between">
                  <div className="flex gap-8">
                     <button 
                        onClick={() => setActiveTab('products')}
                        className={`pb-4 font-bold text-sm transition-all relative ${activeTab === 'products' ? 'text-blue-600' : 'text-[var(--studio-text-muted)] hover:text-[var(--studio-text)]'}`}
                     >
                        الموديلات
                        {activeTab === 'products' && <div className="absolute bottom-0 right-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
                     </button>
                     <button 
                        onClick={() => setActiveTab('reviews')}
                        className={`pb-4 font-bold text-sm transition-all relative ${activeTab === 'reviews' ? 'text-blue-600' : 'text-[var(--studio-text-muted)] hover:text-[var(--studio-text)]'}`}
                     >
                        التقييمات
                        {activeTab === 'reviews' && <div className="absolute bottom-0 right-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>}
                     </button>
                  </div>
                  
                  {activeTab === 'products' && (
                     <div className="flex items-center gap-3">
                        {/* View Mode Toggle */}
                        <div className="flex items-center gap-1 bg-[var(--studio-surface)] rounded-lg p-1">
                           <button
                              onClick={() => setViewMode('grid')}
                              className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
                                 viewMode === 'grid'
                                    ? 'bg-[var(--studio-bg)] text-blue-600 shadow-sm'
                                    : 'text-[var(--studio-text-muted)] hover:text-[var(--studio-text)]'
                              }`}
                              title="عرض شبكي"
                           >
                              <Grid3x3 size={16} />
                           </button>
                           <button
                              onClick={() => setViewMode('compact')}
                              className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
                                 viewMode === 'compact'
                                    ? 'bg-[var(--studio-bg)] text-blue-600 shadow-sm'
                                    : 'text-[var(--studio-text-muted)] hover:text-[var(--studio-text)]'
                              }`}
                              title="عرض مضغوط"
                           >
                              <LayoutGrid size={16} />
                           </button>
                           <button
                              onClick={() => setViewMode('list')}
                              className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
                                 viewMode === 'list'
                                    ? 'bg-[var(--studio-bg)] text-blue-600 shadow-sm'
                                    : 'text-[var(--studio-text-muted)] hover:text-[var(--studio-text)]'
                              }`}
                              title="عرض قائمة"
                           >
                              <List size={16} />
                           </button>
                        </div>
                        
                        <button
                           onClick={handleRefresh}
                           disabled={refreshing}
                           className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--studio-text-muted)] hover:text-blue-600 hover:bg-[var(--studio-surface)] rounded-lg transition-colors disabled:opacity-50"
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
                           <div className="py-20 text-center text-[var(--studio-text-muted)]">جاري تحميل الموديلات...</div>
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
                           <div className="py-20 text-center text-[var(--studio-text-muted)] border-2 border-dashed border-[var(--studio-card-border)] rounded-2xl">
                              <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
                              <p className="text-lg">لا توجد موديلات معروضة حالياً</p>
                           </div>
                        )}
                     </>
                  )}

                  {activeTab === 'reviews' && (
                     <div className="grid md:grid-cols-3 gap-8">
                         <div className="md:col-span-1">
                            <div className="bg-[var(--studio-card)] p-6 rounded-2xl border border-[var(--studio-card-border)] sticky top-24 shadow-sm">
                            <h3 className="font-bold text-lg mb-4 text-[var(--studio-text)]">أضف تقييمك</h3>
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
                                                : 'text-[var(--studio-card-border)]')
                                          }
                                       />
                                    </button>
                                 ))}
                              </div>
                              {reviewRating > 0 && (
                                 <div className="text-center text-sm font-medium text-[var(--studio-text-muted)]">
                                    {reviewRating === 1 && 'ضعيف'}
                                    {reviewRating === 2 && 'مقبول'}
                                    {reviewRating === 3 && 'جيد'}
                                    {reviewRating === 4 && 'جيد جداً'}
                                    {reviewRating === 5 && 'ممتاز'}
                                 </div>
                              )}
                           </div>
                           
                           {hasReviewed && (
                              <div className="text-center mb-4 text-xs font-semibold text-[var(--studio-success)] bg-green-500/10 px-3 py-2 rounded-lg">
                                 لقد قمت بتقييم هذا الخياط مسبقاً
                              </div>
                           )}

                           <textarea
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              className="w-full px-4 py-3 text-sm border-0 bg-[var(--studio-bg)] rounded-xl shadow-sm ring-1 ring-[var(--studio-card-border)] focus:ring-2 focus:ring-blue-500/50 resize-y min-h-[100px] text-[var(--studio-text)] placeholder:text-[var(--studio-text-muted)]"
                              rows={3}
                              placeholder="اكتب تعليقك هنا..."
                           />

                           <div className="mt-4 flex flex-col gap-4">
                              {user ? (
                                 !termsAccepted ? (
                                    <label className="flex items-center gap-2 text-xs text-[var(--studio-text-muted)] cursor-pointer select-none">
                                       <input
                                          type="checkbox"
                                          className="rounded border-[var(--studio-card-border)] text-blue-600 focus:ring-blue-500/30"
                                          checked={termsAccepted}
                                          onChange={(e) => setTermsAccepted(e.target.checked)}
                                       />
                                       <span>
                                          أوافق على <span className="text-[var(--studio-text)] hover:underline" onClick={(e) => { e.preventDefault(); /* open terms */ }}>الشروط</span>
                                       </span>
                                    </label>
                                 ) : (
                                    <div className="text-xs text-[var(--studio-success)] flex items-center gap-1">
                                       <CheckCircle2 size={14} />
                                       <span>تم قبول الشروط</span>
                                    </div>
                                 )
                              ) : (
                                 <div className="text-center text-sm text-[var(--studio-text-muted)] bg-[var(--studio-surface)] py-2 rounded-lg">سجل الدخول لتتمكن من التقييم</div>
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
                             <h3 className="font-bold text-lg mb-2 text-[var(--studio-text)]">التقييمات ({shopReviews.length})</h3>
                            {loadingReviews && shopReviews.length === 0 ? (
                               <div className="text-center py-20 text-[var(--studio-text-muted)]">جاري تحميل التقييمات...</div>
                            ) : shopReviews.length > 0 ? (
                               shopReviews.map((review) => (
                                  <div key={review.id} className="bg-[var(--studio-card)] p-6 rounded-2xl border border-[var(--studio-card-border)] shadow-sm hover:shadow-md transition-shadow">
                                     <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                           <div className="w-10 h-10 rounded-full bg-[var(--studio-surface)] flex items-center justify-center">
                                              <User size={18} className="text-[var(--studio-text-muted)]" />
                                           </div>
                                           <div>
                                               <span className="font-bold text-[var(--studio-text)] block">{review.userName}</span>
                                               {review.date && <span className="text-xs text-[var(--studio-text-muted)]">{review.date}</span>}
                                           </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                           <div className="flex text-amber-500" dir="ltr">
                                              {[...Array(5)].map((_, i) => (
                                                 <Star
                                                    key={i}
                                                    size={14}
                                                    fill={i < review.rating ? 'currentColor' : 'none'}
                                                    className={i >= review.rating ? 'text-[var(--studio-card-border)]' : ''}
                                                 />
                                              ))}
                                           </div>
                                           {user && user.id === review.userId && (
                                              <button
                                                 onClick={() => handleDeleteReview(review.id)}
                                                 className="text-[var(--studio-text-muted)] hover:text-[var(--studio-danger)] transition-colors p-2 rounded-full hover:bg-[var(--studio-surface)]"
                                                 title="حذف التقييم"
                                              >
                                                 <Trash2 size={16} />
                                              </button>
                                           )}
                                        </div>
                                     </div>
                                     <p className="text-[var(--studio-text-muted)] leading-relaxed">{review.comment}</p>
                                  </div>
                               ))
                            ) : (
                               <div className="text-center py-20 bg-[var(--studio-surface)] rounded-2xl border border-dashed border-[var(--studio-card-border)]">
                                   <MessageCircle size={32} className="mx-auto text-[var(--studio-card-border)] mb-3" />
                                   <p className="text-[var(--studio-text-muted)]">لا توجد تقييمات بعد، كن أول من يقيم هذا الخياط</p>
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
