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
import { PortfolioItem, WishlistItem, ProductCollection, ProductLike } from '../types';

// ==========================================
// معرض الأعمال (Portfolio)
// ==========================================

export async function addPortfolioItem(
  itemData: Omit<PortfolioItem, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'views'>
): Promise<PortfolioItem> {
  try {
    const portfolioRef = collection(db, 'portfolio');
    const docRef = await addDoc(portfolioRef, {
      ...itemData,
      likes: 0,
      views: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    return {
      id: docRef.id,
      ...itemData,
      likes: 0,
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error adding portfolio item:', error);
    throw new Error('فشل إضافة العنصر إلى المعرض');
  }
}

export async function getPortfolioItems(ownerId: string): Promise<PortfolioItem[]> {
  try {
    const portfolioRef = collection(db, 'portfolio');
    // إزالة orderBy مؤقتاً لتجنب مشكلة Index - سنرتب في الكود
    const q = query(
      portfolioRef,
      where('ownerId', '==', ownerId)
    );

    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString()
      } as PortfolioItem;
    });
    
    // ترتيب النتائج حسب التاريخ في الكود
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error getting portfolio items:', error);
    return [];
  }
}

export async function deletePortfolioItem(itemId: string): Promise<void> {
  try {
    const itemRef = doc(db, 'portfolio', itemId);
    await deleteDoc(itemRef);
  } catch (error) {
    console.error('Error deleting portfolio item:', error);
    throw new Error('فشل حذف العنصر');
  }
}

export async function incrementPortfolioViews(itemId: string): Promise<void> {
  try {
    const itemRef = doc(db, 'portfolio', itemId);
    await updateDoc(itemRef, {
      views: increment(1)
    });
  } catch (error) {
    console.error('Error incrementing views:', error);
  }
}

// ==========================================
// Wishlist (قائمة الأمنيات)
// ==========================================

export async function addToWishlist(userId: string, productId: string): Promise<WishlistItem> {
  try {
    // التحقق من عدم وجود المنتج مسبقاً
    const exists = await isInWishlist(userId, productId);
    if (exists) {
      throw new Error('المنتج موجود بالفعل في قائمة الأمنيات');
    }

    const wishlistRef = collection(db, 'wishlists');
    const docRef = await addDoc(wishlistRef, {
      userId,
      productId,
      addedAt: Timestamp.now()
    });

    return {
      id: docRef.id,
      userId,
      productId,
      addedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    throw error;
  }
}

export async function removeFromWishlist(userId: string, productId: string): Promise<void> {
  try {
    const wishlistRef = collection(db, 'wishlists');
    const q = query(
      wishlistRef,
      where('userId', '==', userId),
      where('productId', '==', productId),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      await deleteDoc(querySnapshot.docs[0].ref);
    }
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    throw new Error('فشل إزالة المنتج من قائمة الأمنيات');
  }
}

export async function getWishlist(userId: string): Promise<WishlistItem[]> {
  try {
    const wishlistRef = collection(db, 'wishlists');
    const q = query(
      wishlistRef,
      where('userId', '==', userId),
      orderBy('addedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        addedAt: data.addedAt?.toDate().toISOString() || new Date().toISOString()
      } as WishlistItem;
    });
  } catch (error) {
    console.error('Error getting wishlist:', error);
    return [];
  }
}

export async function isInWishlist(userId: string, productId: string): Promise<boolean> {
  try {
    const wishlistRef = collection(db, 'wishlists');
    const q = query(
      wishlistRef,
      where('userId', '==', userId),
      where('productId', '==', productId),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking wishlist:', error);
    return false;
  }
}

// ==========================================
// Product Collections (المجموعات)
// ==========================================

export async function createCollection(
  collectionData: Omit<ProductCollection, 'id' | 'createdAt' | 'updatedAt'>
): Promise<ProductCollection> {
  try {
    const collectionsRef = collection(db, 'collections');
    const docRef = await addDoc(collectionsRef, {
      ...collectionData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    return {
      id: docRef.id,
      ...collectionData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error creating collection:', error);
    throw new Error('فشل إنشاء المجموعة');
  }
}

export async function addProductToCollection(
  collectionId: string,
  productId: string
): Promise<void> {
  try {
    const collectionRef = doc(db, 'collections', collectionId);
    const collectionDoc = await getDoc(collectionRef);
    
    if (collectionDoc.exists()) {
      const currentProducts = collectionDoc.data().products || [];
      if (!currentProducts.includes(productId)) {
        await updateDoc(collectionRef, {
          products: [...currentProducts, productId],
          updatedAt: Timestamp.now()
        });
      }
    }
  } catch (error) {
    console.error('Error adding product to collection:', error);
    throw new Error('فشل إضافة المنتج للمجموعة');
  }
}

export async function removeProductFromCollection(
  collectionId: string,
  productId: string
): Promise<void> {
  try {
    const collectionRef = doc(db, 'collections', collectionId);
    const collectionDoc = await getDoc(collectionRef);
    
    if (collectionDoc.exists()) {
      const currentProducts = collectionDoc.data().products || [];
      await updateDoc(collectionRef, {
        products: currentProducts.filter((id: string) => id !== productId),
        updatedAt: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Error removing product from collection:', error);
    throw new Error('فشل إزالة المنتج من المجموعة');
  }
}

export async function getUserCollections(userId: string): Promise<ProductCollection[]> {
  try {
    const collectionsRef = collection(db, 'collections');
    const q = query(
      collectionsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate().toISOString() || new Date().toISOString()
      } as ProductCollection;
    });
  } catch (error) {
    console.error('Error getting user collections:', error);
    return [];
  }
}

export async function deleteCollection(collectionId: string): Promise<void> {
  try {
    const collectionRef = doc(db, 'collections', collectionId);
    await deleteDoc(collectionRef);
  } catch (error) {
    console.error('Error deleting collection:', error);
    throw new Error('فشل حذف المجموعة');
  }
}

// ==========================================
// Product Likes (الإعجابات)
// ==========================================

export async function likeProduct(userId: string, productId: string): Promise<void> {
  try {
    // التحقق من عدم وجود إعجاب مسبق
    const exists = await hasLikedProduct(userId, productId);
    if (exists) {
      throw new Error('تم الإعجاب بالمنتج مسبقاً');
    }

    const likesRef = collection(db, 'productLikes');
    await addDoc(likesRef, {
      userId,
      productId,
      likedAt: Timestamp.now()
    });

    // زيادة عدد الإعجابات في المنتج
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      likes: increment(1)
    });
  } catch (error) {
    console.error('Error liking product:', error);
    throw error;
  }
}

export async function unlikeProduct(userId: string, productId: string): Promise<void> {
  try {
    const likesRef = collection(db, 'productLikes');
    const q = query(
      likesRef,
      where('userId', '==', userId),
      where('productId', '==', productId),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      await deleteDoc(querySnapshot.docs[0].ref);
      
      // تقليل عدد الإعجابات في المنتج
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        likes: increment(-1)
      });
    }
  } catch (error) {
    console.error('Error unliking product:', error);
    throw new Error('فشل إلغاء الإعجاب');
  }
}

export async function hasLikedProduct(userId: string, productId: string): Promise<boolean> {
  try {
    const likesRef = collection(db, 'productLikes');
    const q = query(
      likesRef,
      where('userId', '==', userId),
      where('productId', '==', productId),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking product like:', error);
    return false;
  }
}

export async function getProductLikesCount(productId: string): Promise<number> {
  try {
    const productRef = doc(db, 'products', productId);
    const productDoc = await getDoc(productRef);
    
    if (productDoc.exists()) {
      return productDoc.data().likes || 0;
    }
    return 0;
  } catch (error) {
    console.error('Error getting product likes count:', error);
    return 0;
  }
}
