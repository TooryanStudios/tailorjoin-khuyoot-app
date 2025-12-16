# User Schema Migration V1

## 📋 Overview

This migration extends the Khuyoot user schema with new fields while maintaining **100% backwards compatibility**. All existing user data is preserved, and new fields are added with safe defaults.

## ✨ What's New

### System & Account Fields
- `uid` - Firebase Auth UID (same as doc id)
- `accountStatus` - 'active' | 'suspended' | 'banned' | 'pending_review'
- `dataVersion` - Schema version number (starts at 1)
- `createdAt`, `updatedAt`, `lastLoginAt` - Proper timestamp tracking

### Verification & Security
- `isEmailVerified`, `isPhoneVerified` - Email/phone verification status
- `authProvider` - 'password' | 'google' | 'apple'
- `passwordUpdatedAt` - Track password changes

### Language & Notifications
- `preferredLanguage` - 'ar' | 'en'
- `notificationPreferences` - Email, SMS, Push, WhatsApp settings

### Location & Visibility
- `coordinates` - {lat, lng} for map features
- `serviceAreas` - Array of regions served
- `isVisible` - Show/hide in public listings

### Tailor-Specific Fields
- `shopName` - Business name (defaults to user name)
- `services` - Array of services offered
- `specializations` - Array of specialization tags
- `workingHours` - {days, from, to} schedule
- `deliveryAvailable`, `homeVisitAvailable` - Service options
- `verificationStatus` - Business verification state
- `businessLicense` - License number
- `verificationDocuments` - Array of uploaded docs
- `socialMedia` - Instagram, TikTok, Snapchat, Website
- `priceRange` - {min, max, currency}
- `acceptingOrders` - Currently accepting new orders
- `maxActiveOrders` - Order capacity limit

### Trust & Stats
- `ratingAvg`, `ratingCount` - Average rating and count
- `completedOrdersCount` - Total completed orders

### Monetization
- `subscription` - {tier, expiresAt} subscription info

### Compliance
- `termsAcceptedAt`, `privacyAcceptedAt` - Legal acceptance timestamps
- `reportsCount` - Number of reports against user
- `blockedByAdmin` - Admin block status

## 🔒 Safety Guarantees

✅ **No data loss** - Existing fields are never deleted or renamed
✅ **Backwards compatible** - Old code continues to work
✅ **Idempotent** - Can run migration multiple times safely
✅ **Batch processing** - Processes users in small batches
✅ **Error isolation** - One failure doesn't stop the entire migration
✅ **Detailed logging** - See exactly what's happening

## 🚀 How to Run

### Option 1: Browser Console (Recommended)

1. Start dev server: `npm run dev`
2. Login to admin panel: `http://localhost:3001/admin`
3. Open browser console (F12)
4. Copy contents of `scripts/migrate_v1_browser_standalone.js`
5. Paste into console and press Enter
6. Watch the progress logs (shows each user being updated)
7. Reload page when complete to see updated data

### Option 2: Migration Button (If Implemented)

1. Login to admin panel
2. Go to Users Management
3. Click "Migrate Schema V1" button
4. Wait for completion
5. Reload page

## 📊 What Happens

The migration:
1. Loads all users from Firestore
2. For each user:
   - Applies default values for missing fields
   - Determines role from existing data
   - Sets account status based on approval
   - Adds timestamps if missing
   - Configures notification preferences
   - Sets up tailor profile (if applicable)
3. Updates only the missing fields in Firestore
4. Shows detailed progress logs
5. Provides summary statistics

## 🎯 Default Values Logic

### Role Detection
```
- If role === 'admin' → admin
- If role === 'tailor' OR shopType exists → tailor
- Otherwise → customer
```

### Account Status
```
- If approvalStatus === 'approved' → active
- If approvalStatus === 'rejected' → suspended
- If blockedByAdmin === true → banned
- Otherwise → pending_review
```

### Verification Status (Tailors)
```
- If approvalStatus === 'approved' → verified
- If approvalStatus === 'pending' → pending
- If approvalStatus === 'rejected' → rejected
- Otherwise → unverified
```

### Notification Preferences
All enabled by default:
```json
{
  "email": true,
  "sms": true,
  "push": true,
  "whatsapp": true
}
```

### Service Areas (Tailors)
```
- If serviceAreas exists → use it
- If region exists → [region]
- Otherwise → []
```

### Visibility (Tailors)
```
- If isVisible is set → use it
- If approvalStatus === 'approved' → true
- Otherwise → false
```

## 🔍 Verification

After migration, check:

1. **Admin Panel** - Open user edit dialog, check debug panel
2. **Firestore Console** - Verify fields in Firebase Console
3. **Application Logs** - Check for any errors
4. **User Count** - Verify all users were processed

## ⚠️ Important Notes

### What This Migration Does NOT Do

❌ Does NOT store bank details in user document
❌ Does NOT store large arrays (favorites, search history)
❌ Does NOT break existing UI or features
❌ Does NOT require downtime
❌ Does NOT delete any existing data

### Sensitive Data

🔐 **Bank details** must be stored in a separate collection:
```
/merchant_private/{uid}
```
with server-only read access.

### Large Arrays

📦 **Favorites, search history, etc.** should use subcollections:
```
/users/{uid}/favorites/{itemId}
/users/{uid}/search_history/{timestamp}
```

## 🐛 Troubleshooting

### Migration fails with permission error
- Ensure you're logged in as admin
- Check Firestore security rules
- Verify admin role in database

### Some fields not appearing
- Reload the page/application
- Check browser console for errors
- Verify field names match schema

### Migration runs but nothing changes
- Users may already have all fields
- Check "Skipped" count in summary
- This is normal for re-runs

## 📝 Code Changes

### Files Modified
- `types/user-schema.ts` - New TypeScript interfaces
- `utils/userDefaults.ts` - Default value logic
- `services/firebase.ts` - Apply defaults on read
- `scripts/migrate_users_v1_browser.js` - Migration script

### Files Created
- `types/user-schema.ts`
- `utils/userDefaults.ts`
- `scripts/migrate_users_v1_browser.js`
- `USER_SCHEMA_MIGRATION_V1.md` (this file)

## 🔄 Future Migrations

When adding new fields in the future:

1. Update `types/user-schema.ts`
2. Update `utils/userDefaults.ts`
3. Increment `dataVersion`
4. Create new migration script
5. Test on dev environment
6. Run on production
7. Document changes

## 📞 Support

If you encounter issues:

1. Check the console logs for errors
2. Verify your admin permissions
3. Review the troubleshooting section
4. Check Firestore security rules
5. Contact the development team

---

**Version:** 1.0.0  
**Date:** December 14, 2025  
**Author:** Khuyoot Development Team
