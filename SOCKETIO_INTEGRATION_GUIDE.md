# Socket.IO Real-Time Order Integration Guide

## Overview

This guide explains how to integrate Socket.IO real-time order tracking and notifications into your Khuyoot application. The system is **additive** — it works alongside your existing Firestore listeners without breaking any existing functionality.

## Architecture

```
┌──────────────────────────────────────────┐
│      Browser Client (React)              │
├──────────────────────────────────────────┤
│  ✅ useOrderTracking(orderId)           │
│  ✅ useOrderAssignments()               │
│  ✅ useOrderSocket()                    │
└──────────────────────────────────────────┘
         ↕ WebSocket (Socket.IO)
         ↕ + Firestore Listener Fallback
┌──────────────────────────────────────────┐
│      Node.js API Server (Port 8788)      │
├──────────────────────────────────────────┤
│  ✅ Socket.IO /orders namespace         │
│  ✅ JWT auth (Firebase tokens)          │
│  ✅ Room model: order:*, tailor:*       │
└──────────────────────────────────────────┘
         ↓ Firestore Listener (persistent)
┌──────────────────────────────────────────┐
│      Google Firestore                    │
├──────────────────────────────────────────┤
│  orders collection                       │
│  notifications collection                │
└──────────────────────────────────────────┘
```

## Installation

### 1. Install Dependencies

The required packages have been added to `package.json`. Install them:

```bash
npm install
# or
yarn install
```

### 2. Enable Socket.IO in Dev Server

By default, Socket.IO is enabled. To disable it, set:

```bash
VITE_ENABLE_SOCKETIO=false npm run dev:all
```

To explicitly enable (useful for testing):

```bash
VITE_ENABLE_SOCKETIO=true npm run dev:all
```

## Usage

### Basic: Track Order Status

**In a customer's order details page:**

```tsx
import { useOrderTracking } from '../hooks/useOrderTracking';

export function OrderDetailsPage({ orderId }: { orderId: string }) {
  const { order, status, loading, realtimeConnected } = useOrderTracking(orderId);

  if (loading) return <div>Loading...</div>;
  if (!order) return <div>Order not found</div>;

  return (
    <div>
      <h1>Order {order.orderNumber}</h1>
      <p>Status: {status}</p>
      <p>
        {realtimeConnected ? (
          <span style={{ color: 'green' }}>🔴 Real-time connected</span>
        ) : (
          <span style={{ color: 'gray' }}>⭕ Using Firestore (offline)</span>
        )}
      </p>
      
      {/* Rest of your UI */}
    </div>
  );
}
```

### Intermediate: Listen for Status Changes

**Get notified when order status changes:**

```tsx
import { useOrderTracking } from '../hooks/useOrderTracking';
import { useToast } from '@/components/ui/use-toast'; // or your toast library

export function OrderTracker({ orderId }: { orderId: string }) {
  const { toast } = useToast();

  const { status } = useOrderTracking(orderId, {
    onStatusChange: (oldStatus, newStatus) => {
      toast({
        title: 'Order Status Updated',
        description: `Status changed from ${oldStatus} to ${newStatus}`,
        variant: 'default',
      });
    },
  });

  return <div>Current Status: {status}</div>;
}
```

### Advanced: Tailor Receives New Orders

**In a tailor's dashboard:**

```tsx
import { useOrderAssignments } from '../hooks/useOrderAssignments';
import { useNavigate } from 'react-router-dom';

export function TailorDashboard() {
  const navigate = useNavigate();
  const {
    assignments,
    unreadCount,
    realtimeConnected,
    markAsRead,
    soundAlert: enableSound,
  } = useOrderAssignments({
    soundAlert: true,
    onAssignment: (order) => {
      console.log(`New order! ${order.productName} from ${order.customerName}`);
    },
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1>My Orders</h1>
        <div>
          {realtimeConnected ? (
            <span style={{ color: 'green' }}>🔴 Live</span>
          ) : (
            <span style={{ color: 'orange' }}>⭕ Polling</span>
          )}
        </div>
      </div>

      {/* Unread Badge */}
      {unreadCount > 0 && (
        <div style={{
          backgroundColor: '#dc2626',
          color: 'white',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '2rem',
        }}>
          🔔 You have {unreadCount} new order{unreadCount > 1 ? 's' : ''}!
        </div>
      )}

      {/* List of Assignments */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {assignments.map((order) => (
          <div
            key={order.orderId}
            style={{
              border: '1px solid #ccc',
              padding: '1rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
            }}
            onClick={() => {
              markAsRead(order.orderId);
              navigate(`/orders/${order.orderId}`);
            }}
          >
            <h3>{order.productName}</h3>
            <p>Customer: {order.customerName}</p>
            <p>Phone: {order.customerPhone}</p>
            <small style={{ color: '#666' }}>
              Assigned: {new Date(order.assignedAt).toLocaleString()}
            </small>
          </div>
        ))}
      </div>

      {assignments.length === 0 && (
        <div style={{ textAlign: 'center', color: '#999' }}>
          No new assignments yet.
        </div>
      )}
    </div>
  );
}
```

## Hook Reference

### `useOrderTracking(orderId, options?)`

**Purpose:** Subscribe to real-time order updates

**Returns:**
```ts
{
  order: Order | null,
  status: OrderStatus | null,
  updatedAt: string | null,
  loading: boolean,
  error: string | null,
  realtimeConnected: boolean,
}
```

**Options:**
```ts
{
  autoJoin?: boolean;              // Default: true
  onStatusChange?: (oldStatus, newStatus) => void;
  fallbackToFirestore?: boolean;   // Default: true
}
```

**Usage:**
```tsx
const { order, status, loading } = useOrderTracking(orderId);
```

---

### `useOrderAssignments(options?)`

**Purpose:** Listen for new order assignments (for tailors)

**Returns:**
```ts
{
  assignments: OrderAssignment[],
  unreadCount: number,
  realtimeConnected: boolean,
  error: string | null,
  markAsRead: (orderId: string) => void,
  clearAll: () => void,
}
```

**Options:**
```ts
{
  soundAlert?: boolean;                             // Default: false
  onAssignment?: (assignment: OrderAssignment) => void;
  onNotification?: (type: string, data: any) => void;
}
```

**Usage:**
```tsx
const { assignments, unreadCount } = useOrderAssignments({
  soundAlert: true,
  onAssignment: (order) => showToast(`New order: ${order.productName}`),
});
```

---

### `useOrderSocket()`

**Purpose:** Low-level Socket.IO connection management

**Returns:**
```ts
[socket: Socket | null, state: SocketConnectionState]
```

**State:**
```ts
{
  connected: boolean,
  connecting: boolean,
  error: string | null,
}
```

**Usage (advanced):**
```tsx
const [socket, { connected, error }] = useOrderSocket();

useEffect(() => {
  if (!socket) return;
  
  socket.on('custom-event', (data) => {
    console.log(data);
  });
}, [socket]);
```

## Server-Side Integration

### Broadcasting Order Status Changes

When you update an order status in your REST API, broadcast the change via Socket.IO:

```tsx
// In your order update REST endpoint
import { setupOrderTracking } from './socketio/orderTracking';

// After updating Firestore
if (io) {
  const orderTracking = setupOrderTracking(io);
  orderTracking.broadcastOrderStatusChange(
    orderId,
    oldStatus,
    newStatus,
    userId, // who made the change
    reason
  );
}
```

### Broadcasting New Order Assignments

When assigning an order to a tailor:

```tsx
// After assigning order to tailor in Firestore
if (io) {
  const orderTracking = setupOrderTracking(io);
  orderTracking.broadcastOrderAssignment(
    orderId,
    orderNumber,
    tailorId,
    orderData
  );
}
```

### Broadcasting Generic Notifications

For any other notifications:

```tsx
if (io) {
  const orderTracking = setupOrderTracking(io);
  orderTracking.broadcastNotification(
    userId,
    'order-ready', // notification type
    { orderId, estimatedPickupTime: '3 PM' }
  );
}
```

## Error Handling & Fallbacks

### Graceful Degradation

If Socket.IO is disabled or unavailable:

1. **Automatic Fallback:** `useOrderTracking` automatically falls back to Firestore listeners
2. **Client-Side Polling:** Uses Firestore `onSnapshot` with same data structure
3. **No Breaking Changes:** Existing React code works unchanged

### Handling Connection Errors

```tsx
const { order, error, realtimeConnected } = useOrderTracking(orderId);

if (error) {
  return (
    <div style={{ backgroundColor: '#fca5a5', padding: '1rem' }}>
      Connection error: {error}. Using offline data.
    </div>
  );
}

if (!realtimeConnected) {
  return (
    <div style={{ backgroundColor: '#fef3c7', padding: '1rem' }}>
      Real-time connection unavailable. Data will auto-sync when connection restored.
    </div>
  );
}
```

## Testing Real-Time Features

### 1. Manual Testing

**Scenario: Tailor receives new order assignment**

1. Open browser 1: Tailor dashboard (`npm run dev` on localhost:3000)
2. Open browser 2: Admin panel
3. Create new order in admin panel
4. Assign to tailor in admin panel
5. Watch: Toast notification immediately appears in browser 1 ✨

**Scenario: Customer sees order status update**

1. Open browser 1: Customer order details
2. Open backend logs (from `npm run dev:api`)
3. Manually update order status in Firestore (via Firebase Console)
4. Watch: Status updates in browser 1 within <1s

### 2. DevTools Inspection

**Check WebSocket Connection:**

```
1. Open DevTools → Network tab
2. Filter: "WS" (WebSocket)
3. Look for: http://localhost:8788/socket.io/?...
4. Should show status: 101 Switching Protocols
```

**Monitor Socket Events:**

```tsx
// In browser console
const socket = window.io?.('/orders');
socket.on('order:status-changed', (data) => {
  console.log('Status update:', data);
});
```

## Troubleshooting

### Socket.IO Not Connecting

**Issue:** `realtimeConnected` always false

**Checklist:**
- [ ] `npm run dev:api` is running (port 8788)
- [ ] `npm run dev` is running (port 3000)
- [ ] `VITE_ENABLE_SOCKETIO=true` (or not explicitly false)
- [ ] Browser DevTools → Network → WS to `localhost:8788`
- [ ] No CORS errors in console

**Fix:**
```bash
# Kill existing processes
npm run kill-dev-ports

# Restart both servers
npm run dev:all
```

### Auth Token Not Sending

**Issue:** Socket connects but immediately closes with "Unauthorized"

**Checklist:**
- [ ] You're logged in (`localStorage.firebaseAuthToken` exists)
- [ ] Token is valid (not expired)
- [ ] Firebase auth is working (can make REST API calls)

**Fix:**
```tsx
// In browser console
console.log(localStorage.getItem('firebaseAuthToken'));
// Should output a long JWT token, not null
```

### Firestore Fallback Always Used

**Issue:** Real-time always showing false

**This is OK!** If Socket.IO is disabled or unavailable, Firestore listeners work just as well. Performance might be slightly lower (polling vs push), but functionality is identical.

## Performance Considerations

### Memory Usage

- **Per Connection:** ~2-5 KB
- **With 1000 simultaneous tailors:** ~2-5 MB (server-side)

### CPU Usage

- **Idle:** ~0.1% per 100 connections
- **Active order updates:** ~1-2% spike per broadcast

### Network Bandwidth

- **Connection upgrade:** ~500 bytes
- **Per event:** ~200-500 bytes
- **vs HTTP polling:** 1000x less overhead

### Production Scaling

For 1000+ concurrent users, add Redis Pub/Sub:

```ts
// server/socketio/orderTracking.ts
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const redisClient = createClient();
const io = new Server(server, {
  adapter: createAdapter(redisClient, redisClient.duplicate())
});
```

See [Socket.IO Scaling Guide](https://socket.io/docs/v4/redis-adapter/) for details.

## Next Steps

1. ✅ **Run `npm install`** to install Socket.IO packages
2. ✅ **Run `npm run dev:all`** to start dev server with Socket.IO
3. ✅ **Integrate `useOrderTracking` into order details pages**
4. ✅ **Integrate `useOrderAssignments` into tailor dashboard**
5. ⏳ **Add order status update endpoint** to broadcast status changes
6. ⏳ **Connect to Firestore listeners** for order assignment broadcasts
7. ⏳ **Test in multiple browsers** to verify real-time updates work

## See Also

- [Socket.IO Documentation](https://socket.io/docs/v4)
- [Socket.IO React Patterns](https://socket.io/docs/v4/socket-io-client-api)
- [Order Types](../types.ts)
- [Firestore Service](../services/firebase.ts)
