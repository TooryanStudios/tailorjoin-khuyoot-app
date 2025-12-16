import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  deleteDoc,
  orderBy,
  limit,
  Timestamp,
  increment,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { Review } from '../types';

// ==========================================
// إضافة تقييم جديد
// ==========================================
export async function addReview(
  reviewData: Omit<Review, 'id' | 'date'>
): Promise<Review> {
  try {
    const reviewsRef = collection(db, 'reviews');
    const docRef = await addDoc(reviewsRef, {
      ...reviewData,
      date: new Date().toISOString(),
      helpful: 0,
      createdAt: Timestamp.now()
    });

    // تحديث تقييم المحل أو المنتج
    await updateTargetRating(reviewData.targetType, reviewData.targetId);

    return {
      id: docRef.id,
      ...reviewData,
      date: new Date().toISOString(),
      helpful: 0
    };
  } catch (error) {
    console.error('Error adding review:', error);
    throw new Error('فشل إضافة التقييم');
  }
}

// ==========================================
// جلب تقييمات محل أو منتج
// ==========================================
export async function getReviews(
  targetType: 'shop' | 'product',
  targetId: string,
  limitCount: number = 20
): Promise<Review[]> {
  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(
      reviewsRef,
      where('targetType', '==', targetType),
      where('targetId', '==', targetId),
      orderBy('date', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Review));
  } catch (error) {
    console.error('Error getting reviews:', error);
    return [];
  }
}

// ==========================================
// حذف تقييم
// ==========================================
export async function deleteReview(reviewId: string): Promise<void> {
  try {
    const reviewRef = doc(db, 'reviews', reviewId);
    const reviewDoc = await getDoc(reviewRef);
    
    if (reviewDoc.exists()) {
      const reviewData = reviewDoc.data() as Review;
      await deleteDoc(reviewRef);
      
      // تحديث تقييم المحل أو المنتج بعد الحذف
      await updateTargetRating(reviewData.targetType, reviewData.targetId);
    }
  } catch (error) {
    console.error('Error deleting review:', error);
    throw new Error('فشل حذف التقييم');
  }
}

// ==========================================
// تحديث "مفيد" للتقييم
// ==========================================
export async function markReviewHelpful(reviewId: string): Promise<void> {
  try {
    const reviewRef = doc(db, 'reviews', reviewId);
    await updateDoc(reviewRef, {
      helpful: increment(1)
    });
  } catch (error) {
    console.error('Error marking review helpful:', error);
    throw new Error('فشل تحديث التقييم');
  }
}

// ==========================================
// تحديث تقييم المحل أو المنتج
// ==========================================
async function updateTargetRating(
  targetType: 'shop' | 'product',
  targetId: string
): Promise<void> {
  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(
      reviewsRef,
      where('targetType', '==', targetType),
      where('targetId', '==', targetId)
    );

    const querySnapshot = await getDocs(q);
    const reviews = querySnapshot.docs.map(doc => doc.data() as Review);
    
    if (reviews.length === 0) {
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    const roundedRating = Math.round(averageRating * 10) / 10; // تقريب لأقرب 0.1

    // تحديث التقييم في المستند المستهدف
    const collectionName = targetType === 'shop' ? 'shops' : 'products';
    const targetRef = doc(db, collectionName, targetId);
    
    await updateDoc(targetRef, {
      rating: roundedRating,
      reviewsCount: reviews.length
    });
  } catch (error) {
    console.error('Error updating target rating:', error);
  }
}

// ==========================================
// التحقق من وجود تقييم من المستخدم
// ==========================================
export async function hasUserReviewed(
  userId: string,
  targetType: 'shop' | 'product',
  targetId: string
): Promise<boolean> {
  try {
    const reviewsRef = collection(db, 'reviews');
    const q = query(
      reviewsRef,
      where('userId', '==', userId),
      where('targetType', '==', targetType),
      where('targetId', '==', targetId),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking user review:', error);
    return false;
  }
}
