import { useCallback, useEffect, useMemo, useState } from 'react';
import { firebaseService } from '../../../services/firebase';

const CLOSET_STORAGE_KEY = 'khuyoot_template_closet_v1';
const CLOSET_LIMIT = 10;

/** @typedef {{ premium?: boolean; label?: string; source?: 'studio'|'shop'|'closet' }} TemplateMeta */
/** @typedef {{ id: string; name: string; imageUrl: string; thumbnailUrl: string; meta?: TemplateMeta; file?: File }} Template */

function safeJsonParse(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function safeReadCloset() {
  try {
    const parsed = safeJsonParse(window.localStorage.getItem(CLOSET_STORAGE_KEY));
    if (!Array.isArray(parsed)) return [];

    // Ensure required fields exist
    return parsed
      .filter((t) => t && typeof t.id === 'string' && typeof t.name === 'string')
      .map((t) => ({
        id: t.id,
        name: t.name,
        imageUrl: t.imageUrl,
        thumbnailUrl: t.thumbnailUrl,
        meta: t.meta || { source: 'closet' },
      }));
  } catch {
    return [];
  }
}

function safeWriteCloset(templates) {
  try {
    window.localStorage.setItem(CLOSET_STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // ignore quota/security errors
  }
}

function makeId(prefix) {
  try {
    return `${prefix}-${crypto.randomUUID()}`;
  } catch {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function defaultStudioTemplates() {
  return [
    {
      id: 'studio-portrait-1',
      name: 'Studio Portrait 01',
      imageUrl: 'https://placehold.co/1200x1600/111/fff?text=Studio+01',
      thumbnailUrl: 'https://placehold.co/600x800/111/fff?text=Studio+01',
      meta: { source: 'studio' },
    },
    {
      id: 'studio-portrait-2',
      name: 'Studio Portrait 02',
      imageUrl: 'https://placehold.co/1200x1600/111/fff?text=Studio+02',
      thumbnailUrl: 'https://placehold.co/600x800/111/fff?text=Studio+02',
      meta: { source: 'studio' },
    },
    {
      id: 'studio-portrait-3',
      name: 'Studio Portrait 03',
      imageUrl: 'https://placehold.co/1200x1600/111/fff?text=Studio+03',
      thumbnailUrl: 'https://placehold.co/600x800/111/fff?text=Studio+03',
      meta: { source: 'studio' },
    },
    {
      id: 'studio-portrait-4',
      name: 'Studio Portrait 04',
      imageUrl: 'https://placehold.co/1200x1600/111/fff?text=Studio+04',
      thumbnailUrl: 'https://placehold.co/600x800/111/fff?text=Studio+04',
      // Mark one default Studio item as premium so the lock UI is visible even
      // when Firebase templates are not configured.
      meta: { source: 'studio', premium: true, label: 'premium' },
    },
  ];
}

function defaultShopTemplates() {
  return [
    {
      id: 'shop-look-1',
      name: 'Shop Look 01',
      imageUrl: 'https://placehold.co/1200x1600/222/fff?text=Shop+01',
      thumbnailUrl: 'https://placehold.co/600x800/222/fff?text=Shop+01',
      meta: { source: 'shop', premium: true },
    },
    {
      id: 'shop-look-2',
      name: 'Shop Look 02',
      imageUrl: 'https://placehold.co/1200x1600/222/fff?text=Shop+02',
      thumbnailUrl: 'https://placehold.co/600x800/222/fff?text=Shop+02',
      meta: { source: 'shop', premium: true },
    },
    {
      id: 'shop-look-3',
      name: 'Shop Look 03',
      imageUrl: 'https://placehold.co/1200x1600/222/fff?text=Shop+03',
      thumbnailUrl: 'https://placehold.co/600x800/222/fff?text=Shop+03',
      meta: { source: 'shop', premium: false },
    },
    {
      id: 'shop-look-4',
      name: 'Shop Look 04',
      imageUrl: 'https://placehold.co/1200x1600/222/fff?text=Shop+04',
      thumbnailUrl: 'https://placehold.co/600x800/222/fff?text=Shop+04',
      meta: { source: 'shop', premium: false },
    },
  ];
}

export const useTemplateStore = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [closetTemplates, setClosetTemplates] = useState(() => safeReadCloset());
  const [remoteStudioTemplates, setRemoteStudioTemplates] = useState(null);
  const [remoteShopTemplates, setRemoteShopTemplates] = useState(null);
  const [remoteClosetTemplates, setRemoteClosetTemplates] = useState(null);

  const studioTemplates = useMemo(() => {
    if (Array.isArray(remoteStudioTemplates) && remoteStudioTemplates.length > 0) return remoteStudioTemplates;
    return defaultStudioTemplates();
  }, [remoteStudioTemplates]);

  const shopTemplates = useMemo(() => {
    if (Array.isArray(remoteShopTemplates) && remoteShopTemplates.length > 0) return remoteShopTemplates;
    return defaultShopTemplates();
  }, [remoteShopTemplates]);

  const effectiveClosetTemplates = useMemo(() => {
    if (Array.isArray(remoteClosetTemplates)) return remoteClosetTemplates;
    return closetTemplates;
  }, [closetTemplates, remoteClosetTemplates]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!firebaseService?.isInitialized?.() ) return;

        const list = await firebaseService.getTryOnGarmentTemplates({ resolveStorageUrls: true });
        if (cancelled) return;

        const mapped = (list || [])
          .filter((t) => t && t.id && t.name && t.imageUrl)
          .map((t) => ({
            id: String(t.id),
            name: String(t.name),
            imageUrl: String(t.imageUrl),
            thumbnailUrl: String(t.thumbnailUrl || t.imageUrl),
            meta: {
              // Keep premium items in Studio so they can be shown locked.
              // (Shop can still show a premium subset.)
              source: 'studio',
              premium: t.isPremium === true,
              ...(t.isPremium ? { label: 'premium' } : {}),
            },
          }));

        const studio = mapped;
        const shop = mapped.filter((t) => t.meta?.premium === true);

        setRemoteStudioTemplates(studio);
        setRemoteShopTemplates(shop);
      } catch {
        // Ignore and fall back to local defaults
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!firebaseService?.isInitialized?.()) return;
        const userId = firebaseService?.auth?.currentUser?.uid;
        if (!userId) return;

        const list = await firebaseService.getUserTemplates(userId);
        if (cancelled) return;

        const mapped = (list || [])
          .filter((t) => t && t.id && t.name && t.imageUrl)
          .map((t) => ({
            id: String(t.id),
            name: String(t.name),
            imageUrl: String(t.imageUrl),
            thumbnailUrl: String(t.thumbnailUrl || t.imageUrl),
            meta: { source: 'closet' },
          }));

        setRemoteClosetTemplates(mapped);
      } catch {
        // Ignore and fall back to local storage
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectTemplate = useCallback((template) => {
    setSelectedTemplate(template || null);
  }, []);

  const addToCloset = useCallback(async (file, name) => {
    // Prefer Firebase persistence if available + logged in.
    try {
      if (firebaseService?.isInitialized?.()) {
        const userId = firebaseService?.auth?.currentUser?.uid;
        if (userId) {
          const imageUrl = await firebaseService.uploadUserTemplate({ userId, file });
          const id = await firebaseService.saveUserTemplate({
            userId,
            name: name || file.name || 'Upload',
            imageUrl,
            thumbnailUrl: imageUrl,
          });

          const template = {
            id,
            name: name || file.name || 'Upload',
            imageUrl,
            thumbnailUrl: imageUrl,
            meta: { source: 'closet' },
          };

          setRemoteClosetTemplates((prev) => {
            const next = [template, ...(prev || [])].slice(0, CLOSET_LIMIT);
            return next;
          });

          return template;
        }
      }
    } catch {
      // Fall through to local storage
    }

    const dataUrl = await fileToDataUrl(file);
    const id = makeId('closet');
    const template = {
      id,
      name: name || file.name || 'Upload',
      imageUrl: dataUrl,
      thumbnailUrl: dataUrl,
      meta: { source: 'closet' },
      file,
    };

    setClosetTemplates((prev) => {
      const next = [template, ...(prev || [])].slice(0, CLOSET_LIMIT);
      safeWriteCloset(next.map(({ file: _file, ...rest }) => rest));
      return next;
    });

    return template;
  }, []);

  return {
    selectedTemplate,
    selectTemplate,
    studioTemplates,
    shopTemplates,
    closetTemplates: effectiveClosetTemplates,
    addToCloset,
  };
};
