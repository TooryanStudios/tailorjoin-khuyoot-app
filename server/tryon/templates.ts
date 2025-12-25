export type ServerGarmentTemplate = {
  id: string;
  name: string;
  imageUrl: string;
};

import { getFirestore } from './firebaseAdmin.js';

// Server-authoritative mapping (prevents arbitrary template URLs).
export const SERVER_GARMENT_TEMPLATES: ServerGarmentTemplate[] = [
  {
    id: 'dishdasha',
    name: 'دشداشة',
    imageUrl:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'abaya',
    name: 'عباية',
    imageUrl:
      'https://images.unsplash.com/photo-1520975682031-a636b0d4823f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'dress',
    name: 'فستان',
    imageUrl:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'suit',
    name: 'بدلة',
    imageUrl:
      'https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=1200&q=80',
  },
];

const TRYON_TEMPLATES_COLLECTION = 'tryon_garment_templates';
const TEMPLATE_CACHE_MS = 60_000;
const templateCache = new Map<string, { ts: number; value: ServerGarmentTemplate | null }>();

export async function getTemplateById(id: string): Promise<ServerGarmentTemplate | null> {
  const cached = templateCache.get(id);
  if (cached && Date.now() - cached.ts < TEMPLATE_CACHE_MS) return cached.value;

  try {
    const snap = await getFirestore().collection(TRYON_TEMPLATES_COLLECTION).doc(id).get();
    if (snap.exists) {
      const data: any = snap.data() || {};
      const enabled = data.enabled !== false;
      const name = typeof data.name === 'string' ? data.name : '';
      const imageUrl = typeof data.imageUrl === 'string' ? data.imageUrl : '';

      if (enabled && name && imageUrl) {
        const tpl: ServerGarmentTemplate = { id, name, imageUrl };
        templateCache.set(id, { ts: Date.now(), value: tpl });
        return tpl;
      }
    }
  } catch {
    // Non-fatal: fall back to static mapping.
  }

  const fallback = SERVER_GARMENT_TEMPLATES.find((t) => t.id === id) || null;
  templateCache.set(id, { ts: Date.now(), value: fallback });
  return fallback;
}
