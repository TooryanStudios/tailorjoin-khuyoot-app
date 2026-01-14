
import { Product, User, Tailor, Shop, Order, Story, Review } from '../types';
import { db, firebaseService } from './firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Mock Reviews
const REVIEWS: Review[] = [
  { id: 'r1', userId: 'u1', userName: 'محمد المعولي', rating: 5, comment: 'خياطة ممتازة وتعامل راقي جداً', date: '2023-10-15' },
  { id: 'r2', userId: 'u3', userName: 'سارة', rating: 4, comment: 'التفصيل دقيق لكن تأخر قليلاً', date: '2023-09-20' },
];

// Basic mock products fallback. Add real items here if needed for local dev without Firebase.
export const MOCK_PRODUCTS: Product[] = [];

export const MOCK_TAILORS: Tailor[] = [
  {
    id: 't1',
    name: 'خياط الأصالة',
    specialization: 'males',
    rating: 4.9,
    location: 'السيب، مسقط',
    region: 'Muscat',
    image: 'https://picsum.photos/200/200?random=t1',
    coverImage: 'https://picsum.photos/800/300?random=c1',
    experience: '15 سنة',
    followers: 1250,
    approvalStatus: 'approved',
    bio: 'نتميز بالدقة في التفصيل واستخدام أجود أنواع الأقمشة اليابانية والإيطالية. خبرة تتوارثها الأجيال.',
    portfolio: [
      'https://picsum.photos/400/500?random=p1',
      'https://picsum.photos/400/500?random=p2',
      'https://picsum.photos/400/500?random=p3'
    ],
    reviews: REVIEWS,
    tailorGender: 'male'
  },
  {
    id: 't2',
    name: 'دار الحرير',
    specialization: 'females',
    rating: 4.7,
    location: 'القرم، مسقط',
    region: 'Muscat',
    image: 'https://picsum.photos/200/200?random=t2',
    coverImage: 'https://picsum.photos/800/300?random=c2',
    experience: '8 سنوات',
    followers: 890,
    approvalStatus: 'approved',
    bio: 'تصاميم عصرية تناسب المرأة الأنيقة.',
    reviews: [],
    tailorGender: 'female'
  },
  {
    id: 't3',
    name: 'المقص الذهبي',
    specialization: 'males',
    rating: 4.8,
    location: 'صحار',
    region: 'Sohar',
    image: 'https://picsum.photos/200/200?random=t3',
    experience: '12 سنة',
    followers: 2100,
    approvalStatus: 'approved',
    bio: 'متخصصون في البدلات الرسمية والزي الموحد.',
    reviews: [REVIEWS[0]],
    tailorGender: 'male'
  },
  {
    id: 't4',
    name: 'خياط صلالة الحديث',
    specialization: 'general',
    rating: 4.5,
    location: 'صلالة',
    region: 'Salalah',
    image: 'https://picsum.photos/200/200?random=t4',
    experience: '5 سنوات',
    followers: 300,
    approvalStatus: 'approved'
  },
  {
    id: 't5',
    name: 'إبرة وخيط',
    specialization: 'general',
    rating: 4.0,
    location: 'نزوى',
    region: 'Nizwa',
    image: 'https://picsum.photos/200/200?random=t5',
    experience: '20 سنة',
    followers: 150,
    approvalStatus: 'pending', // Should not show in main list usually
    tailorGender: 'male'
  }
];

// بوتيكات ومحلات (إضافة لدعم الأنواع الجديدة)
export const MOCK_SHOPS: Shop[] = [
  // بوتيكات
  {
    id: 'b1',
    name: 'بوتيك الأناقة',
    type: 'boutique',
    rating: 4.8,
    location: 'القرم، مسقط',
    region: 'Muscat',
    image: 'https://picsum.photos/200/200?random=b1',
    coverImage: 'https://picsum.photos/800/300?random=cb1',
    description: 'بوتيك نسائي متخصص في الأزياء الراقية',
    followers: 3200,
    isVerified: true,
    approvalStatus: 'approved',
    bio: 'أرقى التصاميم العالمية والمحلية للمرأة العصرية',
    contactNumber: '+968 9123 4567',
    portfolio: [
      'https://picsum.photos/400/500?random=bp1',
      'https://picsum.photos/400/500?random=bp2',
      'https://picsum.photos/400/500?random=bp3'
    ],
    hasOnlineStore: true,
    deliveryAvailable: true,
    workingHours: '9 صباحاً - 10 مساءً',
    services: ['بيع جاهز', 'تفصيل حسب الطلب', 'استشارات أزياء'],
    brands: ['Chanel', 'Gucci', 'Local Designers'],
    createdAt: '2023-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z'
  },
  {
    id: 'b2',
    name: 'بوتيك الفخامة',
    type: 'boutique',
    rating: 4.6,
    location: 'صحار',
    region: 'Sohar',
    image: 'https://picsum.photos/200/200?random=b2',
    description: 'عبايات وفساتين فاخرة',
    followers: 1850,
    approvalStatus: 'pending',
    bio: 'تصاميم حصرية للمناسبات الخاصة',
    contactNumber: '+968 9234 5678',
    hasOnlineStore: false,
    deliveryAvailable: true,
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  // محلات أقمشة
  {
    id: 'f1',
    name: 'محل الحرير الذهبي',
    type: 'fabric_store',
    rating: 4.9,
    location: 'مطرح، مسقط',
    region: 'Muscat',
    image: 'https://picsum.photos/200/200?random=f1',
    coverImage: 'https://picsum.photos/800/300?random=cf1',
    description: 'أقمشة فاخرة من جميع أنحاء العالم',
    followers: 2100,
    isVerified: true,
    approvalStatus: 'approved',
    bio: 'منذ 1985، نوفر أجود أنواع الأقمشة المحلية والمستوردة',
    contactNumber: '+968 9345 6789',
    portfolio: [
      'https://picsum.photos/400/300?random=fp1',
      'https://picsum.photos/400/300?random=fp2'
    ],
    hasOnlineStore: true,
    deliveryAvailable: true,
    workingHours: '8 صباحاً - 9 مساءً',
    services: ['بيع بالمتر', 'بيع بالجملة', 'توصيل مجاني فوق 50 ريال'],
    brands: ['Italian Silk', 'Japanese Cotton', 'Local Wool'],
    createdAt: '2022-05-20T10:00:00Z',
    updatedAt: '2024-01-18T12:00:00Z'
  },
  {
    id: 'f2',
    name: 'عالم الأقمشة',
    type: 'fabric_store',
    rating: 4.3,
    location: 'صلالة',
    region: 'Salalah',
    image: 'https://picsum.photos/200/200?random=f2',
    description: 'أقمشة للعائلة بأسعار مناسبة',
    followers: 670,
    approvalStatus: 'pending',
    bio: 'تشكيلة واسعة من الأقمشة لجميع المناسبات',
    contactNumber: '+968 9456 7890',
    hasOnlineStore: false,
    deliveryAvailable: false,
    createdAt: '2024-01-05T09:00:00Z',
    updatedAt: '2024-01-12T11:00:00Z'
  },
  // محلات مستلزمات خياطة
  {
    id: 's1',
    name: 'مستلزمات الخياط المحترف',
    shopType: 'sewing_supplies',
    rating: 4.7,
    location: 'الخوض، مسقط',
    region: 'Muscat',
    image: 'https://picsum.photos/200/200?random=s1',
    coverImage: 'https://picsum.photos/800/300?random=cs1',
    description: 'كل ما يحتاجه الخياط من أدوات ومستلزمات',
    followers: 950,
    approvalStatus: 'approved',
    bio: 'أدوات خياطة احترافية وماكينات من أفضل الماركات',
    contactNumber: '+968 9567 8901',
    portfolio: [
      'https://picsum.photos/400/300?random=sp1',
      'https://picsum.photos/400/300?random=sp2'
    ],
    hasOnlineStore: true,
    deliveryAvailable: true,
    workingHours: '9 صباحاً - 8 مساءً',
    services: ['صيانة ماكينات', 'استشارات فنية', 'دورات تدريبية'],
    brands: ['Singer', 'Brother', 'Janome', 'Husqvarna'],
    createdAt: '2023-03-10T10:00:00Z',
    updatedAt: '2024-01-22T15:00:00Z'
  }
];

export const MOCK_STORIES: Story[] = [
  {
    id: 's1',
    tailorId: 't1',
    tailorName: 'خياط الأصالة',
    tailorImage: 'https://picsum.photos/200/200?random=t1',
    mediaUrl: 'https://picsum.photos/300/500?random=s1',
    type: 'image',
    caption: 'تشكيلة جديدة من الأقمشة اليابانية وصلت حديثاً! 🧵✨',
    likes: 124
  },
  {
    id: 's2',
    tailorId: 't2',
    tailorName: 'دار الحرير',
    tailorImage: 'https://picsum.photos/200/200?random=t2',
    mediaUrl: 'https://picsum.photos/300/500?random=s2',
    type: 'image',
    caption: 'تصميم خاص للعروس .. ألف مبروك 💍',
    likes: 350
  },
  {
    id: 's3',
    tailorId: 't3',
    tailorName: 'المقص الذهبي',
    tailorImage: 'https://picsum.photos/200/200?random=t3',
    mediaUrl: 'https://picsum.photos/300/500?random=s3',
    type: 'image',
    caption: 'دقة في التفاصيل .. جودة في التنفيذ 📏',
    likes: 89
  }
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord-101',
    productId: '1',
    productName: 'دشداشة عمانية مطرزة',
    productImage: 'https://picsum.photos/400/500?random=1',
    price: 25.000,
    tailorName: 'خياط الأصالة',
    tailorId: 'u2', // خياط الأصالة
    userId: 'u1',
    status: 'sewing',
    orderDate: '2023-10-01',
    paymentStatus: 'partial',
    fabricSource: 'tailor',
    measurements: {
      shoulders: 45,
      chest: 100,
      length: 150
    }
  },
  {
    id: 'ord-102',
    productId: '3',
    productName: 'عباية سوداء فاخرة',
    productImage: 'https://picsum.photos/400/500?random=3',
    price: 45.000,
    tailorName: 'دار الزين',
    tailorId: 't3',
    userId: 'u3',
    status: 'pending',
    orderDate: '2023-10-05',
    negotiationStatus: 'requested',
    requestedPrice: 40.000,
    customerNote: 'هل يمكن تخفيض السعر لأنني سأطلب قطعتين؟',
    paymentStatus: 'pending',
    fabricSource: 'store',
    notes: 'العميلة تفضل قماش حرير'
  },
  {
    id: 'ord-99',
    productId: '2',
    productName: 'جاكيت رسمي',
    productImage: 'https://picsum.photos/400/500?random=2',
    price: 35.500,
    tailorName: 'بوتيك الأناقة',
    tailorId: 'u5',
    userId: 'u4',
    status: 'delivered',
    orderDate: '2023-09-15',
    completionDate: '2023-09-22',
    paymentStatus: 'paid'
  },
  {
    id: 'ord-103',
    productId: '5',
    productName: 'طقم أطفال للعيد',
    productImage: 'https://picsum.photos/400/500?random=5',
    price: 18.000,
    tailorName: 'خياط الأصالة',
    tailorId: 'u2', // خياط الأصالة
    userId: 'u1',
    status: 'pending',
    orderDate: '2023-10-08',
    negotiationStatus: 'none',
    paymentStatus: 'pending',
    measurements: {
      chest: 70,
      length: 90
    }
  },
  {
    id: 'ord-104',
    productId: '1',
    productName: 'دشداشة كاجوال',
    productImage: 'https://picsum.photos/400/500?random=11',
    price: 22.000,
    tailorName: 'خياط الأصالة',
    tailorId: 'u2',
    userId: 'u4',
    status: 'measuring',
    orderDate: '2023-10-10',
    paymentStatus: 'pending',
    fabricSource: 'customer',
    notes: 'العميل سيحضر القماش غداً'
  },
  {
    id: 'ord-105',
    productId: '2',
    productName: 'بدلة رسمية',
    productImage: 'https://picsum.photos/400/500?random=12',
    price: 85.000,
    tailorName: 'خياط الأصالة',
    tailorId: 'u2',
    userId: 'u3',
    status: 'cutting',
    orderDate: '2023-10-12',
    paymentStatus: 'partial',
    fabricSource: 'tailor',
    measurements: {
      shoulders: 48,
      chest: 105,
      waist: 90,
      length: 75
    }
  }
];

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'أحمد الكندي', email: 'ahmed@example.com', role: 'user', joinDate: '2023-01-15', isGuest: false },
  { id: 'u2', name: 'خياط الأصالة', email: 'tailor1@example.com', role: 'tailor', joinDate: '2023-02-20', isGuest: false },
  { id: 'u3', name: 'سارة محمد', email: 'sara@example.com', role: 'user', joinDate: '2023-03-10', isGuest: false },
  { id: 'u4', name: 'علي البلوشي', email: 'ali@example.com', role: 'user', joinDate: '2023-04-05', isGuest: false },
  { id: 'u5', name: 'بوتيك الأناقة', email: 'boutique@example.com', role: 'tailor', joinDate: '2023-04-12', isGuest: false },
];

export const mockLogin = async (email: string): Promise<User> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let role: any = 'user';
      let shopType: any = undefined;
      
      if (email.includes('tailor')) {
        role = 'tailor';
        shopType = 'tailor';
      }
      if (email.includes('boutique')) {
        role = 'shop';
        shopType = 'boutique';
      }
      if (email.includes('fabric')) {
        role = 'shop';
        shopType = 'fabric_store';
      }
      if (email.includes('admin')) {
        role = 'admin';
      }

      resolve({
        id: 'user_123',
        name: email.split('@')[0],
        email: email,
        avatar: 'https://picsum.photos/200/200?random=user',
        isGuest: false,
        joinDate: new Date().toLocaleDateString('ar-OM'),
        role: role,
        shopType: shopType,
        tailorGender: role === 'tailor' ? 'male' : undefined // إضافة تخصص افتراضي للخياطين
      });
    }, 1000);
  });
};

export const getProducts = async (category?: string, tailorId?: string): Promise<Product[]> => {
  try {
    const { firebaseService } = await import('./firebase');

    // جلب المنتجات من Firebase فقط (بدون دمج مع النموذجية)
    const firebaseProducts = await firebaseService.getProducts(category);
    console.log('🔍 منتجات Firebase:', firebaseProducts.length);

    let filteredProducts = firebaseProducts;

    // تصفية حسب الخياط إذا تم تحديده
    if (tailorId) {
      console.log('🔍 تصفية المنتجات للخياط:', tailorId);

      const tailor = await getTailorById(tailorId);
      const tailorUsername = tailor?.username;

      console.log('🔍 معلومات الخياط:', {
        tailorId,
        username: tailorUsername
      });

      filteredProducts = firebaseProducts.filter((p) => {
        const matchesId = p.tailorId === tailorId;
        const matchesUsername = tailorUsername && p.tailorId === tailorUsername;
        return matchesId || matchesUsername;
      });

      console.log('🔍 عدد المنتجات بعد التصفية:', filteredProducts.length);

      if (filteredProducts.length > 0) {
        console.log('🔍 أول منتج بعد التصفية:', {
          id: filteredProducts[0].id,
          name: filteredProducts[0].name,
          image: filteredProducts[0].image,
          images: filteredProducts[0].images,
          tailorId: filteredProducts[0].tailorId
        });
      }
    }

    // إذا وجدنا بيانات حقيقية نعيدها مباشرة
    if (filteredProducts.length > 0) {
      return filteredProducts;
    }

    console.warn('⚠️ لم يتم العثور على منتجات Firebase - سيتم استخدام بيانات نموذجية');
  } catch (error) {
    console.error('Error fetching products:', error);
  }

  // في حالة عدم وجود بيانات حقيقية، نرجع المنتجات النموذجية فقط
  let result = MOCK_PRODUCTS;
  if (category && category !== 'all') {
    result = result.filter((p) => p.category === category);
  }
  if (tailorId) {
    try {
      const tailor = await getTailorById(tailorId);
      const tailorUsername = tailor?.username;
      result = result.filter((p) => {
        const matchesId = p.tailorId === tailorId;
        const matchesUsername = tailorUsername && p.tailorId === tailorUsername;
        return matchesId || matchesUsername;
      });
    } catch {
      result = result.filter((p) => p.tailorId === tailorId);
    }
  }
  return result;
};

export const getProductById = async (id: string): Promise<Product | undefined> => {
  try {
    // جلب جميع المنتجات (الحقيقية + النموذجية)
    const allProducts = await getProducts();
    
    // البحث عن المنتج بالمعرّف
    return allProducts.find(p => p.id === id);
  } catch (error) {
    console.error('Error fetching product by id:', error);
    // في حالة الخطأ، نبحث في المنتجات النموذجية فقط
    return MOCK_PRODUCTS.find(p => p.id === id);
  }
};

export const getTailors = async (): Promise<Tailor[]> => {
  try {
    const { firebaseService } = await import('./firebase');
    const { getPortfolioItems } = await import('./interactionService');
    
    // جلب الخياطين الموافق عليهم من Firebase فقط
    const approvedTailors = await firebaseService.getApprovedTailors();
    console.log(`🎨 Tailors from Firebase: ${approvedTailors.length}`);
    
    // جلب portfolio لكل خياط
    const realTailors: Tailor[] = await Promise.all(
      approvedTailors.map(async (tailor) => {
        let portfolioUrls: string[] = [];
        try {
          const portfolioItems = await getPortfolioItems(tailor.id);
          portfolioUrls = portfolioItems
            .filter(item => item.type === 'image')
            .map(item => item.mediaUrl);
        } catch (error) {
          console.log(`No portfolio items for tailor ${tailor.id}`);
        }
        
        return {
          ...tailor,
          portfolio: portfolioUrls.length > 0 ? portfolioUrls : tailor.portfolio
        };
      })
    );
    
    // إذا لم نجد أي خياطين حقيقيين، نرجع مصفوفة فارغة (بدون خلط مع البيانات النموذجية)
    if (realTailors.length === 0) {
      console.warn('⚠️ No Firebase tailors found - ensure Firestore has users with role=tailor and approvalStatus=approved');
    }
    return realTailors;
  } catch (error) {
    console.error('Error fetching tailors:', error);
    return [];
  }
};

// دالة جديدة للحصول على جميع المحلات (خياطين + بوتيكات + محلات أقمشة + مستلزمات)
export const getAllShops = async (): Promise<Shop[]> => {
  try {
    // جلب الخياطين الحقيقيين من Firebase
    const tailors = await getTailors();
    
    // إضافة type للخياطين
    const tailorsWithType: Shop[] = tailors.map(tailor => ({
      ...tailor,
      type: 'tailor' as const,
      description: tailor.bio || '',
    }));
    
    // جلب البوتيكات والمحلات الأخرى من Firebase
    const usersRef = collection(db, 'users');
    const shopsQuery = query(
      usersRef,
      where('role', 'in', ['boutique', 'shop', 'fabric_store'])
    );
    const shopsSnapshot = await getDocs(shopsQuery);
    
    const realShops: Shop[] = shopsSnapshot.docs.map(doc => {
      const user = doc.data() as User;
      return {
        id: user.id,
        name: user.name,
        type: user.role === 'boutique' ? 'boutique' : user.role === 'fabric_store' ? 'fabric_store' : 'other',
        username: user.username,
        specialization: user.specialization || 'غير محدد',
        rating: user.rating || 0,
        location: user.location || 'غير محدد',
        region: user.location || 'Muscat',
        image: user.profileImage || '/placeholders/avatar.svg',
        experience: user.experience || '0 سنوات',
        followers: 0,
        approvalStatus: user.approvalStatus as 'approved' | 'pending' | 'rejected',
        bio: user.bio || '',
        description: user.bio || '',
        reviews: [],
        coverImage: user.coverImage || '/placeholders/cover.svg',
        createdAt: user.createdAt || new Date().toISOString(),
        updatedAt: user.updatedAt || new Date().toISOString(),
      };
    });
    
    // إضافة type للمحلات النموذجية
    const mockShopsWithType: Shop[] = MOCK_SHOPS.map(shop => ({
      ...shop,
      type: shop.type || 'other',
    }));
    
    // دمج الخياطين مع البوتيكات والمحلات
    const allShops: Shop[] = [...tailorsWithType, ...realShops, ...mockShopsWithType];
    
    console.log('📊 getAllShops - Total:', allShops.length, '| Tailors:', tailorsWithType.length, '| Shops:', realShops.length, '| Mock:', mockShopsWithType.length);
    
    return allShops;
  } catch (error) {
    console.error('Error fetching shops:', error);
    // في حالة الخطأ، نرجع البيانات النموذجية مع type
    const mockTailorsWithType = MOCK_TAILORS.map(t => ({ ...t, type: 'tailor' as const, description: t.bio || '' }));
    const mockShopsWithType = MOCK_SHOPS.map(s => ({ ...s, type: s.type || 'other' as const }));
    return [...mockTailorsWithType, ...mockShopsWithType];
  }
};

export const getTailorById = async (id: string): Promise<Tailor | undefined> => {
  try {
    // محاولة جلب المستخدم مباشرة من Firebase
    const user = await firebaseService.getUserProfile(id);
    
    if (user && user.role === 'tailor') {
      // جلب portfolio
      const { getPortfolioItems } = await import('./interactionService');
      let portfolioUrls: string[] = [];
      try {
        const portfolioItems = await getPortfolioItems(user.id);
        portfolioUrls = portfolioItems
          .filter(item => item.type === 'image')
          .map(item => item.mediaUrl);
      } catch (error) {
        console.log(`No portfolio items for tailor ${user.id}`);
      }

      return {
        id: user.id,
        name: user.name,
        specialization: user.specialization || 'خياطة عامة',
        rating: user.rating || 0,
        location: user.location || 'غير محدد',
        region: user.region || 'Muscat',
        image: user.profileImage || '/placeholders/avatar.svg',
        experience: user.experience || '0 سنوات',
        followers: 0,
        approvalStatus: user.approvalStatus as 'approved' | 'pending' | 'rejected',
        bio: user.bio || '',
        reviews: [],
        coverImage: user.coverImage || '/placeholders/cover.svg',
        portfolio: portfolioUrls.length > 0 ? portfolioUrls : []
      };
    }

    // إذا لم يتم العثور عليه في Firebase أو لم يكن خياطاً، نبحث في القائمة الكاملة (للبيانات النموذجية)
    const allTailors = await getTailors();
    const tailor = allTailors.find(t => t.id === id);
    
    console.log('🔍 بيانات الخياط:', {
      id: tailor?.id,
      name: tailor?.name,
      username: tailor?.username
    });
    
    return tailor;
  } catch (error) {
    console.error('Error fetching tailor by id:', error);
    // في حالة الخطأ، نبحث في الخياطين النموذجيين فقط
    return MOCK_TAILORS.find(t => t.id === id);
  }
};

export const getStories = async (): Promise<Story[]> => {
  try {
    const { firebaseService } = await import('./firebase');
    // Try to fetch real stories from Firebase
    const stories = await firebaseService.getStories?.() ?? [];
    console.log(`📖 Stories from Firebase: ${stories.length}`);
    
    if (stories.length === 0) {
      console.warn('⚠️ No Firebase stories found');
    }
    return stories;
  } catch (error) {
    console.error('Error fetching stories:', error);
    return [];
  }
};

export const getMyOrders = async (userId: string): Promise<Order[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_ORDERS), 500);
  });
};

export const getUsers = async (): Promise<User[]> => {
    return new Promise((resolve) => setTimeout(() => resolve(MOCK_USERS), 600));
}

export const getFabricStores = async (): Promise<Shop[]> => {
  let realStores: Shop[] = [];
  try {
    realStores = await firebaseService.getApprovedFabricStores();
  } catch (error) {
    console.error('Error fetching fabric stores:', error);
  }

  // Mock stores removed as per request
  // const mockStores = MOCK_SHOPS.filter(s => s.type === 'fabric_store').map(s => ({ ... }));

  console.log(`📊 Fabric Stores: ${realStores.length} real`);
  
  // Return only real stores
  return realStores;
};

import { ProductPageConfig } from '../types';

export const MOCK_PRODUCT_PAGE_CONFIG: ProductPageConfig = {
  buttons: {
    tryFabric: {
      enabled: true,
      title: "جربي القماش",
      subtitle: "تصور بالذكاء الاصطناعي",
      cta: "فتح المصمم",
      mediaType: 'graphic',
      graphicType: 'fabric'
    },
    measurements: {
      enabled: true,
      title: "المقاسات",
      subtitle: "أدخلي مقاساتك",
      cta: "تكوين",
      mediaType: 'graphic',
      graphicType: 'measurements'
    }
  },
  thumbnails: {
    size: 80, // Increased size
    gap: 12,
    borderRadius: 16,
    aspectRatio: 'video' // 16:9
  }
};

export const getProductPageConfig = async (): Promise<ProductPageConfig> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_PRODUCT_PAGE_CONFIG), 100);
  });
};

export const saveProductPageConfig = async (config: ProductPageConfig): Promise<void> => {
  return new Promise((resolve) => {
    Object.assign(MOCK_PRODUCT_PAGE_CONFIG, config);
    setTimeout(() => resolve(), 500);
  });
};
