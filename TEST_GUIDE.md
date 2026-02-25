# 🧪 Testing Guide: Socket.IO & Google Auth

Complete step-by-step guide to test your newly implemented Socket.IO real-time system and verify Google Auth integration.

---

## Prerequisites

✅ Dev servers running: `npm run dev:all`
- Web: http://localhost:3003 (or your actual port)
- API: http://localhost:8788

✅ Firebase credentials configured in `.env` file

---

## Part 1: Test Socket.IO Connection

### Method 1: Standalone HTML Test Page (Easiest)

1. **Open the test page:**
   ```
   File: test-socketio.html
   Location: Project root folder
   ```

2. **Open it in your browser:**
   - Right-click → "Open with Live Server" (if you have VS Code Live Server extension)
   - OR simply drag the file into Chrome/Edge
   - OR open: `file:///c:/Projects/Khuyoot%20App/Code/khuyoot/test-socketio.html`

3. **What to look for:**

   ✅ **Success indicators:**
   - Status box turns GREEN with "Connected!"
   - Socket ID appears (e.g., `xK2j9...`)
   - Transport shows: `websocket`
   - Auth Status shows: "✅ Token found"
   - Event log shows `[CONNECT] Successfully connected`

   ❌ **Failure indicators:**
   - Status box stays YELLOW or turns RED
   - "No Auth Token" message → **Solution:** Login to your app first, then refresh test page
   - "Connection Error" → **Solution:** Check if API server is running on port 8788
   - Transport shows: `polling` instead of `websocket` → **OK, but less efficient**

4. **Interactive tests:**
   - Click "🎯 Test Order Join" → Should emit event and show response in log
   - Click "🔔 Test Notification" → Should emit event (check server console)
   - Click "🔄 Reconnect" → Should disconnect and reconnect

5. **Browser DevTools verification:**
   - Open DevTools (F12)
   - Go to **Network tab**
   - Filter by **WS** (WebSocket)
   - Look for: `localhost:8788/socket.io/?...`
   - Status should be: **101 Switching Protocols** (green)
   - Click on it → **Messages tab** → See real-time events flowing

---

### Method 2: Browser Console (Manual)

If you're already logged into your main app:

1. **Open your app:** http://localhost:3003
2. **Open browser console** (F12)
3. **Run this test script:**

```javascript
// Import Socket.IO client (if not already loaded)
const script = document.createElement('script');
script.src = 'https://cdn.socket.io/4.8.1/socket.io.min.js';
document.head.appendChild(script);

script.onload = () => {
  // Get token from localStorage
  const token = localStorage.getItem('firebaseAuthToken');
  
  if (!token) {
    console.error('❌ No Firebase token found! Login first.');
    return;
  }
  
  console.log('✅ Token found:', token.substring(0, 20) + '...');
  
  // Connect to Socket.IO
  const socket = io('http://localhost:8788/orders', {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
  
  // Listen for connection
  socket.on('connect', () => {
    console.log('✅ Connected! Socket ID:', socket.id);
    console.log('✅ Transport:', socket.io.engine.transport.name);
  });
  
  socket.on('connect_error', (err) => {
    console.error('❌ Connection error:', err.message);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('❌ Disconnected:', reason);
  });
  
  // Listen for all events
  socket.onAny((event, ...args) => {
    console.log(`📨 [${event}]`, args);
  });
  
  // Test event
  console.log('🧪 Sending test event...');
  socket.emit('order:join', { orderId: 'test-order-123' });
  
  // Expose for manual testing
  window.testSocket = socket;
  console.log('✅ Socket available as: window.testSocket');
};
```

4. **Expected output:**
```
✅ Token found: eyJhbGciOiJSUzI1NiIs...
✅ Connected! Socket ID: xK2j9...
✅ Transport: websocket
🧪 Sending test event...
✅ Socket available as: window.testSocket
```

5. **Manual tests:**
```javascript
// Join an order room
window.testSocket.emit('order:join', { orderId: 'real-order-id-from-firestore' });

// Leave an order room
window.testSocket.emit('order:leave', { orderId: 'real-order-id-from-firestore' });

// Mark notification as read
window.testSocket.emit('notification:read', { notificationId: 'notif-123' });
```

---

### Method 3: React Hooks (Production Integration)

Test the actual hooks in your React components:

1. **Create a test component** (or add to existing page):

```tsx
import { useOrderSocket } from './hooks/useOrderSocket';

function SocketTest() {
  const [socket, { connected, connecting, error }] = useOrderSocket();
  
  return (
    <div className="p-4 border rounded">
      <h3>Socket.IO Status</h3>
      {connecting && <p>🔄 Connecting...</p>}
      {connected && <p>✅ Connected (ID: {socket?.id})</p>}
      {error && <p>❌ Error: {error.message}</p>}
      {!connected && !connecting && <p>⚪ Disconnected</p>}
    </div>
  );
}
```

2. **Test order tracking:**

```tsx
import { useOrderTracking } from './hooks/useOrderTracking';

function OrderTest() {
  const { order, status, realtimeConnected, loading, error } = useOrderTracking('order-id-here');
  
  return (
    <div>
      <p>Realtime: {realtimeConnected ? '🟢 ON' : '🔴 OFF'}</p>
      <p>Status: {status}</p>
      <p>Order: {JSON.stringify(order, null, 2)}</p>
    </div>
  );
}
```

3. **Test tailor assignments:**

```tsx
import { useOrderAssignments } from './hooks/useOrderAssignments';

function TailorTest() {
  const { assignments, unreadCount, markAsRead, clearAll } = useOrderAssignments({
    onAssignment: (assignment) => {
      console.log('🆕 New assignment:', assignment);
      alert(`New order: ${assignment.orderNumber}`);
    },
  });
  
  return (
    <div>
      <p>Unread: {unreadCount}</p>
      <ul>
        {assignments.map((a) => (
          <li key={a.orderId}>
            {a.orderNumber} - {a.read ? '✅' : '🔔'}
            <button onClick={() => markAsRead(a.orderId)}>Mark Read</button>
          </li>
        ))}
      </ul>
      <button onClick={clearAll}>Clear All</button>
    </div>
  );
}
```

---

## Part 2: Test Google Auth

### Method 1: Standalone Test Page

1. **First: Configure Firebase credentials**
   
   Open `test-google-auth.html` and replace the placeholder config:
   
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_ACTUAL_API_KEY",
     authDomain: "your-project-id.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project-id.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```
   
   **Where to get these values:**
   - Open your `.env` file in the project root
   - Copy the `VITE_FIREBASE_*` values

2. **Open the test page:**
   ```
   File: test-google-auth.html
   Location: Project root folder
   ```
   
3. **Click "🔑 Login with Google"**

4. **What should happen:**

   ✅ **Success flow:**
   - Google OAuth popup window opens
   - You select your Google account
   - Popup closes automatically
   - Page shows: "✅ Logged In Successfully"
   - Your profile photo, name, email appear
   - JWT token displays at bottom (long string)
   - Browser console: `✅ Firebase ID Token: eyJhbGc...`

   ❌ **Failure scenarios:**

   **Error: "Firebase config not loaded!"**
   - **Solution:** Update the `firebaseConfig` object with real credentials
   
   **Error: "auth/popup-blocked"**
   - **Solution:** Allow popups for localhost in browser settings
   
   **Error: "auth/unauthorized-domain"**
   - **Solution:** Add localhost to authorized domains in Firebase Console
     - Go to: Firebase Console → Authentication → Settings → Authorized domains
     - Add: `localhost`
   
   **Error: "auth/invalid-api-key"**
   - **Solution:** Check your `.env` file has correct `VITE_FIREBASE_API_KEY`

5. **Verify token storage:**
   - Open DevTools → Application tab → Local Storage → file://
   - Look for: `firebaseAuthToken`
   - Should contain a long JWT string

6. **Test logout:**
   - Click "🚪 Logout"
   - User info should disappear
   - Token should be cleared from localStorage

---

### Method 2: Test in Main App

1. **Open your app:** http://localhost:3003

2. **Navigate to login page**

3. **Click your Google login button**

4. **After successful login:**
   - Open DevTools console (F12)
   - Run: `console.log(localStorage.getItem('firebaseAuthToken'))`
   - Should output a long JWT string like: `eyJhbGciOiJSUzI1NiIs...`

5. **Verify user data:**
   ```javascript
   // In browser console
   const token = localStorage.getItem('firebaseAuthToken');
   console.log('Token exists:', !!token);
   console.log('Token length:', token?.length);
   console.log('Token (first 50 chars):', token?.substring(0, 50));
   ```

---

## Part 3: Test Socket.IO + Google Auth Integration

This tests that Socket.IO correctly accepts Firebase JWT tokens.

### Test Sequence:

1. **Login via Google Auth** (either main app or test page)
   - Verify token exists: `localStorage.getItem('firebaseAuthToken')`

2. **Open Socket.IO test page** (`test-socketio.html`)
   - Should auto-connect using the stored token
   - Status should show: "✅ Token found"
   - Connection should succeed

3. **Watch for authentication success:**
   - Browser console should show: `[CONNECT] Successfully connected`
   - Socket ID should appear
   - No `auth_error` events in DevTools → Network → WS → Messages

4. **Test with invalid token:**
   ```javascript
   // In browser console
   localStorage.setItem('firebaseAuthToken', 'invalid-token-xyz');
   location.reload(); // Reload test page
   ```
   - Expected: Connection should FAIL
   - Error message: "Invalid token" or "Authentication error"

5. **Restore valid token:**
   - Login again to get a fresh valid token
   - Reload Socket.IO test page
   - Should connect successfully

---

## Part 4: Test Real-Time Order Updates

This tests the full end-to-end flow.

### Setup:

1. **Open two browser windows side-by-side:**
   - Window A: Your app with an order details page
   - Window B: Firebase Console (Firestore database)

2. **In Window A (your app):**
   - Navigate to an order details page
   - Make sure the order uses `useOrderTracking()` hook
   - Note the order ID from URL or console

3. **Watch console in Window A:**
   ```javascript
   // Should see:
   [Socket.IO] Connected to /orders namespace
   [useOrderTracking] Joined room: order:abc123
   [useOrderTracking] Realtime enabled: true
   ```

### Test Real-Time Update:

1. **In Window B (Firebase Console):**
   - Go to: Firestore → `orders` collection
   - Find the order you're watching in Window A
   - Click to edit

2. **Change the `status` field:**
   - From: `pending`
   - To: `measuring`
   - Click "Update"

3. **In Window A (your app):**
   - **Expected result:** Order status updates INSTANTLY (< 100ms)
   - No page refresh needed
   - Console should show: `[order:status-changed] pending → measuring`

4. **If it doesn't update:**
   - Check console for errors
   - Verify Socket.IO connection is green in Network tab
   - Check that `useOrderTracking()` is actually being called
   - Try refreshing page and testing again

---

## Part 5: Test Tailor Assignment Notifications

### Setup:

1. **Login as a tailor user** (or create one in Firestore)
2. **Note the tailor's UID** (from Firebase Auth or console)

3. **Open page with `useOrderAssignments()` hook**
   - Example: Tailor dashboard
   - Console should show: `[useOrderAssignments] Listening for assignments`

### Test Assignment:

1. **In Firebase Console (Firestore):**
   - Create a NEW order:
     ```json
     {
       "orderId": "order-test-123",
       "orderNumber": "ORD-2024-001",
       "tailorId": "YOUR_TAILOR_UID_HERE",
       "status": "pending",
       "productName": "Test Product",
       "userId": "customer-uid",
       "orderDate": "2024-01-15T10:00:00Z"
     }
     ```
   
   OR update an existing order to assign it to the tailor:
   - Find an order
   - Set `tailorId` field to your tailor's UID
   - Save

2. **In your app (tailor dashboard):**
   - **Expected result:** Notification appears INSTANTLY
   - Sound alert plays (if enabled)
   - `onAssignment` callback fires
   - Console: `[order:assigned] { orderId: 'order-test-123', ... }`

3. **Click "Mark as Read":**
   - Notification should disappear or change appearance
   - Console: `[notification:read] { notificationId: 'order-test-123' }`

---

## Troubleshooting

### Socket.IO Not Connecting

**Symptom:** Status stays "Connecting..." or shows error

**Solutions:**
1. Check API server is running:
   ```bash
   curl http://localhost:8788
   # Should respond (even if 404, proves server is up)
   ```

2. Check Socket.IO is initialized:
   - API server console should show:
     ```
     [API] Socket.IO initialized on /orders namespace
     ```
   - If not, check `VITE_ENABLE_SOCKETIO` env var (should NOT be 'false')

3. Check token exists:
   ```javascript
   console.log(!!localStorage.getItem('firebaseAuthToken'));
   ```

4. Check CORS:
   - Socket.IO server allows all origins in dev (*)
   - If you changed CORS settings, revert to default

---

### Google Auth Popup Blocked

**Symptom:** Clicking login does nothing

**Solutions:**
1. Check browser popup blocker
2. Allow popups for localhost
3. Try different browser (Chrome/Edge recommended)

---

### Token Invalid / Auth Fails

**Symptom:** Socket connects but immediately disconnects with auth error

**Solutions:**
1. Check token is from correct Firebase project:
   ```javascript
   const token = localStorage.getItem('firebaseAuthToken');
   const parts = token.split('.');
   const payload = JSON.parse(atob(parts[1]));
   console.log('Token project:', payload.aud); // Should match your project ID
   ```

2. Check server Firebase Admin SDK is initialized:
   - `server/utils/firebaseAdmin.ts` should export `verifyIdToken()`
   - Server console should NOT show Firebase errors

3. Token may have expired (1 hour lifetime):
   - Logout and login again to get fresh token

---

### Real-Time Updates Not Appearing

**Symptom:** Firestore update doesn't reflect in UI

**Solutions:**
1. Check Socket.IO connection is active:
   - DevTools → Network → WS → Status 101
   - Console: "Connected to /orders namespace"

2. Check Firestore listener is running:
   - Server console should show:
     ```
     [OrderTracking] Firestore listener active
     ```

3. Check order ID matches:
   - Frontend: `useOrderTracking('order-id-here')`
   - Backend: Room name should be `order:order-id-here`

4. Fallback to Firestore:
   - If Socket.IO fails, app should fall back to Firestore polling
   - Check `realtimeConnected` prop in hook result

---

## Success Criteria Checklist

✅ **Socket.IO:**
- [ ] Can connect to `/orders` namespace
- [ ] Shows green "Connected" status
- [ ] Socket ID appears
- [ ] Transport is `websocket` (or `polling` is OK)
- [ ] Auth token is verified successfully
- [ ] Can emit and receive test events
- [ ] Real-time order status updates work (< 100ms latency)

✅ **Google Auth:**
- [ ] Login popup opens without errors
- [ ] Can select Google account and authenticate
- [ ] User info displays (name, email, photo)
- [ ] JWT token appears in localStorage
- [ ] Token is valid (can be decoded)
- [ ] Logout clears token and user data

✅ **Integration:**
- [ ] Socket.IO accepts Firebase JWT token
- [ ] Can join order rooms with authenticated connection
- [ ] Tailor receives assignment notifications
- [ ] Real-time updates work end-to-end

---

## Performance Benchmarks

**Expected Performance:**

| Metric | Target | Good | Needs Improvement |
|--------|--------|------|-------------------|
| Connection Time | < 200ms | < 500ms | > 1s |
| Event Latency | < 50ms | < 100ms | > 200ms |
| Reconnection Time | < 1s | < 2s | > 5s |
| Auth Token Verification | < 100ms | < 200ms | > 500ms |

**How to Measure:**

```javascript
// Connection time
const start = performance.now();
socket.on('connect', () => {
  console.log('Connection took:', performance.now() - start, 'ms');
});

// Event latency
const testLatency = () => {
  const start = performance.now();
  socket.emit('test-echo', { timestamp: Date.now() }, (response) => {
    console.log('Round-trip latency:', performance.now() - start, 'ms');
  });
};
```

---

## Next Steps

After successful testing:

1. ✅ Integrate hooks into production pages:
   - Copy `useOrderTracking()` into order details page
   - Copy `useOrderAssignments()` into tailor dashboard

2. ✅ Connect REST endpoints to broadcast events:
   - When order status updates via API, call `io.broadcastOrderStatusChange()`
   - See: `SOCKETIO_INTEGRATION_GUIDE.md` Section 8

3. ✅ Add UI feedback:
   - Show connection status indicator
   - Display "Live" badge when realtime active
   - Toast notifications for new assignments

4. ⏳ Plan production deployment:
   - Redis Pub/Sub for multi-instance scaling
   - Sticky sessions if using load balancer
   - Monitoring/metrics for WebSocket connections

---

## Additional Resources

- **Implementation Summary:** `SOCKETIO_IMPLEMENTATION_SUMMARY.md`
- **Quick Reference:** `SOCKETIO_QUICK_REFERENCE.md`
- **Integration Guide:** `SOCKETIO_INTEGRATION_GUIDE.md`
- **Working Examples:** 
  - `SOCKETIO_EXAMPLE_ORDER_DETAILS.tsx`
  - `SOCKETIO_EXAMPLE_TAILOR_DASHBOARD.tsx`

---

**Questions or Issues?**

Check the server console and browser DevTools console for detailed error messages. Most issues are related to:
1. API server not running (check port 8788)
2. Missing Firebase token (login first)
3. Firebase project mismatch (check .env file)
4. CORS or network issues (check browser Network tab)
