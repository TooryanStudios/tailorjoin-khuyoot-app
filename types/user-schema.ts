/**
 * Khuyoot User Schema v1
 * 
 * Extended user schema with backwards compatibility.
 * All new fields have safe defaults.
 */

export type UserRole = 'tailor' | 'customer' | 'admin';
export type AccountStatus = 'active' | 'suspended' | 'banned' | 'pending_review';
export type AuthProvider = 'password' | 'google' | 'apple';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type SubscriptionTier = 'free' | 'basic' | 'premium';
export type PreferredLanguage = 'ar' | 'en';

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  whatsapp: boolean;
}

export interface Coordinates {
  lat: number | null;
  lng: number | null;
}

export interface WorkingHours {
  days: string[];
  from: string;
  to: string;
}

export interface VerificationDocument {
  type: string;
  url: string;
  uploadedAt: string;
}

export interface SocialMedia {
  instagram?: string;
  tiktok?: string;
  snapchat?: string;
  website?: string;
}

export interface PriceRange {
  min: number | null;
  max: number | null;
  currency: 'OMR';
}

export interface Subscription {
  tier: SubscriptionTier;
  expiresAt: string | null;
}

/**
 * Base user fields - common to all users
 */
export interface UserBase {
  // Identity
  id: string;
  uid: string; // Firebase auth UID (same as id)
  name: string;
  email: string;
  phone?: string;
  loginId?: string;
  
  // System
  role: UserRole;
  accountStatus: AccountStatus;
  dataVersion: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
  joinDate?: string; // Keep for backwards compatibility
  
  // Verification & Security
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  authProvider: AuthProvider;
  passwordUpdatedAt: string | null;
  createdByAdmin: boolean;
  requirePasswordChange: boolean;
  
  // Language & Notifications
  preferredLanguage: PreferredLanguage;
  notificationPreferences: NotificationPreferences;
  
  // Location
  region?: string;
  coordinates: Coordinates;
  
  // Profile
  avatar?: string;
  profileImage?: string;
  boardImage?: string;
  bio?: string;
  
  // Compliance
  termsAcceptedAt: string | null;
  privacyAcceptedAt: string | null;
  reportsCount: number;
  blockedByAdmin: boolean;
  
  // Legacy fields
  isGuest?: boolean;
  gender?: string;
  ageGroup?: string;
  isGoldMember?: boolean;
}

/**
 * Tailor-specific profile fields
 */
export interface TailorProfile extends UserBase {
  role: 'tailor';
  
  // Business Info
  shopType: 'tailor' | 'boutique' | 'fabric_store' | 'sewing_supplies';
  shopName: string;
  location: string;
  serviceAreas: string[];
  isVisible: boolean;
  
  // Services
  services: string[];
  specializations: string[];
  specialization?: string; // Legacy field (gender: 'male' | 'female')
  experience?: string;
  
  // Scheduling
  workingHours: WorkingHours | null;
  deliveryAvailable: boolean;
  homeVisitAvailable: boolean;
  
  // Verification
  verificationStatus: VerificationStatus;
  approvalStatus?: 'pending' | 'approved' | 'rejected'; // Legacy
  businessLicense: string | null;
  verificationDocuments: VerificationDocument[];
  
  // Social
  socialMedia: SocialMedia;
  
  // Pricing
  priceRange: PriceRange;
  
  // Orders
  acceptingOrders: boolean;
  maxActiveOrders: number | null;
  
  // Stats
  ratingAvg: number;
  ratingCount: number;
  rating?: number; // Legacy
  reviewsCount?: number; // Legacy
  completedOrdersCount: number;
  
  // Featured Status
  isFeatured: boolean;
  
  // Monetization
  subscription: Subscription;
}

/**
 * Customer-specific profile fields
 */
export interface CustomerProfile extends UserBase {
  role: 'customer';
  
  // Stats (kept in main doc for quick access)
  ratingAvg: number;
  ratingCount: number;
  completedOrdersCount: number;
}

/**
 * Admin-specific profile fields
 */
export interface AdminProfile extends UserBase {
  role: 'admin';
}

/**
 * Union type for all user profiles
 */
export type UserProfile = TailorProfile | CustomerProfile | AdminProfile;

/**
 * Type guard functions
 */
export function isTailor(user: UserProfile): user is TailorProfile {
  return user.role === 'tailor';
}

export function isCustomer(user: UserProfile): user is CustomerProfile {
  return user.role === 'customer';
}

export function isAdmin(user: UserProfile): user is AdminProfile {
  return user.role === 'admin';
}
