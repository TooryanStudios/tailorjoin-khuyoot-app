# 🚀 Socket.IO - Quick Start (5 Minutes)

## ✅ Installation Complete

All files created, dependencies installed, build verified.

---

## Step 1: Start Dev Server (2 min)

```bash
npm run dev:all
```

You should see two servers start:
- 🔵 API Server: `http://localhost:8788`
- 🟢 Web Server: `http://localhost:3000`

---

## Step 2: Verify Connection (1 min)

1. Open browser `http://localhost:3000`
2. Open DevTools → Network tab
3. Filter for "WS" (WebSocket)
4. Look for: `localhost:8788/socket.io/...`
5. Status should be: `101 Switching Protocols` ✅

---

## Step 3: Use in Your Component (1 min)

Copy this into your order details page:

```tsx
import { useOrderTracking } from '@/hooks/useOrderTracking';

export function OrderPage({ orderId }: { orderId: string }) {
  const { order, status, realtimeConnected } = useOrderTracking(orderId);

  if (!order) return <div>Loading...</div>;

  return (
    <div>
      <h1>{order.productName}</h1>
      <p>Status: {status}</p>
      <p>{realtimeConnected ? '🟢 Live Updates' : '⭕ Offline'}</p>
    </div>
  );
}
```

---

## Step 4: Test Real-Time (1 min)

1. Open your order page
2. Go to Firebase Console → orders collection
3. Click an order → Edit status field
4. Change `status` from "pending" to "measuring"
5. **Watch:** Status updates in browser instantly! ✨

---

## 🎯 What You Can Do Now

### For Customers
```tsx
// Real-time order status tracking
const { order, status } = useOrderTracking(orderId);
// Shows: pending → measuring → cutting → sewing → ready → delivered
```

### For Tailors
```tsx
// Real-time order assignments
const { assignments, unreadCount } = useOrderAssignments();
// Shows: New orders appear instantly with sound alert
```

### For Developers
```tsx
// Low-level Socket.IO access
const [socket, { connected }] = useOrderSocket();
// For custom real-time events
```

---

## 📚 Documentation

| File | What It Is | Read Time |
|------|-----------|-----------|
| **SOCKETIO_QUICK_REFERENCE.md** | Fast lookup guide | 5 min |
| **SOCKETIO_INTEGRATION_GUIDE.md** | Complete reference | 20 min |
| **SOCKETIO_EXAMPLE_ORDER_DETAILS.tsx** | Full working example | Copy-paste |
| **SOCKETIO_EXAMPLE_TAILOR_DASHBOARD.tsx** | Full working example | Copy-paste |

---

## 🔧 Common Tasks

### Add Status Change Notification
```tsx
const { status } = useOrderTracking(orderId, {
  onStatusChange: (oldStatus, newStatus) => {
    console.log(`Order: ${oldStatus} → ${newStatus}`);
    // Show toast notification
  }
});
```

### Add Sound Alert for Tailors
```tsx
const { assignments } = useOrderAssignments({
  soundAlert: true,  // Beep when new order assigned!
});
```

### Disable Socket.IO (Use Firestore)
```bash
VITE_ENABLE_SOCKETIO=false npm run dev:all
```

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| WebSocket shows 101? | ✅ Working! Connection is live |
| Still seeing spinner? | Check localStorage has auth token |
| Sound not playing? | Check browser speaker, try different browser |
| No updates from Firestore? | Check field name is exactly "status" (lowercase) |

---

## 📁 Files Created

```
server/socketio/
└── orderTracking.ts (370 lines)

src/hooks/
├── useOrderSocket.ts (150 lines)
├── useOrderTracking.ts (220 lines)
└── useOrderAssignments.ts (200 lines)

Docs/
├── SOCKETIO_QUICK_REFERENCE.md
├── SOCKETIO_INTEGRATION_GUIDE.md
├── SOCKETIO_EXAMPLE_ORDER_DETAILS.tsx
├── SOCKETIO_EXAMPLE_TAILOR_DASHBOARD.tsx
└── SOCKETIO_READY.md
```

---

## ✨ Next Steps

### This Week
- [ ] Read SOCKETIO_QUICK_REFERENCE.md (5 min)
- [ ] Add `useOrderTracking` to order details page
- [ ] Test with Firestore Console update
- [ ] Verify WebSocket connection in DevTools

### Next Week
- [ ] Add `useOrderAssignments` to tailor dashboard
- [ ] Connect REST endpoints to broadcast events
- [ ] Test end-to-end order flow

### Next Month
- [ ] Add persistent notifications
- [ ] Implement Redis for scaling
- [ ] Add driver tracking

---

## 🎓 Examples

### Example 1: Order Details with Real-Time Updates
See: `SOCKETIO_EXAMPLE_ORDER_DETAILS.tsx`
```bash
cp SOCKETIO_EXAMPLE_ORDER_DETAILS.tsx src/pages/OrderDetails.tsx
```

### Example 2: Tailor Dashboard with Assignments
See: `SOCKETIO_EXAMPLE_TAILOR_DASHBOARD.tsx`
```bash
cp SOCKETIO_EXAMPLE_TAILOR_DASHBOARD.tsx src/pages/TailorDashboard.tsx
```

---

## 🔍 Debug Tips

### See All Socket.IO Messages
```tsx
// In browser console
const ns = io('/orders');  // If global io object available
ns.onAny((event, ...args) => {
  console.log(`[Socket.IO] ${event}:`, args);
});
```

### Check Auth Token
```tsx
// In browser console
const token = localStorage.getItem('firebaseAuthToken');
console.log('Token:', token ? 'Present ✅' : 'Missing ❌');
```

### Monitor Connection
```tsx
// In browser console
const socket = io('/orders', { 
  auth: { token: localStorage.getItem('firebaseAuthToken') } 
});
socket.on('connect', () => console.log('✅ Connected'));
socket.on('disconnect', () => console.log('❌ Disconnected'));
```

---

## 💡 Pro Tips

1. **Don't duplicate connections** — All hooks share one connection
2. **Firestore still works** — Falls back automatically if WebSocket unavailable
3. **Token? Required** — Must be logged in for Socket.IO
4. **Mobile? Works great** — WebSocket + polling both supported
5. **Scale later** — Add Redis when you hit 1000+ concurrent users

---

## ✅ Verify Installation

Run this quick check:
```bash
# 1. Check files exist
ls server/socketio/orderTracking.ts
ls src/hooks/useOrder*.ts

# 2. Check dependencies installed  
npm ls socket.io socket.io-client

# 3. Start dev server
npm run dev:all

# 4. Check connection in DevTools Network tab
# Should see: localhost:8788/socket.io with status 101
```

---

## 🎉 You're Ready!

**Socket.IO is now live in your Khuyoot project!**

Real-time order updates + tailor notifications = 🚀

---

**Questions?** Check the documentation files or search for `[Socket.IO]` in browser console.

**Enjoy! 🎊**
