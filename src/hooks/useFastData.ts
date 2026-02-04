import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase'; 

export interface FastRegion {
  id: string;
  name: string;
  nameEn?: string;
  icon?: string;
  order: number;
  enabled: boolean;
}

const CACHE_KEY = 'khuyoot_regions_cache_v2';
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

// Helper to prevent long hangs on missing indexes/bad connections
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Operation timed out')), ms);
        promise.then(
            (res) => { clearTimeout(timer); resolve(res); },
            (err) => { clearTimeout(timer); reject(err); }
        );
    });
}

export function useFastRegions() {
  const [data, setData] = useState<FastRegion[]>(() => {
    // 1. Instantly load from LocalStorage
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_DURATION) {
            return parsed.data;
        }
      }
    } catch (e) {
      console.warn('FastRegion cache parse error:', e);
    }
    return [];
  });

  const [loading, setLoading] = useState(data.length === 0);

  useEffect(() => {
    let mounted = true;

    const fetchRegions = async () => {
      try {
        if (!db) {
            throw new Error('Firebase DB instance is undefined/null');
        }

        const regionsRef = collection(db, 'popularRegions');
        // Efficient query: active, ordered, limited
        const q = query(
          regionsRef, 
          where('enabled', '==', true), 
          orderBy('order', 'asc'), 
          limit(12)
        );
        
        // Timeout after 3s to trigger fallback quickly if index is missing
        const snapshot = await withTimeout(getDocs(q), 3000);
        
        if (!mounted) return;

        console.log('[FastData] fetched count:', snapshot.size);

        const regions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FastRegion[];

        setData(regions);
        setLoading(false);

        // Update cache
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          timestamp: Date.now(),
          data: regions
        }));
        
      } catch (err: any) {
        console.error('[FastData] Optimized fetch failed (likely missing index). logic:', err);
        
        // Parsing the error to see if it's an index issue would be ideal, 
        // but for now, let's just attempt the fallback to "Fetch All + Client Side Filter"
        if (mounted) {
             try {
                if (!db) throw new Error("DB missing");
                console.log('[FastData] Attempting fallback fetch (all docs)...');
                const regionsRef = collection(db, 'popularRegions');
                const snapshot = await getDocs(regionsRef);
                
                if (!mounted) return;

                const allRegions = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as FastRegion[];

                // Client-side Filter & Sort
                const filtered = allRegions
                    // Relaxed filter: Allow if enabled is true OR undefined (legacy), just exclude explicit false
                    .filter(r => r.enabled !== false) 
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .slice(0, 12);
                
                setData(filtered);
                setLoading(false);
                
                // Update cache
                localStorage.setItem(CACHE_KEY, JSON.stringify({
                    timestamp: Date.now(),
                    data: filtered
                }));

             } catch (fallbackErr) {
                 console.error('[FastData] Fallback failed:', fallbackErr);
                 setLoading(false);
             }
        }
      }
    };

    fetchRegions();

    return () => { mounted = false; };
  }, []);

  return { regions: data, loading };
}

export interface FastTailor {
  id: string;
  name: string;
  shopName: string;
  image: string;
  rating: number;
  location: string;
  specialization: string;
}

const TAILORS_CACHE_KEY = 'khuyoot_tailors_cache_v1';
const TAILORS_CACHE_DURATION = 1000 * 60 * 60 * 12; // 12 hours

export function useFastTailors() {
  const [data, setData] = useState<FastTailor[]>(() => {
    try {
      const cached = localStorage.getItem(TAILORS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < TAILORS_CACHE_DURATION) {
            return parsed.data;
        }
      }
    } catch (e) { console.warn(e); }
    return [];
  });

  const [loading, setLoading] = useState(data.length === 0);

  useEffect(() => {
    let mounted = true;
    const fetchTailors = async () => {
      try {
        if (!db) {
            console.warn('[FastData] DB missing for tailors fetch');
            setLoading(false);
            return;
        }
        
        // Optimize: Get tailors. In a real app we might need a composite index for role+status
        // specific query: role == 'tailor', status == 'approved'
        // For 'Fast' test, we can just get users and filter, or use a simple query if index exists.
        // Let's try flexible approach.
        
        const usersRef = collection(db, 'users');
        const q = query(
            usersRef, 
            where('role', '==', 'tailor'),
            where('approvalStatus', '==', 'approved'),
            limit(16)
        );

        // Timeout optimization
        const snapshot = await withTimeout(getDocs(q), 3000);
        if (!mounted) return;

        const tailors = snapshot.docs.map(doc => {
            const d = doc.data();
            return {
                id: doc.id,
                name: d.name || 'Unknown',
                shopName: d.shopName || d.name || 'Tailor Shop',
                image: d.image || d.profileImage || d.avatar || '',
                rating: Number(d.rating) || 0,
                location: d.location || d.region || '',
                specialization: d.specialization || ''
            };
        }) as FastTailor[];

        setData(tailors);
        setLoading(false);
        localStorage.setItem(TAILORS_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: tailors }));

      } catch (err) {
        if (mounted) {
            console.error('[FastData] Tailors fetch failed:', err);
             // Fallback: try fetching just by role if composite index is missing
             try {
                if(!db) {
                     setLoading(false);
                     return;
                }
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('role', '==', 'tailor'), limit(16));
                const snapshot = await getDocs(q);
                if(!mounted) return;
                
                const tailors = snapshot.docs.map(doc => {
                    const d = doc.data();
                    return {
                        id: doc.id,
                        name: d.name || 'Unknown',
                        shopName: d.shopName || d.name || 'Tailor Shop',
                        image: d.image || d.profileImage || d.avatar || '',
                        rating: Number(d.rating) || 0,
                        location: d.location || d.region || '',
                        specialization: d.specialization || ''
                    };
                }) as FastTailor[];
                setData(tailors);
                setLoading(false);
             } catch (e2) {
                 setLoading(false);
             }
        }
      }
    };
    fetchTailors();
    return () => { mounted = false; };
  }, []);

  return { tailors: data, loading };
}

export interface FastProduct {
    id: string;
    name: string;
    price: number;
    image: string;
    category?: string;
}

const PRODUCTS_CACHE_KEY = 'khuyoot_products_cache_v1';
const PRODUCTS_CACHE_DURATION = 1000 * 60 * 60 * 12; // 12 hours

export function useFastProducts() {
    const [data, setData] = useState<FastProduct[]>(() => {
        // Optimistic Load from Cache
        try {
            const cached = localStorage.getItem(PRODUCTS_CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Date.now() - parsed.timestamp < PRODUCTS_CACHE_DURATION) {
                    return parsed.data;
                }
            }
        } catch (e) {
            console.warn('FastProduct cache parse error:', e);
        }
        return [];
    });

    const [loading, setLoading] = useState(data.length === 0);

    useEffect(() => {
        let mounted = true;

        const fetchProducts = async () => {
            try {
                if (!db) {
                    console.error("DB missing for products fetch");
                    setLoading(false);
                    return;
                }

                console.log('[FastData] 1. Attempting to fetch from "fabricItems"...');
                // Strategy 1: Try Fabrics (Items with prices)
                const fabricsRef = collection(db, 'fabricItems');
                const q1 = query(fabricsRef, limit(16));
                const snap1 = await withTimeout(getDocs(q1), 3000).catch(e => ({ size: -1, docs: [] as any[] }));
                
                if (snap1.size > 0 && mounted) {
                     console.log('[FastData] Found fabrics:', snap1.size);
                     const items = snap1.docs.map(doc => {
                        const d = doc.data();
                        let mainImage = d.imageUrl || d.image || '';
                        if (Array.isArray(d.imageUrls) && d.imageUrls.length > 0) mainImage = d.imageUrls[0];
                        if (!mainImage && d.thumbnailUrl) mainImage = d.thumbnailUrl;

                        return {
                            id: doc.id,
                            name: d.name || d.nameAr || d.nameEn || 'Fabric Item',
                            price: Number(d.pricePerMeter || d.price) || 0,
                            image: mainImage,
                            category: d.categoryId || 'Fabric'
                        };
                     }) as FastProduct[];
                     setData(items);
                     setLoading(false);
                     localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: items }));
                     return;
                }

                console.log('[FastData] 2. "fabricItems" empty/failed. Attempting "productTemplates"...');
                
                // Strategy 2: Try Product Templates (Catalog)
                const templatesRef = collection(db, 'productTemplates');
                const q2 = query(templatesRef, limit(12));
                const snap2 = await getDocs(q2);

                if (mounted) {
                    console.log('[FastData] Found templates:', snap2.size);
                    const items = snap2.docs.map(doc => {
                        const d = doc.data();
                        return {
                            id: doc.id,
                            name: d.nameEn || d.nameAr || 'Product Template',
                            price: 0, // Templates might not have base price
                            image: d.defaultImage || (d.images && d.images[0]) || '',
                            category: d.category || 'Tailoring'
                        };
                    }) as FastProduct[];
                    
                    if (items.length === 0) {
                         // Strategy 3: Try generic 'products'
                         console.log('[FastData] 3. Templates empty. Trying "products"...');
                         try {
                              const pRef = collection(db, 'products');
                              const q3 = query(pRef, limit(8));
                              const snap3 = await getDocs(q3);
                              const pItems = snap3.docs.map(doc => ({
                                  id: doc.id,
                                  ...doc.data()
                              })) as any[];
                              // Best effort mapping
                              const finalItems = pItems.map(d => ({
                                  id: d.id,
                                  name: d.name || d.title || 'Product',
                                  price: d.price || 0,
                                  image: d.image || d.imageUrl || '',
                                  category: 'General'
                              }));
                              setData(finalItems);
                         } catch(e) { console.warn('Strategy 3 failed'); }
                    } else {
                        setData(items);
                    }
                    setLoading(false);
                     localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: items }));
                }

            } catch (err) {
                 if (mounted) {
                    console.error('[FastData] All products fetch strategies failed:', err);
                    setLoading(false);
                }
            }
        };

        fetchProducts();

        return () => { mounted = false; };
    }, []);

    return { products: data, loading };
}