# Firestore Security Rules - Early Rollout Phase

## Overview

These rules are designed for the **early field rollout phase** where:
- ❌ No Firebase Authentication yet
- ✅ Field agent is present during tailor registration
- ✅ Must prevent public writes
- ✅ Minimal complexity for quick deployment

---

## Security Approach: Pre-Authorized UIDs

### Why This Approach?

**Firestore Security Rules CANNOT:**
- ❌ Compute SHA-256 hashes
- ❌ Access request headers
- ❌ Call external APIs
- ❌ Use cryptographic functions

**What Works:**
✅ Document existence checks
✅ Field value comparisons
✅ Boolean logic

### How It Works

1. **Field Agent Preparation** (Before Tailor Arrives):
   ```javascript
   // Field agent creates allowlist document via Firebase Console or script
   db.collection('system').doc('allowedUids').doc('GENERATED_UID').set({
     enabled: true,
     createdBy: 'agent@khuyoot.com',
     createdAt: Timestamp.now(),
     notes: 'Tailor: Mohammed Al-Said, Shop: خياطة النجاح'
   });
   ```

2. **Client Registration Flow**:
   ```javascript
   // Client uses the pre-authorized UID
   const uid = 'GENERATED_UID'; // Provided by field agent
   
   await db.collection('users').doc(uid).set({
     id: uid,
     uid: uid,
     phone: '+96812345678',
     shopName: 'خياطة النجاح',
     role: 'tailor',
     // ... all 61 fields
   });
   ```

3. **Rules Check**:
   - ✅ Does `system/allowedUids/{uid}` exist?
   - ✅ Is `enabled == true`?
   - ✅ Does doc pass validation (role, currency, etc.)?
   - ✅ Is `_accessKey` NOT in final document?
   - ✅ Allow write

---

## Rule Structure

### 1. System Collection
```javascript
match /system/allowedUids/{uid} {
  allow read, write: if false; // Managed by Admin SDK only
}
```

Field agent uses Firebase Console or backend script to manage these.

### 2. Users Collection
```javascript
match /users/{userId} {
  allow read: if isAllowedUID(userId);
  allow create: if isAllowedUID(userId) 
    && userId == request.resource.id
    && isValidUserDoc();
  allow update: if isAllowedUID(userId) && isValidUserDoc();
  allow delete: if false;
}
```

### 3. Products Subcollection
```javascript
match /users/{userId}/products/{productId} {
  allow read: if isAllowedUID(userId);
  allow create, update: if isAllowedUID(userId) && isValidProductDoc();
  allow delete: if isAllowedUID(userId);
}
```

---

## Data Validation

### User Document (`isValidUserDoc`)
- ✅ `role == 'tailor'`
- ✅ `loginId == phone`
- ✅ `dataVersion == 1`
- ✅ `createdByAdmin == false`
- ✅ `requirePasswordChange == false`
- ✅ `subscription.tier in ['free', 'basic', 'premium']`
- ✅ `priceRange.currency == 'OMR'`
- ✅ `notificationPreferences.*` are booleans
- ✅ `profileImage` and `boardImage` are strings (URLs only, no base64)
- ✅ `accountStatus in ['active', 'suspended', 'deleted']`
- ✅ **NO `_accessKey` field in final document**

### Product Document (`isValidProductDoc`)
- ✅ `currency == 'OMR'`
- ✅ `imageUrls is list`
- ✅ `price is number >= 0`
- ✅ **NO `_accessKey` field**

---

## Field Agent Workflow

### Setup Script (Run Once per Tailor)
```javascript
// setup-tailor.js
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

async function authorizeNewTailor(tailorInfo) {
  const uid = db.collection('users').doc().id; // Generate new UID
  
  await db.collection('system').doc('allowedUids').doc(uid).set({
    enabled: true,
    createdBy: 'field-agent',
    createdAt: admin.firestore.Timestamp.now(),
    tailorName: tailorInfo.name,
    shopName: tailorInfo.shopName,
    phone: tailorInfo.phone,
    notes: tailorInfo.notes || ''
  });
  
  console.log(`✅ Authorized UID: ${uid}`);
  console.log(`📋 Share this with tailor registration form: ${uid}`);
  return uid;
}

// Usage
authorizeNewTailor({
  name: 'محمد السعيد',
  shopName: 'خياطة النجاح',
  phone: '+96812345678',
  notes: 'Muscat region, male tailor'
});
```

### Client Integration
```javascript
// TailorJoinFlow.jsx - Add UID input
const [authorizedUID, setAuthorizedUID] = useState('');

// Field agent provides this UID to tailor
const handleSubmit = async () => {
  const userData = mapFormToUserDoc(formData, authorizedUID);
  await db.collection('users').doc(authorizedUID).set(userData);
  // Rules will verify UID is in allowlist before allowing write
};
```

---

## Alternative Approaches (If Needed)

### Option A: One-Time Invite Codes
```javascript
// Field agent creates invite code
db.collection('system/inviteCodes').doc('CODE123').set({
  used: false,
  expiresAt: Timestamp.now() + 24h,
  maxUses: 1
});

// Rules check and consume code
function isValidInviteCode(code) {
  let codeDoc = get(/databases/$(database)/documents/system/inviteCodes/$(code));
  return codeDoc.data.used == false 
    && codeDoc.data.expiresAt > request.time;
}

// Client sends code in document
allow create: if isValidInviteCode(request.resource.data._inviteCode);

// After create, mark code as used (requires Cloud Function)
```

### Option B: Cloud Function Gate (Most Secure)
```javascript
// Cloud Function validates and writes
exports.registerTailor = functions.https.onCall(async (data, context) => {
  // Validate access token/secret server-side
  if (data.accessSecret !== process.env.FIELD_AGENT_SECRET) {
    throw new functions.https.HttpsError('permission-denied');
  }
  
  // Write to Firestore using Admin SDK (bypasses rules)
  const uid = admin.firestore().collection('users').doc().id;
  await admin.firestore().collection('users').doc(uid).set(data.userData);
  
  return { success: true, uid };
});

// Rules deny all writes (Cloud Function uses Admin SDK)
match /users/{userId} {
  allow write: if false; // Only Cloud Functions can write
}
```

---

## Security Considerations

### ✅ Secure
- Pre-authorized UIDs prevent unauthorized writes
- Schema validation prevents malformed data
- No access key stored in final documents
- Field agent controls who can register

### ⚠️ Limitations
- Field agent must pre-create UIDs (not instant)
- No cryptographic verification (no Auth)
- UID generation must be secure (use Admin SDK)

### 🔒 Before Production Launch
1. **Enable Firebase Authentication**
2. **Migrate to Auth-based rules**
3. **Add phone verification**
4. **Implement rate limiting (Cloud Functions)**
5. **Audit system/allowedUids collection**

---

## Deployment

### 1. Deploy New Rules
```bash
# Backup current rules first
firebase firestore:rules > firestore.rules.backup

# Copy rollout rules
cp firestore.rules.rollout firestore.rules

# Deploy
firebase deploy --only firestore:rules
```

### 2. Create Allowlist Documents
```javascript
// Via Firebase Console:
// 1. Go to Firestore Database
// 2. Create collection: system/allowedUids
// 3. Add document with auto-generated ID
// 4. Set field: enabled = true

// OR via script:
node scripts/authorize-tailor.js
```

### 3. Update Client Code
```javascript
// Add UID input to TailorJoinFlow
// Field agent provides UID on-site
// Client submits with pre-authorized UID
```

---

## Testing

```javascript
// Test 1: Unauthorized UID (should fail)
await db.collection('users').doc('RANDOM_UID').set({...});
// Expected: Permission denied

// Test 2: Authorized UID (should succeed)
// 1. Create system/allowedUids/TEST_UID with enabled=true
// 2. Try write:
await db.collection('users').doc('TEST_UID').set({...});
// Expected: Success

// Test 3: Invalid data (should fail)
await db.collection('users').doc('TEST_UID').set({
  role: 'admin' // Invalid for rollout
});
// Expected: Permission denied
```

---

## Migration Path to Auth

When ready to enable Firebase Authentication:

```javascript
// Phase 1: Hybrid rules (allow both pre-auth UIDs AND authenticated users)
function canWrite(userId) {
  return isAllowedUID(userId) || isAuthenticated();
}

// Phase 2: Full Auth (disable pre-auth system)
function canWrite(userId) {
  return isAuthenticated() && request.auth.uid == userId;
}

// Phase 3: Remove system/allowedUids collection
```

---

## Recommendation

**Use Pre-Authorized UIDs approach** for early rollout because:
1. ✅ No hashing limitations
2. ✅ Simple to implement
3. ✅ Auditable (see all authorized UIDs in one collection)
4. ✅ Field agent workflow is clear
5. ✅ Easy to migrate to Auth later

**Avoid shared secrets** because Firestore Rules cannot hash/verify them securely.

**Consider Cloud Functions** if you need instant registration without pre-authorization step.
