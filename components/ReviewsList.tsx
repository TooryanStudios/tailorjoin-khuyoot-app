import React, { useEffect, useState } from 'react';
import { Star, ThumbsUp, User } from 'lucide-react';
import { getReviews, markReviewHelpful } from '../services/reviewService';
import { Review } from '../types';

interface ReviewsListProps {
  targetType: 'shop' | 'product';
  targetId: string;
  limit?: number;
  showAddButton?: boolean;
  onAddReview?: () => void;
}

export default function ReviewsList({ 
  targetType, 
  targetId, 
  limit = 20,
  showAddButton = true,
  onAddReview 
}: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [targetType, targetId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await getReviews(targetType, targetId, limit);
      setReviews(data);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      await markReviewHelpful(reviewId);
      // Update local state
      setReviews(reviews.map(review => 
        review.id === reviewId 
          ? { ...review, helpful: (review.helpful || 0) + 1 }
          : review
      ));
    } catch (error) {
      console.error('Error marking review helpful:', error);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1" dir="ltr">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100 
      : 0
  }));

  return (
    <div className="space-y-6" dir="rtl">
      {/* Rating Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Average Rating */}
          <div className="text-center md:border-l border-gray-200">
            <div className="text-5xl font-bold text-gray-800 mb-2">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex justify-center mb-2">
              {renderStars(Math.round(averageRating))}
            </div>
            <p className="text-gray-600">
              بناءً على {reviews.length} تقييم
            </p>
            {showAddButton && onAddReview && (
              <button
                onClick={onAddReview}
                className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                أضف تقييمك
              </button>
            )}
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-12">{rating} نجوم</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-8">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800">
          التقييمات ({reviews.length})
        </h3>

        {reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-bold text-gray-800 mb-2">
              لا توجد تقييمات بعد
            </h4>
            <p className="text-gray-600 mb-4">كن أول من يقيّم</p>
            {showAddButton && onAddReview && (
              <button
                onClick={onAddReview}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                أضف تقييمك الآن
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-lg shadow p-6"
              >
                {/* User Info */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                    {review.userAvatar ? (
                      <img
                        src={review.userAvatar}
                        alt={review.userName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-gray-800">
                        {review.userName}
                        {review.verified && (
                          <span className="mr-2 text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded">
                            ✓ مشتري موثق
                          </span>
                        )}
                      </h4>
                      {renderStars(review.rating)}
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(review.date).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Review Content */}
                <p className="text-gray-700 mb-4">{review.comment}</p>

                {/* Review Images */}
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    {review.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Review image ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                {/* Helpful Button */}
                <button
                  onClick={() => handleMarkHelpful(review.id)}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 transition"
                >
                  <ThumbsUp className="w-4 h-4" />
                  مفيد {review.helpful && review.helpful > 0 && `(${review.helpful})`}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
