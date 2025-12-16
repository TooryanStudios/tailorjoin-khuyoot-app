import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { addReview } from '../services/reviewService';
import { Review } from '../types';

interface ReviewFormProps {
  targetType: 'shop' | 'product';
  targetId: string;
  targetName: string;
  onSuccess?: (review: Review) => void;
  onCancel?: () => void;
}

export default function ReviewForm({ 
  targetType, 
  targetId, 
  targetName,
  onSuccess,
  onCancel 
}: ReviewFormProps) {
  const { user } = useApp();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('يجب تسجيل الدخول لإضافة تقييم');
      return;
    }

    if (rating === 0) {
      alert('يرجى اختيار تقييم');
      return;
    }

    if (comment.trim().length < 10) {
      alert('يرجى كتابة تقييم لا يقل عن 10 أحرف');
      return;
    }

    setSubmitting(true);

    try {
      const review = await addReview({
        userId: user.id,
        userName: user.name,
        userAvatar: user.profileImage,
        rating,
        comment: comment.trim(),
        targetType,
        targetId,
        verified: false
      });

      onSuccess?.(review);
      
      // Reset form
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('حدث خطأ أثناء إضافة التقييم');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800">
          تقييم {targetType === 'shop' ? 'المحل' : 'المنتج'}
        </h3>
        {onCancel && (
          <button 
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <p className="text-gray-600 mb-4">{targetName}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            التقييم *
          </label>
          <div className="flex items-center gap-2" dir="ltr">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="text-sm text-gray-600 mr-2" dir="rtl">
                {rating === 1 && 'ضعيف'}
                {rating === 2 && 'مقبول'}
                {rating === 3 && 'جيد'}
                {rating === 4 && 'جيد جداً'}
                {rating === 5 && 'ممتاز'}
              </span>
            )}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            تعليقك * (لا يقل عن 10 أحرف)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            rows={4}
            placeholder="شارك تجربتك مع الآخرين..."
            required
            minLength={10}
          />
          <p className="text-xs text-gray-500 mt-1">
            {comment.length} / 10 أحرف على الأقل
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting || rating === 0 || comment.trim().length < 10}
            className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {submitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              إلغاء
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
