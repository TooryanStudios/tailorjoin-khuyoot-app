import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

export type FabricCategory = {
  id: string;
  name?: string;
  nameAr?: string;
  description?: string;
  order?: number;
};

export type FabricItem = {
  id: string;
  categoryId: string;
  name?: string;
  nameAr?: string;
  code?: string;
  imageUrl?: string;
  imageUrls?: string[];
  thumbnailUrl?: string;
  thumbnailUrls?: string[];
  pricePerMeter?: number;
};

export function getFabricCoverUrl(item: Partial<FabricItem> | null | undefined): string {
  if (!item) return '';
  const urls = Array.isArray(item.imageUrls) ? item.imageUrls : [];
  return (urls[0] || item.imageUrl || '').toString();
}

export function getFabricCoverThumbnailUrl(item: Partial<FabricItem> | null | undefined): string {
  if (!item) return '';
  const thumbs = Array.isArray(item.thumbnailUrls) ? item.thumbnailUrls : [];
  return (thumbs[0] || item.thumbnailUrl || '').toString();
}

export async function getFabricCategories(): Promise<FabricCategory[]> {
  try {
    const q = query(collection(db, 'fabricCategories'), orderBy('order', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as FabricCategory[];
  } catch (error) {
    console.error('Error getting fabric categories:', error);
    return [];
  }
}

export async function getFabricsByCategoryId(categoryId: string): Promise<FabricItem[]> {
  try {
    const q = query(collection(db, 'fabricItems'), where('categoryId', '==', categoryId), orderBy('name', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as FabricItem[];
  } catch (error) {
    console.error('Error getting fabrics by category:', error);
    return [];
  }
}

export async function getFabricItemById(itemId: string): Promise<FabricItem | null> {
  try {
    const ref = doc(db, 'fabricItems', itemId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as any) } as FabricItem;
  } catch (error) {
    console.error('Error getting fabric item:', error);
    return null;
  }
}
