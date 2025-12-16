/**
 * User Defaults Helper
 * 
 * Applies safe default values to user documents.
 * Ensures all new fields exist without breaking existing data.
 */

import type { UserProfile, UserBase, TailorProfile, CustomerProfile } from '../types/user-schema';

/**
 * Apply default values to a raw user document from Firestore
 */
export function applyUserDefaults(rawUser: any, docId: string): UserProfile {
  const now = new Date().toISOString();
  
  // Determine role from existing data
  const role = determineRole(rawUser);
  
  // Base defaults for all users
  const base: UserBase = {
    // Identity
    id: docId,
    uid: docId,
    name: rawUser.name || 'User',
    email: rawUser.email || '',
    phone: rawUser.phone,
    loginId: rawUser.loginId || rawUser.phone || rawUser.email || '',
    
    // System
    role,
    accountStatus: determineAccountStatus(rawUser),
    dataVersion: rawUser.dataVersion || 1,
    
    // Timestamps
    createdAt: rawUser.createdAt || rawUser.joinDate || now,
    updatedAt: rawUser.updatedAt || now,
    lastLoginAt: rawUser.lastLoginAt || null,
    joinDate: rawUser.joinDate, // Legacy
    
    // Verification & Security
    isEmailVerified: rawUser.isEmailVerified || false,
    isPhoneVerified: rawUser.isPhoneVerified || false,
    authProvider: rawUser.authProvider || 'password',
    passwordUpdatedAt: rawUser.passwordUpdatedAt || null,
    createdByAdmin: rawUser.createdByAdmin || false,
    requirePasswordChange: rawUser.requirePasswordChange || false,
    
    // Language & Notifications
    preferredLanguage: rawUser.preferredLanguage || 'ar',
    notificationPreferences: rawUser.notificationPreferences || {
      email: true,
      sms: true,
      push: true,
      whatsapp: true
    },
    
    // Location
    region: rawUser.region,
    coordinates: rawUser.coordinates || { lat: null, lng: null },
    
    // Profile - Use avatar as fallback for profileImage (legacy support)
    avatar: rawUser.avatar,
    profileImage: rawUser.profileImage || rawUser.avatar || '',
    boardImage: rawUser.boardImage || '',
    bio: rawUser.bio || '',
    
    // Compliance
    termsAcceptedAt: rawUser.termsAcceptedAt || null,
    privacyAcceptedAt: rawUser.privacyAcceptedAt || null,
    reportsCount: rawUser.reportsCount || 0,
    blockedByAdmin: rawUser.blockedByAdmin || false,
    
    // Legacy
    isGuest: rawUser.isGuest,
    gender: rawUser.gender,
    ageGroup: rawUser.ageGroup || '',
    isGoldMember: rawUser.isGoldMember
  };
  
  // Role-specific defaults
  if (role === 'tailor') {
    return applyTailorDefaults(rawUser, base as any);
  } else if (role === 'admin') {
    return base as any;
  } else {
    return applyCustomerDefaults(rawUser, base as any);
  }
}

/**
 * Determine user role from existing data
 */
function determineRole(rawUser: any): 'tailor' | 'customer' | 'admin' {
  if (rawUser.role === 'admin') return 'admin';
  if (rawUser.role === 'tailor' || rawUser.shopType === 'tailor') return 'tailor';
  if (rawUser.role === 'shop' || rawUser.shopType) return 'tailor';
  if (rawUser.role === 'boutique') return 'tailor';
  return 'customer';
}

/**
 * Determine account status from existing data
 */
function determineAccountStatus(rawUser: any): 'active' | 'suspended' | 'banned' | 'pending_review' {
  if (rawUser.accountStatus) return rawUser.accountStatus;
  if (rawUser.blockedByAdmin) return 'banned';
  if (rawUser.approvalStatus === 'approved') return 'active';
  if (rawUser.approvalStatus === 'rejected') return 'suspended';
  return 'pending_review';
}

/**
 * Apply tailor-specific defaults
 */
function applyTailorDefaults(rawUser: any, base: UserBase): TailorProfile {
  const isApproved = rawUser.approvalStatus === 'approved';
  
  return {
    ...base,
    role: 'tailor',
    
    // Business Info
    shopType: rawUser.shopType || 'tailor',
    shopName: rawUser.shopName || rawUser.name,
    location: rawUser.location || rawUser.region || '',
    serviceAreas: rawUser.serviceAreas || (rawUser.region ? [rawUser.region] : []),
    isVisible: rawUser.isVisible !== undefined ? rawUser.isVisible : isApproved,
    
    // Services
    services: rawUser.services || [],
    specializations: rawUser.specializations || (rawUser.specialization ? [rawUser.specialization] : []),
    specialization: rawUser.specialization, // Legacy
    experience: rawUser.experience || '',
    
    // Scheduling
    workingHours: rawUser.workingHours || null,
    deliveryAvailable: rawUser.deliveryAvailable || false,
    homeVisitAvailable: rawUser.homeVisitAvailable || false,
    
    // Verification
    verificationStatus: determineVerificationStatus(rawUser),
    approvalStatus: rawUser.approvalStatus, // Legacy
    businessLicense: rawUser.businessLicense || null,
    verificationDocuments: rawUser.verificationDocuments || [],
    
    // Social
    socialMedia: rawUser.socialMedia || {},
    
    // Pricing
    priceRange: rawUser.priceRange || { min: null, max: null, currency: 'OMR' },
    
    // Orders
    acceptingOrders: rawUser.acceptingOrders !== undefined ? rawUser.acceptingOrders : true,
    maxActiveOrders: rawUser.maxActiveOrders || null,
    
    // Stats
    ratingAvg: rawUser.ratingAvg || rawUser.rating || 0,
    ratingCount: rawUser.ratingCount || rawUser.reviewsCount || 0,
    rating: rawUser.rating, // Legacy
    reviewsCount: rawUser.reviewsCount, // Legacy
    completedOrdersCount: rawUser.completedOrdersCount || 0,
    
    // Featured Status
    isFeatured: rawUser.isFeatured || false,
    
    // Monetization
    subscription: rawUser.subscription || { tier: 'free', expiresAt: null }
  };
}

/**
 * Determine verification status from existing data
 */
function determineVerificationStatus(rawUser: any): 'unverified' | 'pending' | 'verified' | 'rejected' {
  if (rawUser.verificationStatus) return rawUser.verificationStatus;
  if (rawUser.approvalStatus === 'approved') return 'verified';
  if (rawUser.approvalStatus === 'pending') return 'pending';
  if (rawUser.approvalStatus === 'rejected') return 'rejected';
  return 'unverified';
}

/**
 * Apply customer-specific defaults
 */
function applyCustomerDefaults(rawUser: any, base: UserBase): CustomerProfile {
  return {
    ...base,
    role: 'customer',
    
    // Stats
    ratingAvg: rawUser.ratingAvg || rawUser.rating || 0,
    ratingCount: rawUser.ratingCount || rawUser.reviewsCount || 0,
    completedOrdersCount: rawUser.completedOrdersCount || 0
  };
}

/**
 * Get only the fields that are missing from a user document
 * Used for migration - only updates what's needed
 */
export function getMissingFields(rawUser: any, fullUser: UserProfile): Partial<UserProfile> {
  const updates: any = {};
  
  for (const key in fullUser) {
    if (rawUser[key] === undefined) {
      updates[key] = (fullUser as any)[key];
    }
  }
  
  return updates;
}
