import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  updateDoc,
  increment,
  Timestamp 
} from 'firebase/firestore';
import { DesignRecommendation, DesignAnalyticsEvent } from '../types';

const RECOMMENDATIONS_COLLECTION = 'design_recommendations';
const ANALYTICS_COLLECTION = 'design_analytics';

/**
 * Track a design event (creation, save, cart, purchase)
 * Used for building behavioral recommendations
 */
export const trackDesignEvent = async (
  userId: string,
  eventType: 'design_created' | 'design_saved' | 'added_to_cart' | 'purchased',
  designId: string,
  fabricId?: string,
  selectedOptionIds: string[] = []
): Promise<void> => {
  try {
    const eventData: Omit<DesignAnalyticsEvent, 'id'> = {
      userId,
      eventType,
      designId,
      fabricId,
      selectedOptionIds,
      timestamp: new Date().toISOString()
    };

    const eventRef = doc(collection(db, ANALYTICS_COLLECTION));
    await setDoc(eventRef, eventData);

    // If it's a purchase, update recommendation scores
    if (eventType === 'purchased' && fabricId && selectedOptionIds.length > 0) {
      await updateRecommendationScores(fabricId, selectedOptionIds);
    }
  } catch (error) {
    console.error('Error tracking design event:', error);
  }
};

/**
 * Update recommendation scores based on co-occurrence
 * Called when a design is purchased
 */
const updateRecommendationScores = async (
  fabricId: string,
  optionIds: string[]
): Promise<void> => {
  try {
    // Create fabric → option recommendations
    for (const optionId of optionIds) {
      const recId = `${fabricId}_${optionId}`;
      const recRef = doc(db, RECOMMENDATIONS_COLLECTION, recId);
      const recDoc = await getDoc(recRef);

      if (recDoc.exists()) {
        // Increment existing score
        await updateDoc(recRef, {
          score: increment(1),
          updatedAt: new Date().toISOString()
        });
      } else {
        // Create new recommendation
        const newRec: DesignRecommendation = {
          id: recId,
          primaryItemId: fabricId,
          primaryItemType: 'fabric',
          recommendedItemId: optionId,
          recommendedItemType: 'option',
          score: 1,
          ruleType: 'behavioral',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setDoc(recRef, newRec);
      }
    }

    // Create option → option recommendations (pairs)
    for (let i = 0; i < optionIds.length; i++) {
      for (let j = i + 1; j < optionIds.length; j++) {
        const recId = `${optionIds[i]}_${optionIds[j]}`;
        const recRef = doc(db, RECOMMENDATIONS_COLLECTION, recId);
        const recDoc = await getDoc(recRef);

        if (recDoc.exists()) {
          await updateDoc(recRef, {
            score: increment(1),
            updatedAt: new Date().toISOString()
          });
        } else {
          const newRec: DesignRecommendation = {
            id: recId,
            primaryItemId: optionIds[i],
            primaryItemType: 'option',
            recommendedItemId: optionIds[j],
            recommendedItemType: 'option',
            score: 1,
            ruleType: 'behavioral',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await setDoc(recRef, newRec);
        }
      }
    }
  } catch (error) {
    console.error('Error updating recommendation scores:', error);
  }
};

/**
 * Get recommendations for a specific item (fabric or option)
 * Returns top N recommendations sorted by score
 */
export const getRecommendations = async (
  itemId: string,
  itemType: 'fabric' | 'option',
  maxResults: number = 3
): Promise<DesignRecommendation[]> => {
  try {
    const q = query(
      collection(db, RECOMMENDATIONS_COLLECTION),
      where('primaryItemId', '==', itemId),
      where('primaryItemType', '==', itemType),
      where('isActive', '==', true),
      orderBy('score', 'desc'),
      limit(maxResults)
    );

    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DesignRecommendation));

    // Fallback to mock data if no real recommendations exist (for demo/prototype)
    if (results.length === 0) {
      return getMockRecommendations(itemId, itemType, maxResults);
    }

    return results;
  } catch (error: any) {
    // If index is not ready yet or no data exists, return mock data
    if (error?.code === 'failed-precondition' || error?.code === 'unavailable') {
      console.warn('⚠️ Firestore index not ready yet. Returning mock recommendations.');
      return getMockRecommendations(itemId, itemType, maxResults);
    }
    console.error('Error fetching recommendations:', error);
    return getMockRecommendations(itemId, itemType, maxResults);
  }
};

/**
 * Generate mock recommendations for demo purposes
 */
const getMockRecommendations = (
  itemId: string, 
  itemType: 'fabric' | 'option', 
  limit: number
): DesignRecommendation[] => {
  // Simple logic to return relevant mock items based on input
  const mocks: DesignRecommendation[] = [];
  
  // If it's a neck option, recommend sleeves or embroidery
  if (itemType === 'option' && itemId.startsWith('neck')) {
    mocks.push({
      id: `mock-rec-${Date.now()}-1`,
      primaryItemId: itemId,
      primaryItemType: itemType,
      recommendedItemId: 'sleeve-long', // Recommend Long Sleeve
      recommendedItemType: 'option',
      score: 95,
      ruleType: 'manual',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    mocks.push({
      id: `mock-rec-${Date.now()}-2`,
      primaryItemId: itemId,
      primaryItemType: itemType,
      recommendedItemId: 'emb-chest', // Recommend Chest Embroidery
      recommendedItemType: 'option',
      score: 85,
      ruleType: 'manual',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  // If it's a sleeve option, recommend neck or embroidery
  else if (itemType === 'option' && itemId.startsWith('sleeve')) {
    mocks.push({
      id: `mock-rec-${Date.now()}-1`,
      primaryItemId: itemId,
      primaryItemType: itemType,
      recommendedItemId: 'neck-v', // Recommend V Neck
      recommendedItemType: 'option',
      score: 92,
      ruleType: 'manual',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    mocks.push({
      id: `mock-rec-${Date.now()}-2`,
      primaryItemId: itemId,
      primaryItemType: itemType,
      recommendedItemId: 'emb-collar', // Recommend Collar Embroidery
      recommendedItemType: 'option',
      score: 80,
      ruleType: 'manual',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  // If it's an embroidery option, recommend neck or sleeves
  else if (itemType === 'option' && itemId.startsWith('emb')) {
    mocks.push({
      id: `mock-rec-${Date.now()}-1`,
      primaryItemId: itemId,
      primaryItemType: itemType,
      recommendedItemId: 'neck-collar', // Recommend Collar Neck
      recommendedItemType: 'option',
      score: 88,
      ruleType: 'manual',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    mocks.push({
      id: `mock-rec-${Date.now()}-2`,
      primaryItemId: itemId,
      primaryItemType: itemType,
      recommendedItemId: 'sleeve-short', // Recommend Short Sleeve
      recommendedItemType: 'option',
      score: 78,
      ruleType: 'manual',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  // If it's a fabric, recommend a style
  else if (itemType === 'fabric') {
    mocks.push({
      id: `mock-rec-${Date.now()}-3`,
      primaryItemId: itemId,
      primaryItemType: itemType,
      recommendedItemId: 'neck-v',
      recommendedItemType: 'option',
      score: 90,
      ruleType: 'manual',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  return mocks.slice(0, limit);
};

/**
 * Create a manual recommendation (rule-based)
 * Used by admins to define specific recommendations
 */
export const createManualRecommendation = async (
  primaryItemId: string,
  primaryItemType: 'fabric' | 'option',
  recommendedItemId: string,
  recommendedItemType: 'fabric' | 'option',
  score: number = 100
): Promise<void> => {
  try {
    const recId = `manual_${primaryItemId}_${recommendedItemId}`;
    const recData: DesignRecommendation = {
      id: recId,
      primaryItemId,
      primaryItemType,
      recommendedItemId,
      recommendedItemType,
      score,
      ruleType: 'manual',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, RECOMMENDATIONS_COLLECTION, recId), recData);
  } catch (error) {
    console.error('Error creating manual recommendation:', error);
    throw error;
  }
};

/**
 * Toggle recommendation active status (enable/disable)
 */
export const toggleRecommendation = async (
  recommendationId: string,
  isActive: boolean
): Promise<void> => {
  try {
    const recRef = doc(db, RECOMMENDATIONS_COLLECTION, recommendationId);
    await updateDoc(recRef, {
      isActive,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error toggling recommendation:', error);
    throw error;
  }
};

/**
 * Get all recommendations (for admin panel)
 */
export const getAllRecommendations = async (): Promise<DesignRecommendation[]> => {
  try {
    const q = query(
      collection(db, RECOMMENDATIONS_COLLECTION),
      orderBy('score', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DesignRecommendation));
  } catch (error) {
    console.error('Error fetching all recommendations:', error);
    return [];
  }
};

/**
 * Calculate auto-scale suggestion for fabric pattern
 * Based on image dimensions and pattern detection
 */
export const calculateAutoScale = (
  imageWidth: number,
  imageHeight: number,
  patternRepeatWidth?: number
): number => {
  // Simple heuristic: if image is very large (close-up), suggest smaller scale
  const avgDimension = (imageWidth + imageHeight) / 2;
  
  // Assume standard garment display is ~500px
  const targetSize = 500;
  
  if (avgDimension > 1500) {
    // Very close-up image, scale down significantly
    return 0.3;
  } else if (avgDimension > 1000) {
    // Close-up, scale down moderately
    return 0.5;
  } else if (avgDimension < 300) {
    // Small sample, might need to scale up
    return 1.5;
  }
  
  // Default scale
  return 1.0;
};

export const recommendationService = {
  trackDesignEvent,
  getRecommendations,
  createManualRecommendation,
  toggleRecommendation,
  getAllRecommendations,
  calculateAutoScale
};
