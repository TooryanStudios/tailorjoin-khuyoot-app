
import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tailor, Product, Review } from '../types';
import { firebaseService } from '../services/firebase';
import { useApp } from '../context/AppContext';
import {
   hasLikedProduct,
   isInWishlist,
   likeProduct,
   removeFromWishlist,
   unlikeProduct,
   addToWishlist
} from '../services/interactionService';
import { addReview, getReviews, hasUserReviewed, deleteReview } from '../services/reviewService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

// Import new components
import { MobileTailorProfile } from '../src/components/tailor-profile/MobileTailorProfile';
import { DesktopTailorProfile } from '../src/components/tailor-profile/DesktopTailorProfile';
import { ViewMode } from '../src/components/tailor-profile/TailorProductCard';

export const TailorProfile = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, toggleAuthModal } = useApp();
    const [tailor, setTailor] = useState<Tailor | null>(null);
    const [tailorProducts, setTailorProducts] = useState<Product[]>([]);
    const [loadingTailor, setLoadingTailor] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [activeTab, setActiveTab] = useState<'products' | 'portfolio' | 'reviews'>('products');
    const [refreshing, setRefreshing] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');

    const [shopReviews, setShopReviews] = useState<Review[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [visibleCount, setVisibleCount] = useState(6);
    
    // Pagination Logic
    const currentProducts = tailorProducts.slice(0, visibleCount);
    const hasMore = visibleCount < tailorProducts.length;
    const loadMore = () => setVisibleCount(c => c + 6);

    // Reset visible count when products change
    useEffect(() => {
        setVisibleCount(6);
    }, [tailorProducts]);
    
    // Load Tailor Data
    const loadTailor = async () => {
        if (!id) return;
        setLoadingTailor(true);
        try {
            // First try using the service
            let profile = await firebaseService.getUserProfile(id);
            
            // Fallback: If service returns null, try direct Firestore access
            // This handles cases where getUserProfile logic might filter out valid users unexpectedly
            if (!profile) {
                console.warn('getUserProfile returned null, trying direct Firestore fetch', id);
                try {
                    const userDoc = await getDoc(doc(db, 'users', id));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        console.log('Found user via direct fetch:', data);
                        // Construct a basic profile object from what we found
                        profile = {
                            id: userDoc.id,
                            name: data.name || data.shopName || 'Tailor',
                            role: data.role || 'tailor',
                            // Add other necessary fields as needed to satisfy types
                            ...data
                        } as any;
                    }
                } catch (err) {
                    console.error('Direct interaction failed:', err);
                }
            }

            if (!profile) {
                setTailor(null);
                return;
            }

            const anyProfile = profile as any;
            const mapped: Tailor = {
                id,
                name: anyProfile.name || anyProfile.shopName || anyProfile.email || 'خياط',
                specialization: anyProfile.specialization,
                tailorGender: anyProfile.tailorGender,
                rating: anyProfile.rating || anyProfile.ratingAvg,
                location: anyProfile.location,
                region: anyProfile.region,
                bio: anyProfile.bio,
                followers: anyProfile.followers,
                approvalStatus: anyProfile.approvalStatus,
                portfolio: Array.isArray(anyProfile.portfolio) ? anyProfile.portfolio : [],
                reviews: Array.isArray(anyProfile.reviews) ? anyProfile.reviews : [],
                image: anyProfile.profileImage || anyProfile.image || anyProfile.photoURL || '',
                coverImage: anyProfile.coverImage || anyProfile.boardImage || '',
            };

            setTailor(mapped);
        } finally {
            setLoadingTailor(false);
        }
    };

    const loadProducts = async () => {
        if (!id) return;
        setLoadingProducts(true);
        try {
            const products = await firebaseService.getProductsByTailorId(id);
            const filtered = (products || []).filter((p: any) => {
                if (!p) return false;
                if (p.isDraft === true) return false;
                const owner = p.tailorId || p.ownerId || p.userId;
                if (owner && owner !== id) return false;
                return true;
            });
            setTailorProducts(filtered);
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadProducts();
        setTimeout(() => setRefreshing(false), 500);
    };

    useEffect(() => {
        if (id) {
            loadTailor();
            loadProducts();
        }
    }, [id]);

    // Load Reviews
    useEffect(() => {
        if (!id) return;
        
        // Always load reviews when activeTab is reviews OR initially to show count
        let cancelled = false;
        async function load() {
            setLoadingReviews(true);
            try {
                const items = await getReviews('shop', id, 50);
                if (cancelled) return;
                setShopReviews(items || []);
            } finally {
                if (!cancelled) setLoadingReviews(false);
            }
        }
        load();

        return () => {
            cancelled = true;
        };
    }, [id]);

    useEffect(() => {
        if (!user || !id) {
            setHasReviewed(false);
            return;
        }

        let cancelled = false;
        async function load() {
            try {
                const already = await hasUserReviewed(user.id, 'shop', id);
                if (cancelled) return;
                setHasReviewed(already);
            } catch {
                if (!cancelled) setHasReviewed(false);
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, [id, user]);

    useEffect(() => {
        if (!user) {
            setTermsAccepted(false);
            return;
        }
        const key = `review_terms_accepted_v1_${user.id}`;
        setTermsAccepted(localStorage.getItem(key) === '1');
    }, [user]);

    const handleTermsAccept = (accepted: boolean) => {
        setTermsAccepted(accepted);
        if (accepted && user) {
            try {
                localStorage.setItem(`review_terms_accepted_v1_${user.id}`, '1');
            } catch {}
        }
    }

    const submitReview = useCallback(async () => {
        if (!id || !tailor) return;
        if (reviewSubmitting) return;

        if (reviewRating <= 0) {
            alert('يرجى اختيار تقييم');
            return;
        }

        if (!user) {
            toggleAuthModal(true);
            alert('سجل الدخول لإرسال تقييمك');
            return;
        }

        const termsKey = `review_terms_accepted_v1_${user.id}`;
        if (!termsAccepted) {
            alert('يرجى الإقرار بقراءة الشروط والأحكام قبل النشر');
            return;
        }
        localStorage.setItem(termsKey, '1');

        setReviewSubmitting(true);
        try {
            const created = await addReview({
                userId: user.id,
                userName: user.name,
                userAvatar: (user as any).profileImage,
                rating: reviewRating,
                comment: reviewComment.trim(),
                targetType: 'shop',
                targetId: id,
                verified: false,
            });
            setShopReviews((prev) => [created, ...prev]);
            setHasReviewed(true);
            setReviewRating(0);
            setReviewComment('');

            // Update local tailor rating
            if (tailor) {
                const currentCount = tailor.reviewsCount || 0;
                const currentRating = tailor.rating || 0;
                const newCount = currentCount + 1;
                const newRating = ((currentRating * currentCount) + reviewRating) / newCount;
                
                setTailor(prev => prev ? ({
                    ...prev,
                    reviewsCount: newCount,
                    rating: Number(newRating.toFixed(1))
                }) : null);
            }
        } catch (e) {
            console.warn('[TailorProfile] submitReview failed:', e);
            alert('حدث خطأ أثناء إضافة التقييم');
        } finally {
            setReviewSubmitting(false);
        }
    }, [id, tailor, reviewSubmitting, reviewRating, reviewComment, user, toggleAuthModal, termsAccepted]);

    const handleDeleteReview = useCallback(async (reviewId: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا التقييم؟')) return;

        try {
            await deleteReview(reviewId);
            setShopReviews((prev) => prev.filter((r) => r.id !== reviewId));
            setHasReviewed(false);
        } catch (error) {
            console.error('Failed to delete review:', error);
            alert('حدث خطأ أثناء حذف التقييم');
        }
    }, []);

    const handleContactClick = () => {
        if (!user) {
            toggleAuthModal(true);
        } else {
            alert('سيتم فتح المحادثة قريباً');
        }
    };

    const handleProductClick = (productId: string) => {
        navigate(`/product/${productId}`);
    };

    // Note: Likes state is optimistically handled in the card's local state mostly, 
    // but if we want to update the parent list:
    const handleLikeToggle = useCallback((productId: string, newCount: number) => {
         setTailorProducts((prev) =>
            prev.map((p) => (p.id === productId ? ({ ...p, likes: newCount } as any) : p))
         );
    }, []);

    if (!tailor) {
        return (
            <div className="p-10 text-center text-slate-500 dark:text-slate-400">
                {loadingTailor ? 'جاري التحميل...' : 'لم يتم العثور على هذا الخياط'}
            </div>
        );
    }

    return (
        <>
            {/* Mobile View */}
            <div className="md:hidden">
                <MobileTailorProfile 
                    tailor={tailor}
                    products={currentProducts}
                    hasMore={hasMore}
                    onLoadMore={loadMore}
                    reviews={shopReviews}
                    shopReviews={shopReviews}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onBack={() => navigate(-1)}
                    onContact={handleContactClick}
                    user={user}
                    loadingProducts={loadingProducts}
                    viewMode={viewMode}
                    toggleLike={handleLikeToggle}
                    onProductClick={handleProductClick}
                />
            </div>

            {/* Desktop View */}
            <div className="hidden md:block">
                <DesktopTailorProfile 
                    tailor={tailor}
                    products={currentProducts}
                    hasMore={hasMore}
                    onLoadMore={loadMore}
                    reviews={shopReviews}
                    shopReviews={shopReviews}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    onBack={() => navigate(-1)}
                    onContact={handleContactClick}
                    user={user}
                    loadingProducts={loadingProducts}
                    refreshing={refreshing}
                    handleRefresh={handleRefresh}
                    onProductClick={handleProductClick}
                    toggleLike={handleLikeToggle}
                    reviewRating={reviewRating}
                    setReviewRating={setReviewRating}
                    reviewComment={reviewComment}
                    setReviewComment={setReviewComment}
                    reviewSubmitting={reviewSubmitting}
                    submitReview={submitReview}
                    handleDeleteReview={handleDeleteReview}
                    hasReviewed={hasReviewed}
                    loadingReviews={loadingReviews}
                    termsAccepted={termsAccepted}
                    setTermsAccepted={handleTermsAccept}
                />
            </div>
        </>
    );
};
