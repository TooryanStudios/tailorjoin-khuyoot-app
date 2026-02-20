# Firebase Auth 400 Error - Fix Guide

## Problem
Firebase Authentication REST API returns `400 (Bad Request)` when trying to log in.

## Error Details
```
POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword
Status: 400 (Bad Request)
```

This error means the Firebase Auth API rejected the login request. Common causes:

---

## Solution 1: Enable Email/Password Authentication ✅

### Steps:
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select project: **khuyoot-app01**
3. Go to **Authentication** → **Sign-in method** tab
4. Find **Email/Password** provider
5. Click **Edit** (pencil icon)
6. Toggle **Enable** switch to ON
7. Click **Save**

![image](https://firebasestorage.googleapis.com/v0/b/gitbook-x-prod.appspot.com/o/spaces%2F-LhFBZSGWnKTjUz9iFJZ%2Fuploads%2FZr2xYcfWZPJ2dLWdM7Kr%2Ffile.png)

---

## Solution 2: Verify User Exists 👤

### Check if the user account exists:
1. Firebase Console → **Authentication** → **Users** tab
2. Search for: `arousalghabi@khuyoot.app`
3. If NOT found, create it:
   - Click **Add user**
   - Enter email: `arousalghabi@khuyoot.app`
   - Enter password (minimum 6 characters)
   - Click **Add user**

### Alternative: Use Existing Test Account
From `SETUP_DEV_ACCOUNTS.md`:
```
Email: master.admin@khuyoot.app
Password: T00ryan@rtz
Role: admin
```

---

## Solution 3: Check Firebase Project Configuration 🔧

Verify your Firebase config matches the project:

**Current Config** (from `.env`):
```env
VITE_FIREBASE_API_KEY=AIzaSyB_SsoGd22clhuuqKHPQ_eyEEB8-YHOJvI
VITE_FIREBASE_PROJECT_ID=khuyoot-app01
VITE_FIREBASE_AUTH_DOMAIN=khuyoot-app01.firebaseapp.com
```

**Verify in Firebase Console:**
1. Project Settings (⚙️ gear icon)
2. Under "Your apps" → Web app
3. Compare API Key and Project ID
4. If different, update `.env` file and restart dev server

---

## Solution 4: Check API Key Restrictions 🔐

If the API key has restrictions:
1. Firebase Console → **Project Settings**
2. Click on your **Web App**
3. Scroll to **API Key**
4. Click on the API key link (opens Google Cloud Console)
5. Check **Application restrictions**:
   - Should be "None" for development
   - Or add your domain: `localhost:3000`, `dev.khuyoot.app`
6. Check **API restrictions**:
   - Should include "Identity Toolkit API"
7. Save changes and wait 5 minutes for propagation

---

## Solution 5: Test Auth Directly 🧪

### Option A: Use the test page
1. Open: `http://localhost:3000/rest-auth-test.html`
2. Enter credentials
3. Click "تسجيل الدخول (REST)"
4. Check console for detailed error message

### Option B: Test with curl
```bash
curl -X POST \
  'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyB_SsoGd22clhuuqKHPQ_eyEEB8-YHOJvI' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "arousalghabi@khuyoot.app",
    "password": "YOUR_PASSWORD",
    "returnSecureToken": true
  }'
```

**Expected responses:**

✅ **Success (200 OK):**
```json
{
  "idToken": "eyJhbGc...",
  "email": "arousalghabi@khuyoot.app",
  "refreshToken": "...",
  "expiresIn": "3600",
  "localId": "abc123..."
}
```

❌ **Email/Password disabled (400):**
```json
{
  "error": {
    "code": 400,
    "message": "PASSWORD_LOGIN_DISABLED"
  }
}
```

❌ **Wrong credentials (400):**
```json
{
  "error": {
    "code": 400,
    "message": "INVALID_LOGIN_CREDENTIALS"
  }
}
```

❌ **Email not found (400):**
```json
{
  "error": {
    "code": 400,
    "message": "EMAIL_NOT_FOUND"
  }
}
```

---

## Verification Checklist ✅

After applying fixes, verify:

- [ ] Email/Password sign-in method is **Enabled** in Firebase Console
- [ ] User account exists in Firebase Authentication → Users
- [ ] API key matches between `.env` and Firebase Console
- [ ] API key has no restrictions blocking localhost
- [ ] Test login with existing account: `master.admin@khuyoot.app`
- [ ] Dev server restarted after any `.env` changes
- [ ] Browser cache cleared (Ctrl+Shift+Delete)
- [ ] No browser extensions blocking requests

---

## Still Not Working? 🤔

### Debug Steps:
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try logging in again
4. Click on the failed request to `signInWithPassword`
5. Check **Response** tab for the exact error message
6. Check **Headers** tab to verify the API key being used

### Common Error Messages:

| Error Code | Meaning | Fix |
|------------|---------|-----|
| `PASSWORD_LOGIN_DISABLED` | Email/Password auth disabled | Enable in Console |
| `INVALID_LOGIN_CREDENTIALS` | Wrong email/password | Check credentials |
| `EMAIL_NOT_FOUND` | Account doesn't exist | Create user in Console |
| `TOO_MANY_ATTEMPTS_TRY_LATER` | Rate limited | Wait 5-10 minutes |
| `USER_DISABLED` | Account disabled | Enable in Console |
| `INVALID_API_KEY` | Wrong API key | Update `.env` file |

---

## Contact Info

If issue persists:
1. Take screenshot of DevTools → Network → Response
2. Share the exact error message from console
3. Confirm which solution steps you've tried

**Project:** khuyoot-app01  
**Auth Domain:** khuyoot-app01.firebaseapp.com  
**API Key (prefix):** AIzaSyB_SsoGd...

---

**Last Updated:** February 18, 2026
