import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'guest' | 'user' | 'tailor' | 'admin' | 'shop' | 'boutique' | 'fabric_store' | 'customer' | 'fabric_shop';
export type ShopType = 'tailor' | 'boutique' | 'fabric_store' | 'sewing_supplies';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type Gender = 'male' | 'female' | 'not_specified';
export type TailorGender = 'male' | 'female'; // تخصص الخياط: رجالي أو نسائي

export type AgeGroup = '18-23' | '24-30' | '31-40' | '41-50' | '50+' | 'not_specified';

// Shop Type Labels
export const SHOP_TYPE_LABELS: Record<ShopType, string> = {
  tailor: 'خياط',
  boutique: 'بوتيك',
  fabric_store: 'محل أقمشة',
  sewing_supplies: 'أدوات خياطة'
};

// Tailor Gender Labels
export const TAILOR_GENDER_LABELS: Record<TailorGender, string> = {
  male: 'خياط رجالي',
  female: 'خياط نسائي'
};

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  profileImage?: string; // Standardized avatar field
  username?: string;
  phone?: string;
  phoneNumber?: string; // Alternative naming for phone
  contactNumber?: string; // Alternative naming for phone
  loginId?: string; // معرف تسجيل الدخول (بريد إلكتروني أو رقم جوال)
  gender?: Gender; // الجنس لتحسين التجربة
  region?: string; // المنطقة/الولاية
  ageGroup?: AgeGroup; // الفئة العمرية (للمستخدمين العاديين فقط)
  isGuest: boolean;
  joinDate: string;
  role: UserRole;
  isGoldMember?: boolean;
  disabled?: boolean; // Account disabled state
  createdAt?: string;
  updatedAt?: string;
  coverImage?: string;
  
  // معلومات التجار/الخياطين
  shopType?: string; // نوع المحل (خياط، بوتيك، أقمشة...)
  location?: string; // موقع المحل
  specialization?: string; // التخصص
  experience?: string; // سنوات الخبرة
  tailorGender?: TailorGender; // تخصص الخياط: رجالي أو نسائي (إلزامي للخياطين)
  approvalStatus?: ApprovalStatus; // حالة الموافقة (pending, approved, rejected)
  bio?: string; // نبذة عن المحل
  rating?: number; // التقييم
  reviewsCount?: number; // عدد التقييمات
  boardImage?: string; // صورة اللوحة
  createdByAdmin?: boolean; // تم إنشاؤه بواسطة المدير
  requirePasswordChange?: boolean; // يتطلب تغيير كلمة المرور
}

// مكتبة الصور - يمكن للأدمن إدارتها
export interface ImageLibraryCategory {
  id: string;
  name: string; // اسم القسم (مثل: دشداشات، عبايات)
  nameAr?: string; // الاسم بالعربية
  nameEn?: string; // الاسم بالإنجليزية للربط مع category
  parentId?: string | null; // معرف القسم الأب (null للأقسام الرئيسية)
  level?: number; // المستوى في الشجرة (0 = رئيسي، 1 = فرعي، 2 = فرعي فرعي...)
  order?: number; // ترتيب العرض
  hasChildren?: boolean; // هل يحتوي على أقسام فرعية
  createdAt?: string | Timestamp;
}

export interface ImageLibraryItem {
  id: string;
  categoryId: string; // معرف القسم
  imageUrl: string; // رابط الصورة
  thumbnailUrl?: string; // رابط الصورة المصغرة للمعاينة
  label: string; // وصف الصورة
  order?: number; // ترتيب العرض داخل القسم
  uploadedBy?: string; // معرف الأدمن الذي رفع الصورة
  createdAt?: string | Timestamp;
}

export interface Product {
  id: string;
  isNew?: boolean; // New arrival flag
  name: string;
  category: string; // deprecated - نص عادي (مثل: "dishdasha")
  categoryId?: string; // معرف التصنيف من نظام التصنيفات الجديد
  price: number;
  image: string; // صورة الغلاف الرئيسية
  coverImageIndex?: number; // index الصورة المختارة كغلاف من images
  images?: string[]; // صور إضافية للمنتج
  videoUrl?: string; // رابط الفيديو التعريفي للمنتج
  rating?: number;
  location?: string;
  duration?: string; // e.g. "3-5 أيام"
  tailorId?: string;
  tailorName?: string; // اسم الخياط/المحل
  description?: string; // وصف المنتج
  likes?: number; // عدد الإعجابات
  reviewsCount?: number; // عدد التقييمات
  views?: number; // عدد المشاهدات
  inStock?: boolean; // متوفر أم لا
  discount?: number; // نسبة الخصم
  tags?: string[]; // وسوم للمنتج
  isDraft?: boolean; // هل المنتج مسودة (غير منشور)
  createdAt?: string;
  updatedAt?: string;
  designerPreviewUrl?: string;
}

// Admin Configuration Types
export interface ActionButtonConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  cta: string;
  mediaType: 'image' | 'video' | 'graphic';
  mediaUrl?: string; // For image/video
  graphicType?: 'fabric' | 'measurements'; // For SVG graphics
}

export interface ThumbnailConfig {
  size: number; // px
  gap: number; // px
  borderRadius: number; // px
  aspectRatio: 'square' | 'video' | 'portrait';
}

export interface ProductPageConfig {
  buttons: {
    tryFabric: ActionButtonConfig;
    measurements: ActionButtonConfig;
  };
  thumbnails: ThumbnailConfig;
}

export type Region = 'Muscat' | 'Sohar' | 'Salalah' | 'Nizwa' | 'Sur' | 'Other';

// إضافة واجهة للمناطق الجغرافية
export interface PopularRegion {
  id: string;
  name: string;        // اسم المنطقة (مثل: "البريمي")
  nameEn?: string;     // الاسم بالإنجليزية
  icon?: string;       // أيقونة المنطقة
  order: number;       // ترتيب الظهور
  enabled: boolean;    // تفعيل/تعطيل
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  targetType?: 'shop' | 'product'; // نوع التقييم
  targetId?: string; // معرف المحل أو المنتج
  helpful?: number; // عدد الأشخاص الذين وجدوا التقييم مفيداً
  verified?: boolean; // تقييم من مشتري موثق
  images?: string[]; // صور مرفقة مع التقييم
}

// واجهة عامة للمحلات (خياطين، بوتيكات، محلات أقمشة، ومستلزمات)
export interface Shop {
  id: string;
  name: string;
  shopName?: string;
  role?: UserRole;
  email?: string;
  phone?: string;
  loginId?: string;
  type?: 'tailor' | 'boutique' | 'fabric_store' | 'shop' | 'other'; // نوع المحل
  shopType?: ShopType;
  username?: string; // معرف المستخدم
  rating?: number;
  location?: string;
  image?: string;
  profileImage?: string; // Sometimes used by User model
  avatar?: string;       // Sometimes used by User model
  coverImage?: string;
  description?: string;
  followers?: number;
  isVerified?: boolean;

  // معلومات عامة
  region?: Region | string;
  approvalStatus?: ApprovalStatus;
  bio?: string;
  contactNumber?: string;
  portfolio?: string[]; // صور الأعمال أو المنتجات
  reviews?: Review[];

  // خاص بالخياطين
  specialization?: string; // للخياطين: تخصص (رجالي، نسائي، أطفال)
  tailorGender?: TailorGender; // تخصص الخياط: رجالي أو نسائي
  experience?: string; // للخياطين: سنوات الخبرة

  // خاص بالبوتيكات ومحلات الأقمشة
  hasOnlineStore?: boolean; // يوفر متجر إلكتروني
  deliveryAvailable?: boolean; // يوفر خدمة توصيل

  // معلومات إضافية
  workingHours?: string; // ساعات العمل
  services?: string[]; // الخدمات المقدمة
  brands?: string[]; // العلامات التجارية (للمحلات)

  createdAt?: string;
  updatedAt?: string;
}

// للتوافق مع الكود القديم
export interface Tailor extends Shop {
  specialization?: string;
  experience?: string;
}

export interface Story {
  id: string;
  tailorId: string;
  tailorName: string;
  tailorImage: string;
  mediaUrl: string; // Image or Video URL
  type: 'image' | 'video';
  caption: string;
  likes: number;
  isLiked?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface DesignerCardsRailCard {
  id: string;
  title: string;
  type?: 'image' | 'video';
  mediaUrl: string;
  href?: string;
  enabled?: boolean;
}

export interface DesignerCardsRailSettings {
  enabled?: boolean;
  title?: string;
  maxCards?: number;
  cardWidthPx?: number;
  cardHeightPx?: number;
  cardRadiusPx?: number;
  gapPx?: number;
  paddingXPx?: number;
}

export interface AppSettings {
  storiesEnabled: boolean;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  designerEnabled: boolean;
  cartEnabled: boolean;
  /**
   * Mobile Designer V2/V2.1: optional cards rail rendered under the history strip.
   * Configurable from Admin > Home Page Settings.
   */
  designerCardsRail?: DesignerCardsRailSettings & {
    cards?: DesignerCardsRailCard[];
  };
  // Globally managed product categories used by homepage filters and join flow
  productCategories?: Array<{ id: string; name: string }>;
  storeEnabled?: boolean; // تفعيل/تعطيل متجر خيوط
  themeColors?: {
    primary?: string;
    secondary?: string;
  };
  matchingMeasurementsVideoUrl?: string; // رابط فيديو تعليمات المقاسات المطابقة
    helpVideo?: {
      enabled?: boolean;
      url?: string; // رابط فيديو المساعدة لزر "شاهد"
      buttonText?: string; // نص الزر
    };

  /**
   * AI Try-On monetization config.
   * Stored in Firestore under system/settings.
   */
  aiTryOn?: {
    /**
     * Global driver prompt used to guide Try-On generations.
     * Configured from Admin Control Panel and stored in Firestore under system/settings.
     */
    driverPrompt?: string;
    limits?: {
      free?: {
        maxPremiumTemplatesBrowse?: number;
        maxRecents?: number;
        maxGenerationsStored?: number;
      };
      subscribed?: {
        maxPremiumTemplatesBrowse?: number;
        maxRecents?: number;
        maxGenerationsStored?: number;
      };
    };
    premiumFeatures?: {
      watermarkRemoval?: boolean;
      hdExport?: boolean;
      priorityQueue?: boolean;
      batchGeneration?: boolean;
      presets?: boolean;
    };
  };
  measurementTemplateWidth?: number; // عرض صورة قالب المقاسات (بكسل)
  measurementTemplateHeight?: number; // ارتفاع صورة قالب المقاسات (بكسل)
  showHeader?: boolean; // إظهار/إخفاء الهيدر
  showFooter?: boolean; // إظهار/إخفاء الفوتر
  homeSections?: {
    installButton?: boolean;
    notificationButton?: boolean;
    stories?: boolean;
    searchBar?: boolean;
    heroBanner?: boolean;
    designSection?: boolean;
    adsSection?: boolean;
    popularRegions?: boolean;
    filteredTailors?: boolean;
    fabricStores?: boolean;
    browseShopsButton?: boolean;
    featuredTailors?: boolean;
    categoriesFilter?: boolean;
    productsGrid?: boolean;
    contactFooter?: boolean;
  };
  sectionVisibility?: {
    [key: string]: {
      enabled: boolean;
      adminOnly: boolean;
    };
  };
  heroBanner?: {
    image?: string;
    badge?: string;
    title?: string;
    subtitle?: string;
    description?: string;
    buttonText?: string;
    buttonLink?: string;
  };
  siteTexts?: {
    // Featured Tailors Section
    featuredTailorsTitle?: string;
    featuredTailorsSubtitle?: string;
    
    // Contact Footer
    contactTitle?: string;
    contactSubtitle?: string;
    contactEmail?: string;
    contactPhone?: string;
    contactAddress?: string;
    footerCopyright?: string;
    
    // Browse Shops Button
    browseShopsText?: string;
    
    // Search Bar
    searchPlaceholder?: string;
    
    // Categories
    categoriesTitle?: string;
    
    // Products Grid
    productsTitle?: string;
  };
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    whatsapp?: string;
    tiktok?: string;
    snapchat?: string;
  };
  seo?: {
    siteTitle?: string;
    metaDescription?: string;
    keywords?: string;
    ogImage?: string;
    favicon?: string;
  };
  orderSettings?: {
    minOrderValue?: number;
    defaultShippingFee?: number;
    estimatedDeliveryDays?: number;
    orderNotificationMessage?: string;
    allowGuestOrders?: boolean;
  };
  notificationSettings?: {
    welcomeTitle?: string;
    welcomeMessage?: string;
    enableNewOrderNotifications?: boolean;
    enablePromotionalNotifications?: boolean;
    enableOrderStatusNotifications?: boolean;
  };
  pageTexts?: {
    aboutUs?: string;
    termsAndConditions?: string;
    privacyPolicy?: string;
    returnPolicy?: string;
  };
  discountSettings?: {
    enableCoupons?: boolean;
    goldMembershipDiscount?: number;
    promotionalMessage?: string;
    enableFirstOrderDiscount?: boolean;
    firstOrderDiscountPercent?: number;
  };
  reviewSettings?: {
    allowGuestReviews?: boolean;
    minimumStarsToShow?: number;
    requestReviewMessage?: string;
    enableReviewModeration?: boolean;
  };
  imageSettings?: {
    maxImageSize?: number; // in MB
    imageQuality?: number; // 1-100
    allowImageUploads?: boolean;
    maxImagesPerProduct?: number;
    maxImagesPerPortfolio?: number;
  };
  paymentSettings?: {
    enableCash?: boolean;
    enableCard?: boolean;
    enableKnet?: boolean;
    enableCOD?: boolean; // Cash on Delivery
    paymentConfirmationMessage?: string;
  };
  homePageSettings?: {
    featuredTailorsCount?: number;
    filteredTailorsByRegionCount?: number; // عدد الخياطين المعروضين في قسم الخياطين حسب المناطق
    bannerImages?: {
      hero?: string;
      design?: string;
      ads?: string;
    };
  };
  productPageConfig?: ProductPageConfig; // Product page configuration
  // Default password for tailor onboarding (admin-configurable)
  tailorDefaultPassword?: string;
}

export type OrderStatus = 'pending' | 'measuring' | 'cutting' | 'sewing' | 'ready' | 'delivered' | 'cancelled' | 'rejected';

export type NegotiationStatus = 'none' | 'requested' | 'accepted' | 'rejected';

export type FabricSource = 'tailor' | 'customer' | 'store';
export type PaymentStatus = 'pending' | 'partial' | 'paid';
export type DeliveryMethod = 'pickup' | 'delivery';
export type NotificationChannel = 'whatsapp' | 'email' | 'sms';

export interface OrderMeasurements {
  neck?: number;
  chest?: number;
  shoulder?: number;
  shoulders?: number;
  sleeve?: number;
  length?: number;
  waist?: number;
  wrist?: number;
  shoe?: number;
  thigh?: number;
}

export interface Order {
  id: string;
  orderNumber?: string; // رقم الطلب الذكي (مثال: AHM-2512-1234)
  productId: string;
  productName: string;
  productCategory?: string; // فئة المنتج (دشداشة، بدلة، عباية، إلخ)
  productImage: string;
  price: number;
  tailorName: string;
  tailorId: string;
  userId: string;
  customerName?: string; // اسم العميل
  customerPhone?: string; // رقم هاتف العميل
  customerEmail?: string; // بريد العميل
  status: OrderStatus;
  orderDate: string;
  completionDate?: string;
  
  // Negotiation fields
  negotiationStatus?: NegotiationStatus;
  requestedPrice?: number;
  customerNote?: string;

  // Ordering Details
  measurements?: OrderMeasurements;
  measurementLabels?: Record<string, string>;
  templateId?: string;
  templateUrl?: string;
  templatePoints?: any[];
  templateArrows?: any[];
  fabricSource?: FabricSource;
  paymentStatus?: PaymentStatus;
  
  // Edit Status
  canEdit?: boolean; // يمكن التعديل قبل بدء التفصيل
  acceptedByTailor?: boolean; // هل قبل الخياط الطلب
  acceptedAt?: string; // تاريخ قبول الطلب
  rejectionReason?: string; // سبب الرفض/الإلغاء
  
  // Delivery & Notifications
  deliveryMethod?: DeliveryMethod; // طريقة الاستلام
  deliveryAddress?: string; // عنوان التوصيل
  readyNotificationSent?: boolean; // تم إرسال إشعار الجاهزية
  readyNotificationDate?: string; // تاريخ إرسال الإشعار
  notificationChannels?: NotificationChannel[]; // قنوات الإشعار المستخدمة
  notes?: string;
  comments?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// --- New Account Interfaces ---

export interface FamilyMember {
  id: string;
  userId?: string; // ID of the main user who owner this member record
  name: string;
  relation: string;
  relationship?: string; // Alternative naming
  avatar?: string;
  gender?: 'male' | 'female';
  measurements?: any[];
  updatedAt?: string;
  createdAt?: string;
}

export interface SavedShop {
  id: string;
  name: string;
  image: string;
  rating: number;
  location: string;
}

export interface PaymentMethod {
  id: string;
  type: 'visa' | 'mastercard' | 'amex';
  last4: string;
  expiry: string;
}

// --- Admin Dashboard Specific Types ---

export interface SystemLog {
  id: string;
  action: string;
  adminName: string;
  timestamp: string;
  details: string;
  type: 'info' | 'warning' | 'error';
}

export interface Fabric {
  id: string;
  name: string;
  code: string;
  type: string;
  color: string;
  stock: number; // in meters
  pricePerMeter: number;
  image: string;
}

export type GarmentType = 'dishdasha' | 'thobe' | 'abaya' | 'dress' | 'omani' | 'dhofari' | 'suri' | 'shirt' | 'suit' | 'other';

export interface MeasurementPoint {
  id: string;
  label: string;
  x: number; // relative 0-1 position on the image (left)
  y: number; // relative 0-1 position on the image (top)
  direction?: number; // arrow angle in degrees
  note?: string;
  order?: number; // sequencing for arrows
}

export interface MeasurementTemplateVariation {
  id: string;
  name: string;
  imageUrl: string;
  enabled: boolean;
  points?: MeasurementPoint[];
  arrows?: { id: string; startX: number; startY: number; endX: number; endY: number }[];
}

export interface MeasurementTemplate {
  id: string;
  name: string;
  productType: GarmentType; // deprecated - استخدم categoryId بدلاً منه
  categoryId?: string; // معرف التصنيف من نظام التصنيفات الجديد
  baseImageUrl?: string; // uploaded image for the template
  baseImageName?: string; // editable display name for base image
  variations?: MeasurementTemplateVariation[]; // additional images that share points/arrows with variation-level offsets
  categoryImageUrl?: string; // الصورة المصغرة للتصنيف المرتبط
  vectorUrl?: string; // optional vector (SVG) reference
  points: MeasurementPoint[];
  arrows?: { id: string; startX: number; startY: number; endX: number; endY: number }[];
  pointSize?: number; // حجم النقاط (28-64px)
  pointOpacity?: number; // شفافية النقاط (50-100%)
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeasurementProfile {
  id: string;
  userId: string;
  name: string; // اسم المقاس (مثل: "مقاسي الشخصي"، "مقاس أحمد")
  type: GarmentType;
  metrics: Record<string, number>; // e.g., { chest: 40, length: 150, shoulder: 45 }
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyProfile {
  id: string;
  headUserId: string;
  members: { name: string, relation: string, measurementId?: string }[];
}

export interface AIModelConfig {
  id: string;
  name: string;
  version: string;
  status: 'active' | 'training' | 'inactive';
  accuracy: number;
  lastUpdated: string;
}

// Fabric and Materials Types
export type MaterialType = 'fabric' | 'thread' | 'accessory';
export type FabricCategory = 'cotton' | 'silk' | 'wool' | 'linen' | 'polyester' | 'mixed' | 'other';

export interface FabricMaterial {
  id: string;
  tailorId: string;
  type: MaterialType;
  name: string;
  description: string;
  category?: FabricCategory; // للأقمشة فقط
  price: number; // السعر بالمتر للأقمشة، أو السعر بالوحدة للخيوط والملحقات
  unit: 'meter' | 'piece' | 'spool'; // وحدة البيع
  image: string;
  images?: string[]; // صور إضافية
  inStock: boolean;
  quantity?: number; // الكمية المتوفرة
  color?: string;
  width?: number; // عرض القماش بالسم (للأقمشة)
  weight?: number; // وزن القماش بالجرام (للأقمشة)
  origin?: string; // بلد المنشأ
  specifications?: Record<string, string>; // مواصفات إضافية
  createdAt: string;
  updatedAt: string;
}

// Portfolio Items (معرض الأعمال)
export interface PortfolioItem {
  id: string;
  ownerId: string; // ID الخياط أو البوتيك أو المحل
  ownerName: string;
  type: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string; // صورة مصغرة للفيديو
  title: string;
  description?: string;
  tags?: string[];
  likes?: number;
  views?: number;
  createdAt: string;
  updatedAt: string;
}

// Wishlist Items
export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product?: Product; // معلومات المنتج
  addedAt: string;
}

// Product Collections (المجموعات)
export interface ProductCollection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  products: string[]; // IDs المنتجات
  isPublic: boolean;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
}

// Product Likes
export interface ProductLike {
  id: string;
  userId: string;
  productId: string;
  likedAt: string;
}

// ===== Designer Feature Types =====

// Fabric Pattern Settings (for fabric scale/repeat control)
export interface FabricPatternSettings {
  patternScale: number; // Scale factor (0.25 - 2.0), default 1.0
  patternOffsetX?: number; // Horizontal offset in pixels
  patternOffsetY?: number; // Vertical offset in pixels
  patternRotation?: number; // Rotation angle in degrees
  patternRepeatMode?: 'repeat' | 'mirror' | 'no-repeat'; // How pattern repeats
}

// Design Recommendation (for "customers also bought" feature)
export interface DesignRecommendation {
  id: string;
  primaryItemId: string; // fabricId or optionId
  primaryItemType: 'fabric' | 'option'; // Type of primary item
  recommendedItemId: string; // fabricId or optionId
  recommendedItemType: 'fabric' | 'option'; // Type of recommended item
  score: number; // Recommendation strength (co-occurrence count or percentage)
  ruleType: 'behavioral' | 'manual' | 'ml'; // Source of recommendation
  isActive: boolean; // Can be disabled by admin
  createdAt: string;
  updatedAt: string;
}

// User Design (saved custom design)
export interface UserDesign {
  id: string;
  userId: string;
  templateId: string; // e.g., 'dishdasha', 'abaya', 'dress'
  templateName: string;
  fabricId?: string; // Selected fabric
  fabricSettings?: FabricPatternSettings; // Pattern scale/offset settings
  selectedOptions: DesignOption[]; // Neck, sleeves, embroidery, etc.
  generatedImageUrl?: string; // AI-generated preview
  techPackUrl?: string; // Technical specifications document
  prompt?: string; // AI prompt used (if sketch mode)
  sketchImageUrl?: string; // Uploaded sketch (if any)
  status: 'draft' | 'saved' | 'ordered'; // Design status
  createdAt: string;
  updatedAt: string;
}

// Design Option (neck style, sleeve type, embroidery, etc.)
export interface DesignOption {
  id: string;
  category: 'neck' | 'sleeve' | 'embroidery' | 'stitching' | 'other';
  name: string;
  nameEn?: string;
  thumbnailUrl?: string;
  price?: number; // Additional cost if any
  description?: string;
}

// Analytics Event (for tracking design combinations)
export interface DesignAnalyticsEvent {
  id: string;
  userId: string;
  eventType: 'design_created' | 'design_saved' | 'added_to_cart' | 'purchased';
  designId: string;
  fabricId?: string;
  selectedOptionIds: string[]; // Array of option IDs used
  timestamp: string;
}
