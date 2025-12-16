// src/features/tailor-join/utils/dataMapper.js

import { Timestamp } from 'firebase/firestore';

/**
 * Maps form data to exact Firestore user document schema
 * CRITICAL: This must match the 61-field schema exactly
 */
export function mapFormToUserDoc(formData, uid) {
  const now = Timestamp.now();
  
  // Extract form fields with proper defaults
  const {
    // Step 1: Basic Info
    phone,
    email = '',
    shopName,
    region,
    location,
    gender = '',
    specializations = [],
    preferredLanguage = 'ar',
    workingHours = { from: '', to: '', days: [] },
    deliveryAvailable = false,
    homeVisitAvailable = false,
    acceptingOrders = true,
    
    // Images (will be updated after upload)
    boardImage = '',
    profileImage = '',
    
    // Other optional fields
    bio = '',
    experience = '',
    services = [],
    socialMedia = {},
    priceRange = { min: null, max: null, currency: 'OMR' },
  } = formData;

  // Build the exact user document matching the schema
  return {
    // === Identity ===
    id: uid,
    uid: uid,
    name: shopName, // name = shopName per requirements
    email: email || '',
    phone: phone,
    loginId: phone, // MUST equal phone per requirements
    
    // === System ===
    role: 'tailor',
    accountStatus: 'active',
    dataVersion: 1,
    
    // === Timestamps ===
    createdAt: now,
    updatedAt: now,
    lastLoginAt: null,
    joinDate: now, // same as createdAt per requirements
    
    // === Verification & Security ===
    isEmailVerified: false,
    isPhoneVerified: false,
    authProvider: 'password',
    passwordUpdatedAt: null,
    createdByAdmin: false,
    requirePasswordChange: false,
    
    // === Language & Notifications ===
    preferredLanguage: preferredLanguage,
    notificationPreferences: {
      email: true,
      sms: true,
      push: true,
      whatsapp: true
    },
    
    // === Location ===
    region: region || '',
    coordinates: {
      lat: null,
      lng: null
    },
    
    // === Profile ===
    profileImage: profileImage || boardImage || '', // Reuse boardImage if no separate profile
    boardImage: boardImage || '',
    bio: bio,
    
    // === Compliance ===
    termsAcceptedAt: null,
    privacyAcceptedAt: null,
    reportsCount: 0,
    blockedByAdmin: false,
    
    // === Legacy/General ===
    gender: gender,
    ageGroup: '',
    
    // === Business Info ===
    shopType: 'tailor',
    shopName: shopName,
    location: location || '',
    serviceAreas: region ? [region] : [], // default to [region]
    isVisible: true,
    
    // === Services ===
    services: services,
    specializations: specializations,
    specialization: specializations[0] || '', // First selected as primary
    experience: experience,
    
    // === Scheduling ===
    workingHours: {
      from: workingHours.from || '',
      to: workingHours.to || '',
      days: workingHours.days || []
    },
    deliveryAvailable: deliveryAvailable,
    homeVisitAvailable: homeVisitAvailable,
    
    // === Verification ===
    verificationStatus: 'verified', // Match sample
    approvalStatus: 'approved', // Match sample
    businessLicense: null,
    verificationDocuments: [],
    
    // === Social ===
    socialMedia: socialMedia,
    
    // === Pricing ===
    priceRange: {
      min: priceRange.min || null,
      max: priceRange.max || null,
      currency: 'OMR'
    },
    
    // === Orders ===
    acceptingOrders: acceptingOrders,
    maxActiveOrders: null,
    
    // === Stats ===
    ratingAvg: 0,
    ratingCount: 0,
    completedOrdersCount: 0,
    
    // === Featured Status ===
    isFeatured: false,
    
    // === Monetization ===
    subscription: {
      tier: 'free',
      expiresAt: null
    }
  };
}

/**
 * Maps product form data to Firestore product document
 */
export function mapFormToProductDoc(productData, productId, uid) {
  const now = Timestamp.now();
  
  return {
    id: productId,
    name: productData.name,
    price: Number(productData.price),
    currency: 'OMR',
    imageUrls: productData.imageUrls || [],
    createdAt: now,
    updatedAt: now,
    tailorId: uid
  };
}

/**
 * Validates required fields before submission
 */
export function validateUserData(formData) {
  const errors = [];
  
  if (!formData.phone) {
    errors.push({ field: 'phone', message: 'Phone number is required' });
  }
  
  if (!formData.shopName) {
    errors.push({ field: 'shopName', message: 'Shop name is required' });
  }
  
  if (!formData.region) {
    errors.push({ field: 'region', message: 'Region is required' });
  }
  
  if (!formData.gender) {
    errors.push({ field: 'gender', message: 'Gender/specialization is required' });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
