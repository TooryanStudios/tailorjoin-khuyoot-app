
const API_KEY = 'AIzaSyB_SsoGd22clhuuqKHPQ_eyEEB8-YHOJvI'; // From logs/env
const MOCK_UID = 'test-uid-123';
const MOCK_EMAIL = 'test@khuyoot.app';

// Mock localStorage
const localStorageMock = {
    store: {},
    getItem: function(key) { return this.store[key] || null; },
    setItem: function(key, value) { this.store[key] = value.toString(); },
    removeItem: function(key) { delete this.store[key]; },
    clear: function() { this.store = {}; }
};

// Simulate keys used in the app
const AUTH_KEY = `firebase:authUser:${API_KEY}:[DEFAULT]`;
const UI_CACHE_KEY = 'khuyoot:ui:auth_cache';
const USER_PROFILE_KEY = `khuyoot:user-profile:${MOCK_UID}`;
const HAS_SESSION_KEY = 'khuyoot:has_session';

function setupLoginState() {
    console.log('--- Setting up logged-in state ---');
    
    // 1. Auth Key (set by authBypass)
    localStorageMock.setItem(AUTH_KEY, JSON.stringify({
        uid: MOCK_UID,
        email: MOCK_EMAIL,
        stsTokenManager: { accessToken: 'token123' }
    }));

    // 2. UI Cache Key (set by AuthProvider)
    localStorageMock.setItem(UI_CACHE_KEY, JSON.stringify({
        user: { uid: MOCK_UID, email: MOCK_EMAIL },
        idToken: 'token123'
    }));

    // 3. User Profile Key (set by firebaseService.getUserProfile)
    localStorageMock.setItem(USER_PROFILE_KEY, JSON.stringify({
        id: MOCK_UID,
        email: MOCK_EMAIL,
        name: 'Test User'
    }));
    
    // 4. Session key
    localStorageMock.setItem(HAS_SESSION_KEY, 'true');

    printKeys();
}

function simulateLogout() {
    console.log('\n--- Simulating Logout (firebaseService.logout + AuthProvider handleBypassLogout) ---');
    
    // In firebaseService.logout():
    localStorageMock.removeItem(AUTH_KEY);
    
    // In AuthProvider handleBypassLogout():
    localStorageMock.removeItem(UI_CACHE_KEY);
    localStorageMock.removeItem(HAS_SESSION_KEY);
    
    printKeys();
}

function simulateNewLogin(newUid, newEmail) {
    console.log(`\n--- Simulating New Login (${newEmail}) ---`);
    const NEW_AUTH_KEY = `firebase:authUser:${API_KEY}:[DEFAULT]`; // Same key
    const NEW_USER_PROFILE_KEY = `khuyoot:user-profile:${newUid}`;

    // authBypass sets the auth key
    localStorageMock.setItem(NEW_AUTH_KEY, JSON.stringify({
        uid: newUid,
        email: newEmail,
        stsTokenManager: { accessToken: 'newToken456' }
    }));
    
    // AuthProvider reads it
    // ...
    
    printKeys();
}

function printKeys() {
    console.log('Current LocalStorage Keys:');
    const keys = Object.keys(localStorageMock.store);
    if (keys.length === 0) console.log('  (empty)');
    keys.forEach(k => {
        if (k.includes('khuyoot') || k.includes('firebase')) {
             console.log(`  - ${k}`);
        }
    });
}

function main() {
    setupLoginState();
    simulateLogout();
    
    // Check if stale profile key remains
    if (localStorageMock.getItem(USER_PROFILE_KEY)) {
        console.log(`\n⚠️ ISSUE: Old user profile key (${USER_PROFILE_KEY}) still exists!`);
    } else {
        console.log(`\n✅ Old user profile key cleared.`);
    }

    simulateNewLogin('new-uid-999', 'new@khuyoot.app');
}

main();
