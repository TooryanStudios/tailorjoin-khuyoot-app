import * as firebaseApp from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where, doc, setDoc, getDoc, addDoc, deleteDoc, orderBy, limit, updateDoc, deleteField, setLogLevel, collectionGroup, serverTimestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { User, Product, UserRole, AppSettings, MeasurementTemplate } from '../types';
import { applyUserDefaults } from '../utils/userDefaults';

// Mock products for fallback (not needed for tailor join)
const MOCK_PRODUCTS: Product[] = [];

// Firebase Configuration - Using Environment Variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app;
let auth: any;
let db: any;
let storage: any;
let isFirebaseInitialized = false;

const LOCAL_MEASUREMENT_TEMPLATES_KEY = 'khuyoot_measurement_templates';

const SAMPLE_MEASUREMENT_TEMPLATES: MeasurementTemplate[] = [
  {
    id: 'sample-dishdasha',
    name: 'قالب دشداشة أساسي',
    productType: 'dishdasha',
    baseImageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=60',
    points: [
      { id: 'neck', label: 'محيط الرقبة', x: 0.48, y: 0.1, direction: -90, order: 1 },
      { id: 'shoulder', label: 'الكتف', x: 0.36, y: 0.16, direction: 0, order: 2 },
      { id: 'chest', label: 'الصدر', x: 0.52, y: 0.25, direction: 90, order: 3 },
      { id: 'waist', label: 'الخصر', x: 0.5, y: 0.4, direction: 110, order: 4 },
      { id: 'hip', label: 'الحوض', x: 0.5, y: 0.52, direction: 120, order: 5 },
      { id: 'length', label: 'الطول', x: 0.62, y: 0.8, direction: 180, order: 6 }
    ],
    description: 'نموذج افتراضي لقياسات الدشداشة يمكن نسخه والتعديل عليه.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const loadLocalMeasurementTemplates = (): MeasurementTemplate[] => {
  if (typeof localStorage === 'undefined') return SAMPLE_MEASUREMENT_TEMPLATES;
  try {
    const raw = localStorage.getItem(LOCAL_MEASUREMENT_TEMPLATES_KEY);
    if (!raw) return SAMPLE_MEASUREMENT_TEMPLATES;
    const parsed = JSON.parse(raw) as MeasurementTemplate[];
    if (!Array.isArray(parsed) || parsed.length === 0) return SAMPLE_MEASUREMENT_TEMPLATES;
    return parsed;
  } catch (error) {
    console.warn('Unable to read measurement templates from local storage', error);
    return SAMPLE_MEASUREMENT_TEMPLATES;
  }
};

const persistLocalMeasurementTemplates = (templates: MeasurementTemplate[]) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_MEASUREMENT_TEMPLATES_KEY, JSON.stringify(templates));
  } catch (error) {
    console.warn('Unable to persist measurement templates locally', error);
  }
};

try {
  app = firebaseApp.initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  // Reduce Firestore log noise (especially offline warnings) to errors only
  try { setLogLevel('error'); } catch {}
  storage = getStorage(app);
  isFirebaseInitialized = true;
  console.log("✅ Firebase initialized successfully");
  console.log("📦 Storage Bucket:", firebaseConfig.storageBucket);
} catch (error) {
  console.error("❌ Firebase Initialization Error:", error);
  console.error("🔧 Check your .env file and Firebase config");
}

// Helper to map Firebase User to App User (Basic)
export const mapFirebaseUser = (fbUser: FirebaseUser): User => {
  return {
    id: fbUser.uid,
    name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
    email: fbUser.email || '',
    avatar: fbUser.photoURL || undefined,
    isGuest: false,
    joinDate: fbUser.metadata.creationTime ? new Date(fbUser.metadata.creationTime).toLocaleDateString('ar-OM') : new Date().toLocaleDateString('ar-OM'),
    role: 'user' // Default, will be overwritten by Firestore fetch
  };
};

// Export db and storage for use in other services
export { db, storage };

// Module-scoped normalization helper to avoid `this` binding pitfalls
function normalizeProductForSave(payload: any): any {
  const out: any = { ...payload };

  const arr = Array.isArray(out.images) ? out.images.filter(Boolean) : [];
  const legacy = Array.isArray(out.imageUrls) ? out.imageUrls.filter(Boolean) : [];

  if (arr.length === 0 && legacy.length > 0) {
    out.images = legacy.slice();
  } else if (arr.length > 0) {
    out.images = arr;
  } else if (out.image) {
    out.images = [out.image];
  } else {
    out.images = [];
  }

  if (typeof out.coverImageIndex !== 'number' || out.coverImageIndex < 0 || out.coverImageIndex >= out.images.length) {
    out.coverImageIndex = 0;
  }
  if (!out.image || (out.images.length > 0 && out.image !== out.images[out.coverImageIndex])) {
    out.image = out.images[out.coverImageIndex] || out.image || '';
  }

  if (!out.categoryId) {
    out.categoryId = (typeof out.category === 'string' && out.category.trim()) ? out.category : 'dishdasha';
  }

  return out;
}

export const firebaseService = {
  isInitialized: () => isFirebaseInitialized,
  auth: auth,
  
  async findUserByLoginId(loginId: string): Promise<{ uid: string; email: string | '' } | null> {
    if (!isFirebaseInitialized) return null;
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('loginId', '==', loginId));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const docSnap = snap.docs[0];
      const data: any = docSnap.data();
      return { uid: docSnap.id, email: data.email || '' };
    } catch (e) {
      console.error('findUserByLoginId error', e);
      return null;
    }
  },

  async findUserByPhone(phoneDigits: string): Promise<{ uid: string; email: string | '' } | null> {
    if (!isFirebaseInitialized) return null;
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phone', '==', phoneDigits));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const docSnap = snap.docs[0];
      const data: any = docSnap.data();
      return { uid: docSnap.id, email: data.email || '' };
    } catch (e) {
      console.error('findUserByPhone error', e);
      return null;
    }
  },

  async getUserById(uid: string): Promise<any | null> {
    if (!isFirebaseInitialized) return null;
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) return null;
      return snap.data();
    } catch (e) {
      console.error('getUserById error', e);
      return null;
    }
  },
  generateTempEmailFromPhone(phoneDigits: string): string {
    const digits = (phoneDigits || '').replace(/[^0-9]/g, '');
    return `${digits}@khuyoot.app`;
  },
  
  async login(email: string, pass: string): Promise<User> {
    if (!isFirebaseInitialized) throw new Error("Firebase not configured");
    const credential = await signInWithEmailAndPassword(auth, email, pass);
    return mapFirebaseUser(credential.user);
  },

  async register(email: string, pass: string, name: string, role: UserRole, merchantInfo?: any): Promise<User> {
    if (!isFirebaseInitialized) throw new Error("Firebase not configured");
    
    console.log('🔍 Register Debug:', { role, merchantInfo });
    
    const credential = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(credential.user, { displayName: name });
    
    // Save User Data to Firestore
    try {
      const userData: any = {
        id: credential.user.uid,
        uid: credential.user.uid,
        name,
        email,
        role: role,
        joinDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
        profileImage: '',
        boardImage: '',
        bio: '',
        createdByAdmin: false,
        requirePasswordChange: false
      };

      // Add merchant info if provided
      if (merchantInfo) {
        console.log('📦 Merchant Info:', merchantInfo);
        if (merchantInfo.shopType) userData.shopType = merchantInfo.shopType;
        if (merchantInfo.phone) userData.phone = merchantInfo.phone;
        if (merchantInfo.loginId) userData.loginId = merchantInfo.loginId;
        if (merchantInfo.gender) userData.gender = merchantInfo.gender; // حفظ الجنس
        if (merchantInfo.region) userData.region = merchantInfo.region; // حفظ المنطقة
        if (merchantInfo.ageGroup) userData.ageGroup = merchantInfo.ageGroup; // حفظ الفئة العمرية
        if (merchantInfo.tailorGender) userData.tailorGender = merchantInfo.tailorGender; // حفظ تخصص الخياط
        if (merchantInfo.location) userData.location = merchantInfo.location;
        if (merchantInfo.specialization) userData.specialization = merchantInfo.specialization;
        if (merchantInfo.experience) userData.experience = merchantInfo.experience || '';
        
        // For tailor role, add shopName (same as name if not provided)
        if (role === 'tailor' && !userData.shopName) {
          userData.shopName = name;
        }
        
        // For merchants, set approval status as pending
        if (role === 'tailor' || role === 'shop') {
          userData.approvalStatus = 'pending';
        }
      }

      console.log('💾 Saving to Firestore:', userData);
      await setDoc(doc(db, 'users', credential.user.uid), userData);
    } catch (e) {
      console.error("Error saving user data", e);
    }

    const user = mapFirebaseUser(credential.user);
    user.role = role;
    if (merchantInfo?.phone) user.phone = merchantInfo.phone;
    if (merchantInfo?.gender) user.gender = merchantInfo.gender; // إضافة الجنس للكائن المرتجع
    if (merchantInfo?.tailorGender) user.tailorGender = merchantInfo.tailorGender; // إضافة تخصص الخياط
    if (merchantInfo?.shopType) user.shopType = merchantInfo.shopType;
    return user;
  },

  async getUserProfile(uid: string): Promise<User | null> {
    if (!isFirebaseInitialized) return null;
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const rawData = docSnap.data();
        // Apply defaults to ensure all fields exist
        const normalizedUser = applyUserDefaults(rawData, uid);
        return normalizedUser as any;
      }
      return null;
    } catch (e) {
      console.error("Error fetching user profile", e);
      return null;
    }
  },

  async updateUserProfile(uid: string, data: Partial<User>): Promise<void> {
    if (!isFirebaseInitialized) throw new Error("Firebase not initialized");
    try {
        const userRef = doc(db, 'users', uid);
        await setDoc(userRef, data, { merge: true });
        
        // Also update auth profile if name/photo changed
        if (auth.currentUser && (data.name || data.profileImage)) {
            await updateProfile(auth.currentUser, {
                displayName: data.name,
                photoURL: data.profileImage
            });
        }
    } catch (e) {
        console.error("Error updating profile", e);
        throw e;
    }
  },

  async logout(): Promise<void> {
    if (!isFirebaseInitialized) return;
    await signOut(auth);
  },

  async getProducts(category?: string): Promise<Product[]> {
    if (!isFirebaseInitialized) {
      return new Promise(resolve => {
        if (category && category !== 'all') {
          resolve(MOCK_PRODUCTS.filter(p => p.category === category));
        } else {
          resolve(MOCK_PRODUCTS);
        }
      });
    }

    try {
      // Use collectionGroup to query products from all users' subcollections
      const productsGroup = collectionGroup(db, 'products');
      
      // Query without isDraft filter (index not ready yet), filter in memory instead
      let q;
      if (category && category !== 'all') {
        q = query(productsGroup, where('category', '==', category));
      } else {
        q = query(productsGroup);
      }

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return [];
      }

      const products: Product[] = [];
      snapshot.forEach(doc => {
        const data = doc.data() as any;
        // Filter out drafts in memory
        if (data.isDraft !== true) {
          products.push({ id: doc.id, ...data } as Product);
        }
      });
      
      return products;
    } catch (error) {
      console.error("Error fetching products from Firebase:", error);
      return [];
    }
  },

  // Admin: fetch all products across all shops (including drafts)
  async getAllProducts(): Promise<any[]> {
    if (!isFirebaseInitialized) {
      return MOCK_PRODUCTS as any[];
    }
    try {
      const productsGroup = collectionGroup(db, 'products');
      const snapshot = await getDocs(productsGroup);
      const products: any[] = [];
      snapshot.forEach(d => {
        const data = d.data() as any;
        products.push({ id: d.id, ...data });
      });
      return products;
    } catch (error) {
      console.error('Error fetching all products:', error);
      return [];
    }
  },

  // جلب كل منتجات التاجر (بما فيها المسودات) - للاستخدام في صفحة إدارة المنتجات
  async getProductsByTailorId(tailorId: string): Promise<Product[]> {
    if (!isFirebaseInitialized) {
      console.warn("Firebase not initialized, returning mock data");
      return MOCK_PRODUCTS.filter(p => p.tailorId === tailorId);
    }

    try {
      // Query from users/{tailorId}/products subcollection
      const productsRef = collection(db, `users/${tailorId}/products`);
      const snapshot = await getDocs(productsRef);
      
      if (snapshot.empty) {
        return [];
      }

      const products: Product[] = [];
      snapshot.forEach(doc => {
        products.push({ id: doc.id, ...doc.data() } as Product);
      });
      
      return products;
    } catch (error) {
      console.error("Error fetching tailor products:", error);
      return [];
    }
  },

    // --- Order Drafts (Firebase-backed with local mirror) ---
    async saveOrderDraft(draft: any): Promise<string> {
      try {
        const id = draft.id || `draft_${Date.now()}`;
        const uid = draft.userId || 'guest';
        if (isFirebaseInitialized) {
          await setDoc(doc(db, 'orderDrafts', `${uid}__${id}`), { ...draft, id });
        }
        // Local mirror per user
        try {
          const key = `order_drafts_${uid}`;
          const existing = JSON.parse(localStorage.getItem(key) || '[]');
          const filtered = Array.isArray(existing) ? existing.filter((d: any) => d.id !== id) : [];
          localStorage.setItem(key, JSON.stringify([...filtered, { ...draft, id }]));
        } catch {}
        return id;
      } catch (e) {
        console.warn('[firebaseService.saveOrderDraft] failed:', e);
        throw e;
      }
    },

    async loadOrderDrafts(userId: string): Promise<any[]> {
      const uid = userId || 'guest';
      // Prefer Firebase, fallback to local
      try {
        if (isFirebaseInitialized) {
          const qSnap = await getDocs(query(collection(db, 'orderDrafts'), where('userId', '==', uid)));
          const arr = qSnap.docs.map(d => ({ id: (d.data() as any).id || d.id, ...(d.data() as any) }));
          if (arr.length > 0) return arr;
        }
      } catch (e) {
        console.warn('[firebaseService.loadOrderDrafts] Firebase failed:', e);
      }
      try {
        const key = `order_drafts_${uid}`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(existing) ? existing : [];
      } catch {
        return [];
      }
    },

  // جلب منتج واحد بناءً على ID
  async getProduct(productId: string): Promise<Product | null> {
    if (!isFirebaseInitialized) {
      console.warn("Firebase not initialized, returning mock data");
      const mockProduct = MOCK_PRODUCTS.find(p => p.id === productId);
      return mockProduct || null;
    }

    try {
      const productRef = doc(db, 'products', productId);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        return { id: productSnap.id, ...productSnap.data() } as Product;
      } else {
        console.log('Product not found in Firebase, checking mock data');
        const mockProduct = MOCK_PRODUCTS.find(p => p.id === productId);
        return mockProduct || null;
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      const mockProduct = MOCK_PRODUCTS.find(p => p.id === productId);
      return mockProduct || null;
    }
  },

  // Normalization handled via module-scoped helper

  async addProduct(product: Product): Promise<string> {
    if (!isFirebaseInitialized) throw new Error("Firebase not initialized");
    
    try {
      const { id, tailorId, ...productData } = product;
      
      if (!tailorId) {
        throw new Error('tailorId is required to add a product');
      }
      
      // Normalize payload to ensure schema conformity
      const normalized = normalizeProductForSave(productData);

      // Save to users/{tailorId}/products subcollection
      const productsRef = collection(db, `users/${tailorId}/products`);
      
      const docRef = await addDoc(productsRef, {
        ...normalized,
        tailorId, // Keep tailorId in the document for reference
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log('Product added successfully with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error adding product:", error);
      throw error;
    }
  },

  async updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
    if (!isFirebaseInitialized) throw new Error("Firebase not initialized");
    
    try {
      const { tailorId, ...updateData } = updates;
      
      if (!tailorId) {
        throw new Error('tailorId is required to update a product');
      }
      
      // Defensive normalization for any provided fields (without overriding unrelated fields)
      const normalizedPartial = normalizeProductForSave(updateData);

      // Update in users/{tailorId}/products subcollection
      const productRef = doc(db, `users/${tailorId}/products`, productId);
      await setDoc(productRef, {
        ...normalizedPartial,
        tailorId, // Keep tailorId in the document
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log('Product updated successfully');
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  },

  async deleteProduct(productId: string, tailorId?: string): Promise<void> {
    if (!isFirebaseInitialized) throw new Error("Firebase not initialized");
    
    try {
      if (!tailorId) {
        throw new Error('tailorId is required to delete a product');
      }
      
      // Delete from users/{tailorId}/products subcollection
      const productRef = doc(db, `users/${tailorId}/products`, productId);
      await deleteDoc(productRef);
      console.log('Product deleted successfully');
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  },

  // --- Global App Settings ---

  async getGlobalSettings(): Promise<AppSettings> {
    const defaultSettings: AppSettings = {
      storiesEnabled: true,
      maintenanceMode: false,
      allowNewRegistrations: true,
      designerEnabled: true,
      cartEnabled: true,
      // Globally managed product categories used by homepage filters and join flow
      productCategories: [
        { id: 'dishdasha', name: 'الدشاديش' },
        { id: 'jacket', name: 'الجاكيت' },
        { id: 'abaya', name: 'العبايات' },
        { id: 'kids', name: 'الأطفال' },
        { id: 'shoes', name: 'الأحذية' },
      ],
      matchingMeasurementsVideoUrl: '',
      helpVideo: {
        enabled: true,
        url: 'https://www.youtube.com/watch?v=6eZtn5Du8O4',
        buttonText: 'شاهد'
      }
    };

    if (!isFirebaseInitialized) return defaultSettings;

    try {
      const settingsRef = doc(db, 'system', 'settings');
      const docSnap = await getDoc(settingsRef);
      
      if (docSnap.exists()) {
        const loadedSettings = { ...defaultSettings, ...docSnap.data() } as AppSettings;
        console.log('✅ Loaded settings from Firebase:', loadedSettings);
        return loadedSettings;
      } else {
        // Create default settings if they don't exist
        console.log('⚠️ No settings found, creating defaults');
        await setDoc(settingsRef, defaultSettings);
        return defaultSettings;
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      return defaultSettings;
    }
  },

  async saveGlobalSettings(settings: AppSettings): Promise<void> {
    if (!isFirebaseInitialized) throw new Error("Firebase not initialized");
    console.log('💾 Saving settings to Firebase:', settings);
    const settingsRef = doc(db, 'system', 'settings');
    await setDoc(settingsRef, settings, { merge: true });
    console.log('✅ Settings saved successfully');
  },

  // --- Measurements Management ---

  async getMeasurements(userId: string): Promise<any[]> {
    if (!isFirebaseInitialized) return [];
    
    try {
      const measurementsRef = collection(db, 'measurements');
      const q = query(measurementsRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);
      
      const measurements: any[] = [];
      snapshot.forEach(doc => {
        measurements.push({ id: doc.id, ...doc.data() });
      });
      
      return measurements;
    } catch (error) {
      console.error("Error fetching measurements:", error);
      return [];
    }
  },

  async saveMeasurement(measurement: any): Promise<string> {
    if (!isFirebaseInitialized) throw new Error("Firebase not initialized");
    
    try {
      if (measurement.id && measurement.id.startsWith('measurement_')) {
        // New measurement - create with auto ID
        const measurementsRef = collection(db, 'measurements');
        const docRef = await setDoc(doc(measurementsRef), measurement);
        return measurement.id;
      } else if (measurement.id) {
        // Update existing measurement
        const measurementRef = doc(db, 'measurements', measurement.id);
        await setDoc(measurementRef, measurement, { merge: true });
        return measurement.id;
      } else {
        // Create new with Firestore auto ID
        const measurementsRef = collection(db, 'measurements');
        const docRef = doc(measurementsRef);
        await setDoc(docRef, { ...measurement, id: docRef.id });
        return docRef.id;
      }
    } catch (error) {
      console.error("Error saving measurement:", error);
      throw error;
    }
  },

  async deleteMeasurement(measurementId: string): Promise<void> {
    if (!isFirebaseInitialized) throw new Error("Firebase not initialized");
    
    try {
      const measurementRef = doc(db, 'measurements', measurementId);
      await setDoc(measurementRef, { deleted: true }, { merge: true });
    } catch (error) {
      console.error("Error deleting measurement:", error);
      throw error;
    }
  },

  async getAllUsers(): Promise<User[]> {
    if (!isFirebaseInitialized) throw new Error("Firebase not initialized");
    
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      const users: User[] = [];
      querySnapshot.forEach((docSnap) => {
        const rawData = docSnap.data();
        // Apply defaults to ensure all fields exist
        const normalizedUser = applyUserDefaults(rawData, docSnap.id);
        users.push(normalizedUser as any);
      });
      
      return users;
    } catch (error) {
      console.error("Error getting all users:", error);
      throw error;
    }
  },

  async upgradeUserToMerchant(userId: string, merchantInfo: {
    shopType: string;
    location: string;
    specialization?: string;
    experience?: string;
  }): Promise<void> {
    if (!isFirebaseInitialized) throw new Error("Firebase not initialized");
    
    try {
      const userRef = doc(db, 'users', userId);
      
      // Determine role based on shopType
      const role = merchantInfo.shopType === 'tailor' ? 'tailor' : 'shop';

      // Update user document with merchant info
      await setDoc(userRef, {
        role: role, // Change role to merchant (tailor or shop)
        shopType: merchantInfo.shopType,
        location: merchantInfo.location,
        specialization: merchantInfo.specialization || '',
        experience: merchantInfo.experience || '',
        approvalStatus: 'approved', // Auto-approve admin conversions
        upgradedAt: new Date().toISOString()
      }, { merge: true });
      
      console.log(`User ${userId} upgraded to merchant successfully`);
    } catch (error) {
      console.error("Error upgrading user to merchant:", error);
      throw error;
    }
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    if (!isFirebaseInitialized) throw new Error("Firebase not initialized");
    
    try {
      const userRef = doc(db, 'users', userId);
      
      console.log('🔍 Raw updates received:', updates);
      
      // Process updates: remove undefined, preserve empty strings for image fields
      const cleanedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
        console.log(`  Processing ${key}:`, value, typeof value);
        if (value === undefined) {
          // Skip undefined values
          console.log(`    ⏭️ Skipping ${key} (undefined)`);
          return acc;
        }
        
        // Check for image fields first - preserve empty strings for these
        if (key === 'profileImage' || key === 'boardImage') {
          if (value === '' || value === null) {
            console.log(`    📸 Keeping ${key} as empty string (image field)`);
            acc[key] = '';
          } else {
            console.log(`    ✅ Keeping ${key}:`, value);
            acc[key] = value;
          }
          return acc;
        }
        
        // For other fields, delete if empty
        if (value === '' || value === null) {
          console.log(`    🗑️ Deleting ${key} (empty)`);
          acc[key] = deleteField();
        } else {
          console.log(`    ✅ Keeping ${key}:`, value);
          acc[key] = value;
        }
        return acc;
      }, {} as any);
      
      console.log('📦 Cleaned updates to send:', cleanedUpdates);
      
      const finalUpdate = {
        ...cleanedUpdates,
        updatedAt: new Date().toISOString()
      };
      
      console.log('📨 Final update object:', finalUpdate);
      
      await updateDoc(userRef, finalUpdate);
      
      console.log(`✅ User ${userId} updated successfully`);
    } catch (error) {
      console.error("❌ Error updating user:", error);
      throw error;
    }
  },

  async deleteUser(userId: string): Promise<void> {
    if (!isFirebaseInitialized) throw new Error("Firebase not initialized");
    
    try {
      await deleteDoc(doc(db, 'users', userId));
      console.log(`✅ User ${userId} deleted successfully`);
    } catch (error) {
      console.error("❌ Error deleting user:", error);
      throw error;
    }
  },

  async getPendingMerchants(): Promise<User[]> {
    if (!isFirebaseInitialized) throw new Error("Firebase not initialized");
    
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('approvalStatus', '==', 'pending'));
      const querySnapshot = await getDocs(q);
      
      const merchants: User[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        merchants.push({
          id: doc.id,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone,
          profileImage: data.profileImage,
          isGuest: false,
          joinDate: data.joinDate ? new Date(data.joinDate).toLocaleDateString('ar-OM') : new Date().toLocaleDateString('ar-OM'),
          role: data.role || 'user',
          shopType: data.shopType,
          location: data.location,
          region: data.region,
          ageGroup: data.ageGroup,
          specialization: data.specialization,
          experience: data.experience,
          approvalStatus: data.approvalStatus,
          bio: data.bio,
          rating: data.rating,
          reviewsCount: data.reviewsCount
        });
      });
      
      return merchants;
    } catch (error) {
      console.error("Error getting pending merchants:", error);
      throw error;
    }
  },

  async updateMerchantStatus(merchantId: string, status: 'approved' | 'rejected', reason?: string): Promise<void> {
    if (!isFirebaseInitialized) throw new Error("Firebase not initialized");
    
    try {
      const userRef = doc(db, 'users', merchantId);
      
      const updateData: any = {
        approvalStatus: status,
        reviewedAt: new Date().toISOString()
      };
      
      if (reason) {
        updateData.rejectionReason = reason;
      }
      
      await setDoc(userRef, updateData, { merge: true });
      
      console.log(`Merchant ${merchantId} status updated to ${status}`);
    } catch (error) {
      console.error("Error updating merchant status:", error);
      throw error;
    }
  },

  async getMeasurementTemplates(productType?: string): Promise<MeasurementTemplate[]> {
    if (!isFirebaseInitialized) {
      const templates = loadLocalMeasurementTemplates();
      return productType ? templates.filter(t => t.productType === productType) : templates;
    }

    try {
      const templatesRef = collection(db, 'measurementTemplates');
      const snapshot = await getDocs(templatesRef);
      if (snapshot.empty) return loadLocalMeasurementTemplates();

      const templates: MeasurementTemplate[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        templates.push({ id: docSnap.id, ...data } as MeasurementTemplate);
      });
      return productType ? templates.filter(t => t.productType === productType) : templates;
    } catch (error) {
      console.warn('Error fetching measurement templates, using local fallback:', error);
      return loadLocalMeasurementTemplates();
    }
  },

  async saveMeasurementTemplate(template: MeasurementTemplate): Promise<MeasurementTemplate> {
    const now = new Date().toISOString();
    const payload: MeasurementTemplate = {
      ...template,
      createdAt: template.createdAt || now,
      updatedAt: now
    };

    if (!isFirebaseInitialized) {
      const existing = loadLocalMeasurementTemplates();
      const idx = existing.findIndex(t => t.id === payload.id);
      if (idx >= 0) {
        existing[idx] = payload;
      } else {
        existing.push(payload);
      }
      persistLocalMeasurementTemplates(existing);
      return payload;
    }

    try {
      if (payload.id) {
        await setDoc(doc(db, 'measurementTemplates', payload.id), payload, { merge: true });
        return payload;
      }

      const docRef = await addDoc(collection(db, 'measurementTemplates'), payload);
      return { ...payload, id: docRef.id };
    } catch (error) {
      console.error('Error saving measurement template:', error);
      return payload;
    }
  },

  async deleteMeasurementTemplate(templateId: string): Promise<void> {
    if (!isFirebaseInitialized) {
      const existing = loadLocalMeasurementTemplates().filter(t => t.id !== templateId);
      persistLocalMeasurementTemplates(existing);
      return;
    }

    try {
      await deleteDoc(doc(db, 'measurementTemplates', templateId));
    } catch (error) {
      console.error('Error deleting measurement template:', error);
      throw error;
    }
  },

  async createNotification(notificationData: any): Promise<void> {
    if (!isFirebaseInitialized || !db) {
      throw new Error('Firebase is not initialized');
    }

    try {
      await addDoc(collection(db, 'notifications'), notificationData);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  async getUsers(): Promise<User[]> {
    if (!isFirebaseInitialized || !db) {
      throw new Error('Firebase is not initialized');
    }

    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || doc.data().email || 'مستخدم',
        email: doc.data().email || '',
        role: doc.data().role || 'customer',
        profileImage: doc.data().profileImage,
        phone: doc.data().phone,
        region: doc.data().region,
        ageGroup: doc.data().ageGroup,
        isGuest: false,
        joinDate: doc.data().joinDate || new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }
  ,
  async getApprovedTailors(): Promise<import('../types').Tailor[]> {
    if (!isFirebaseInitialized || !db) {
      // Fallback: return empty to avoid showing outdated mock data
      return [];
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'tailor'), where('approvalStatus', '==', 'approved'));
      const snapshot = await getDocs(q);

      const tailors = snapshot.docs.map(docSnap => {
        const d: any = docSnap.data();
        return {
          id: docSnap.id,
          name: d.name || 'خياط',
          specialization: d.specialization || (d.tailorGender === 'male' ? 'males' : d.tailorGender === 'female' ? 'females' : 'general'),
          rating: d.rating || d.ratingAvg || 4.5,
          location: d.location || '',
          region: d.region || '',
          image: d.profileImage || d.image || '',
          coverImage: d.coverImage,
          experience: d.experience || '',
          followers: d.followers || 0,
          approvalStatus: d.approvalStatus || 'approved',
          bio: d.bio,
          portfolio: d.portfolio || [],
          reviews: d.reviews || [],
          tailorGender: d.tailorGender
        } as import('../types').Tailor;
      });

      // Sort by rating (highest first)
      return tailors.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } catch (error) {
      console.error('Error fetching approved tailors:', error);
      return [];
    }
  },

  async getFeaturedTailors(): Promise<import('../types').Tailor[]> {
    if (!isFirebaseInitialized || !db) {
      return [];
    }

    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('role', '==', 'tailor'),
        where('approvalStatus', '==', 'approved'),
        where('isFeatured', '==', true)
      );
      const snapshot = await getDocs(q);

      const tailors = snapshot.docs.map(docSnap => {
        const d: any = docSnap.data();
        return {
          id: docSnap.id,
          name: d.name || 'خياط',
          specialization: d.specialization || (d.tailorGender === 'male' ? 'males' : d.tailorGender === 'female' ? 'females' : 'general'),
          rating: d.rating || d.ratingAvg || 4.5,
          location: d.location || '',
          region: d.region || '',
          image: d.profileImage || d.image || '',
          coverImage: d.coverImage,
          experience: d.experience || '',
          followers: d.followers || 0,
          approvalStatus: d.approvalStatus || 'approved',
          bio: d.bio,
          portfolio: d.portfolio || [],
          reviews: d.reviews || [],
          tailorGender: d.tailorGender
        } as import('../types').Tailor;
      });

      // Sort by rating (highest first)
      return tailors.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } catch (error) {
      console.error('Error fetching featured tailors:', error);
      return [];
    }
  },

  // ==================== CUSTOMIZATION DATA ====================
  
  /**
   * Save customization data to Firestore
   */
  async saveCustomization(userId: string, data: any): Promise<string> {
    if (!isFirebaseInitialized || !db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const customizationRef = collection(db, 'customizations');
      const docRef = await addDoc(customizationRef, {
        userId,
        modelId: data.modelId,
        modelName: data.modelName,
        fabricUrl: data.fabricUrl,
        previewUrl: data.previewUrl,
        aiTips: data.aiTips || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error saving customization:', error);
      throw error;
    }
  },

  /**
   * Get user's customizations
   */
  async getUserCustomizations(userId: string): Promise<any[]> {
    if (!isFirebaseInitialized || !db) {
      return [];
    }

    try {
      const customizationsRef = collection(db, 'customizations');
      const q = query(customizationsRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching customizations:', error);
      return [];
    }
  },

  /**
   * Delete customization
   */
  async deleteCustomization(customizationId: string): Promise<void> {
    if (!isFirebaseInitialized || !db) {
      throw new Error('Firebase not initialized');
    }

    try {
      await deleteDoc(doc(db, 'customizations', customizationId));
    } catch (error) {
      console.error('Error deleting customization:', error);
      throw error;
    }
  },

  /**
   * Get popular regions
   */
  async getPopularRegions(): Promise<import('../types').PopularRegion[]> {
    if (!isFirebaseInitialized || !db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const regionsRef = collection(db, 'popularRegions');
      const snapshot = await getDocs(regionsRef);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as import('../types').PopularRegion[];
    } catch (error) {
      console.error('Error getting popular regions:', error);
      return [];
    }
  },

  /**
   * Add popular region
   */
  async addPopularRegion(regionData: Omit<import('../types').PopularRegion, 'id'>): Promise<string> {
    if (!isFirebaseInitialized || !db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const regionsRef = collection(db, 'popularRegions');
      const docRef = await addDoc(regionsRef, regionData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding popular region:', error);
      throw error;
    }
  },

  /**
   * Update popular region
   */
  async updatePopularRegion(id: string, updates: Partial<import('../types').PopularRegion>): Promise<void> {
    if (!isFirebaseInitialized || !db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const regionRef = doc(db, 'popularRegions', id);
      await updateDoc(regionRef, updates);
    } catch (error) {
      console.error('Error updating popular region:', error);
      throw error;
    }
  },

  /**
   * Delete popular region
   */
  async deletePopularRegion(id: string): Promise<void> {
    if (!isFirebaseInitialized || !db) {
      throw new Error('Firebase not initialized');
    }

    try {
      await deleteDoc(doc(db, 'popularRegions', id));
    } catch (error) {
      console.error('Error deleting popular region:', error);
      throw error;
    }
  },

  /**
   * Get tailors by region
   */
  async getTailorsByRegion(region: string, max?: number): Promise<import('../types').Tailor[]> {
    if (!isFirebaseInitialized || !db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const usersRef = collection(db, 'users');
      let q = query(
        usersRef,
        where('role', '==', 'tailor'),
        where('approvalStatus', '==', 'approved'),
        where('region', '==', region)
      );

      if (max) {
        q = query(q, orderBy('rating', 'desc'), limit(max));
      }

      const snapshot = await getDocs(q);

      // If query returns results, map and return immediately
      if (snapshot.docs.length > 0) {

        return snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || '',
          username: doc.data().email?.split('@')[0] || doc.id,
          rating: doc.data().rating || 0,
          location: doc.data().location || '',
          image: doc.data().profileImage || '',
          specialization: doc.data().specialization || '',
          experience: doc.data().experience || '',
          bio: doc.data().bio,
          portfolio: doc.data().portfolio || [],
          reviewsCount: doc.data().reviewsCount || 0,
          region: doc.data().region,
        })) as import('../types').Tailor[];
      }

      // Fallback: If no results, fetch approved tailors and filter client-side by normalized region/location

      // Helper to normalize Arabic strings for robust matching
      const normalize = (s: string | undefined | null) => {
        if (!s) return '';
        return s
          .toLowerCase()
          .replace(/[أإآا]/g, 'ا')
          .replace(/[يى]/g, 'ي')
          .replace(/ؤ/g, 'و')
          .replace(/ئ/g, 'ي')
          .replace(/ة/g, 'ه')
          .replace(/\u0640/g, '') // tatweel
          .replace(/[\u064B-\u0652\u0670]/g, '') // harakat
          .replace(/\s+/g, ' ')
          .trim();
      };

      const normalizedTarget = normalize(region);

      const approvedRef = query(
        usersRef,
        where('role', '==', 'tailor'),
        where('approvalStatus', '==', 'approved')
      );
      const approvedSnap = await getDocs(approvedRef);
      const approved = approvedSnap.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          name: d.name || '',
          username: d.email?.split('@')[0] || doc.id,
          rating: d.rating || 0,
          location: d.location || '',
          image: d.profileImage || '',
          specialization: d.specialization || '',
          experience: d.experience || '',
          bio: d.bio,
          portfolio: d.portfolio || [],
          reviewsCount: d.reviewsCount || 0,
          region: d.region,
        } as import('../types').Tailor;
      });

      const filtered = approved.filter(t => {
        const nRegion = normalize(t.region as unknown as string);
        const nLocation = normalize((t as any).location);
        return nRegion === normalizedTarget || (nLocation && nLocation.includes(normalizedTarget));
      });

      // Sort by rating desc just in case and limit
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      return typeof max === 'number' ? filtered.slice(0, max) : filtered;
    } catch (error) {
      console.error('❌ Error getting tailors by region:', error);
      return [];
    }
  },

  /**
   * Create a new order
   */
  async createOrder(orderData: any): Promise<string> {
    if (!isFirebaseInitialized || !db) {
      throw new Error('Firebase not initialized');
    }

    try {
      // Remove undefined values - Firestore doesn't accept them
      const cleanedData = Object.entries(orderData).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      const ordersRef = collection(db, 'orders');
      const docRef = await addDoc(ordersRef, {
        ...cleanedData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      console.log('[Firebase] Order created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  /**
   * Get approved fabric stores
   */
  async getApprovedFabricStores(limitCount?: number): Promise<import('../types').Shop[]> {
    if (!isFirebaseInitialized) return [];
    
    try {
      const usersRef = collection(db, 'users');
      const constraints: any[] = [
        where('role', '==', 'shop'),
        where('shopType', '==', 'fabric_store'),
        where('approvalStatus', '==', 'approved')
      ];

      if (limitCount) {
        constraints.push(limit(limitCount));
      }

      const q = query(usersRef, ...constraints);
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          type: 'fabric_store',
          username: data.username || data.email?.split('@')[0],
          specialization: data.specialization || 'أقمشة',
          rating: data.rating || 0,
          location: data.location || '',
          region: data.region || '',
          image: data.profileImage || '',
          experience: data.experience || '',
          followers: 0,
          approvalStatus: 'approved',
          bio: data.bio || '',
          description: data.bio || '',
          reviews: [],
          coverImage: data.coverImage || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        } as import('../types').Shop;
      });
    } catch (error) {
      console.error("Error getting approved fabric stores:", error);
      return [];
    }
  }
};
