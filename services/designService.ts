import { firebaseService, db } from './firebase';
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';

export interface PersistedDesign {
  id: string;
  userId: string;
  selectedTemplate: string;
  fabricSource: 'khuyoot' | 'shops' | 'upload' | null;
  khuyoot?: { fabricId: string; name?: string; imageUrl: string; settings: any } | null;
  shops?: { shopId: string; shopName?: string; fabricId: string; imageUrl: string; settings: any } | null;
  upload?: { fileName: string; imageUrl: string; settings: any } | null;
  fabricId: string | null;
  fabricImage: string | null;
  fabricSettings: any;
  selections: Record<string, { id: string; name: string; price?: number; thumbnailUrl: string } | null>;
  generatedImage: string | null;
  tryOnJobId?: string | null;
  tryOnResultUrl?: string | null;
  createdAt: number;
  updatedAt: number;
}

const LOCAL_KEY_PREFIX = 'designs_';

export const designService = {
  async saveDesign(design: PersistedDesign): Promise<void> {
    if (firebaseService.isInitialized()) {
      try {
        const ref = doc(db, `users/${design.userId}/designs`, design.id);
        await setDoc(ref, design, { merge: true });
        return;
      } catch (e) {
        console.warn('saveDesign firestore error, falling back to local', e);
      }
    }
    {
      const key = `${LOCAL_KEY_PREFIX}${design.userId}`;
      const listRaw = localStorage.getItem(key);
      const list: PersistedDesign[] = listRaw ? JSON.parse(listRaw) : [];
      const idx = list.findIndex(d => d.id === design.id);
      if (idx >= 0) list[idx] = design; else list.push(design);
      localStorage.setItem(key, JSON.stringify(list));
    }
  },

  async listDesigns(userId: string): Promise<PersistedDesign[]> {
    if (firebaseService.isInitialized()) {
      try {
        const coll = collection(db, `users/${userId}/designs`);
        const snap = await getDocs(coll);
        const results: PersistedDesign[] = [];
        snap.forEach(d => {
          const data = d.data() as PersistedDesign;
          results.push({ ...data, id: d.id });
        });
        return results;
      } catch (e) {
        console.warn('listDesigns firestore error, using local fallback', e);
      }
    }
    const key = `${LOCAL_KEY_PREFIX}${userId}`;
    const listRaw = localStorage.getItem(key);
    return listRaw ? JSON.parse(listRaw) : [];
  },

  async getDesign(userId: string, id: string): Promise<PersistedDesign | null> {
    if (firebaseService.isInitialized()) {
      try {
        const ref = doc(db, `users/${userId}/designs`, id);
        const snap = await getDoc(ref);
        if (!snap.exists()) return null;
        const data = snap.data() as PersistedDesign;
        return { ...data, id: snap.id };
      } catch (e) {
        console.warn('getDesign firestore error, using local fallback', e);
      }
    }
    const key = `${LOCAL_KEY_PREFIX}${userId}`;
    const listRaw = localStorage.getItem(key);
    const list: PersistedDesign[] = listRaw ? JSON.parse(listRaw) : [];
    return list.find(d => d.id === id) || null;
  },

  async deleteDesign(userId: string, id: string): Promise<void> {
    if (firebaseService.isInitialized()) {
      try {
        const ref = doc(db, `users/${userId}/designs`, id);
        await deleteDoc(ref);
        return;
      } catch (e) {
        console.warn('deleteDesign firestore error, falling back to local', e);
      }
    }
    const key = `${LOCAL_KEY_PREFIX}${userId}`;
    const listRaw = localStorage.getItem(key);
    const list: PersistedDesign[] = listRaw ? JSON.parse(listRaw) : [];
    const next = list.filter(d => d.id !== id);
    localStorage.setItem(key, JSON.stringify(next));
  }
};
