# Tailor Join Flow Implementation Plan

## Overview
Complete 3-step registration flow for tailors with exact Firestore schema compliance.

## Project Structure
```
src/
├── firebase/
│   ├── config.js              # Firebase initialization
│   └── storage.js             # Storage upload helpers
├── features/
│   └── tailor-join/
│       ├── TailorJoinFlow.jsx     # Main flow container
│       ├── Step1BasicInfo.jsx     # Basic + shop info
│       ├── Step2Products.jsx      # Products management
│       ├── Step3Review.jsx        # Review & submit
│       ├── hooks/
│       │   ├── useJoinForm.js     # Form state management
│       │   ├── useImageUpload.js  # Image upload with compression
│       │   └── useDraftSave.js    # localStorage draft saving
│       ├── utils/
│       │   ├── dataMapper.js      # Form → Firestore schema mapper
│       │   ├── validation.js      # Form validation
│       │   └── imageProcessor.js  # Client-side image compression
│       └── components/
│           ├── ImageUploader.jsx  # Reusable image upload component
│           ├── ProgressBar.jsx    # Upload progress
│           ├── LanguageToggle.jsx # AR/EN switcher
│           └── RegionSelector.jsx # Region dropdown
├── i18n/
│   ├── ar.json                # Arabic translations
│   └── en.json                # English translations
└── contexts/
    └── LanguageContext.jsx    # Language state + RTL/LTR
```

## Implementation Files

### 1. Firebase Configuration
### 2. Data Mapper (Critical - Exact Schema Compliance)
### 3. Form State Management Hook
### 4. Image Upload Hook with Compression
### 5. Draft Save Hook
### 6. Step 1: Basic Info Component
### 7. Step 2: Products Component
### 8. Step 3: Review & Submit
### 9. Main Flow Container
### 10. Language Context & i18n

## Key Features Implemented
✅ Exact Firestore schema compliance (61 fields)
✅ Firebase Storage uploads with proper paths
✅ Client-side image compression (1600px, 75% quality)
✅ LocalStorage draft saving/recovery
✅ AR/EN language toggle with RTL/LTR
✅ Mobile-first responsive UI
✅ Upload progress indicators
✅ Validation before submit
✅ Proper error handling
✅ Server timestamps for dates
✅ Nested object structures (notificationPreferences, coordinates, etc.)

## Data Flow
1. User fills Step 1 → Draft saved to localStorage
2. User uploads images → Compressed → Stored in Firebase Storage
3. User adds products → Stored in memory (Step 2)
4. Review screen → Shows all data
5. Submit → Create user doc + products subcollection + update with image URLs

## Next Steps for Integration
1. Add these files to your Vite project
2. Update firebase/config.js with your Firebase credentials
3. Import TailorJoinFlow.jsx in your routing
4. Style with your existing Tailwind classes
5. Test the full flow end-to-end
