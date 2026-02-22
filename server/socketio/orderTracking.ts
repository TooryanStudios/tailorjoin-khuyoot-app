/**
 * Socket.IO Real-Time Order Tracking Module
 * 
 * Handles real-time notifications for:
 * - New order assignments (tailors receive instantly)
 * - Order status changes (tailors & customers notified)
 * - Order updates (measurements, price negotiations)
 * 
 * Architecture:
 * - Namespace: /orders
 * - Rooms: order:${orderId}, tailor:${tailorId}, customer:${userId}
 * - Auth: Firebase JWT via socket.handshake.auth.token
 * - Persistence: Firestore (Socket.IO is ephemeral push layer)
 */

import { Server, Socket } from 'socket.io';
import { getFirestore, verifyFirebaseIdToken } from '../tryon/firebaseAdmin';
import type { Firestore, Timestamp } from 'firebase-admin/firestore';

interface SocketData {
  userId: string;
  email?: string;
  role?: string;
}

interface OrderStatusChangePayload {
  orderId: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  changedAt: string;
  reason?: string;
}

interface OrderAssignmentPayload {
  orderId: string;
  orderNumber?: string;
  productName: string;
  productImage: string;
  customerName?: string;
  customerPhone?: string;
  tailorId: string;
  assignedAt: string;
}

interface OrderUpdatePayload {
  orderId: string;
  field: string;
  oldValue: any;
  newValue: any;
  updatedAt: string;
}

interface JoinRoomPayload {
  orderId: string;
}

interface LeaveRoomPayload {
  orderId: string;
}

/**
 * Setup Socket.IO order tracking namespace
 * Should be called after http.createServer() and before server.listen()
 */
export function setupOrderTracking(io: Server) {
  const db = getFirestore();
  const namespace = io.of('/orders');

  // ========== AUTH MIDDLEWARE ==========
  /**
   * Verify JWT token from handshake auth object
   * Sets socket.data.userId and socket.data.email for all handlers
   */
  namespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token as string | undefined;

      if (!token) {
        console.warn('[Socket.IO] Connection rejected: no token provided');
        return next(new Error('Unauthorized: missing token'));
      }

      // Verify Firebase ID token
      const decoded = await verifyFirebaseIdToken(token);
      if (!decoded?.uid) {
        console.warn('[Socket.IO] Connection rejected: token verification failed');
        return next(new Error('Unauthorized: invalid token'));
      }

      // Attach user data to socket
      socket.data.userId = decoded.uid;
      socket.data.email = (decoded as any).email || undefined;

      console.log(`[Socket.IO] User ${decoded.uid} authenticated (${socket.id})`);
      next();
    } catch (error: any) {
      console.error('[Socket.IO] Auth middleware error:', error.message);
      next(new Error(`Unauthorized: ${error.message}`));
    }
  });

  // ========== CONNECTION ==========
  namespace.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`[Socket.IO] User ${userId} connected (socket: ${socket.id})`);

    // Auto-join user's personal room for individual notifications
    socket.join(`user:${userId}`);

    // ========== EVENT HANDLERS ==========

    /**
     * Client joins an order room to receive real-time updates
     * Typically emitted when customer/tailor views order details
     */
    socket.on('order:join', async (payload: JoinRoomPayload) => {
      try {
        const { orderId } = payload;

        if (!orderId || typeof orderId !== 'string') {
          console.warn('[Socket.IO] Invalid orderId in order:join');
          return;
        }

        // Optional: Verify user has permission to access this order
        // (in production, check Firestore that userId=customerId or tailorId)
        try {
          const orderDoc = await db.collection('orders').doc(orderId).get();
          if (!orderDoc.exists) {
            console.warn(`[Socket.IO] Order ${orderId} not found`);
            socket.emit('error', { message: 'Order not found' });
            return;
          }

          const orderData = orderDoc.data() as any;
          const isCustomer = orderData.userId === userId;
          const isTailor = orderData.tailorId === userId;

          if (!isCustomer && !isTailor) {
            console.warn(
              `[Socket.IO] User ${userId} not authorized for order ${orderId}`
            );
            socket.emit('error', { message: 'Not authorized to access this order' });
            return;
          }
        } catch (err) {
          console.error('[Socket.IO] Permission check failed:', err);
          socket.emit('error', { message: 'Permission check failed' });
          return;
        }

        // Join room
        socket.join(`order:${orderId}`);
        console.log(
          `[Socket.IO] User ${userId} joined order:${orderId} (socket: ${socket.id})`
        );

        // Send current order snapshot to the joining client
        try {
          const orderDoc = await db.collection('orders').doc(orderId).get();
          if (orderDoc.exists) {
            socket.emit('order:current', {
              id: orderId,
              ...orderDoc.data(),
            });
          }
        } catch (err) {
          console.error('[Socket.IO] Failed to fetch order snapshot:', err);
        }
      } catch (error: any) {
        console.error('[Socket.IO] order:join handler error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    /**
     * Client leaves an order room
     * Clean up room membership
     */
    socket.on('order:leave', (payload: LeaveRoomPayload) => {
      const { orderId } = payload;
      if (orderId) {
        socket.leave(`order:${orderId}`);
        console.log(`[Socket.IO] User ${userId} left order:${orderId}`);
      }
    });

    /**
     * Client acknowledges they've seen a notification
     * Useful for marking notifications as read
     */
    socket.on('notification:read', (payload: { notificationId?: string }) => {
      console.log(`[Socket.IO] User ${userId} read notification:`, payload);
      // Optional: Store read status in Firestore notifications collection
    });

    // ========== DISCONNECT ==========
    socket.on('disconnect', () => {
      console.log(`[Socket.IO] User ${userId} disconnected (socket: ${socket.id})`);
    });
  });

  // ========== FIRESTORE LISTENERS ==========
  /**
   * Listen to order status changes and broadcast to connected clients
   * This monitors the 'orders' collection for real-time updates
   */
  async function setupOrderListener() {
    try {
      // Listen for changes to all orders
      // In production, you might want to listen per-order or use a more efficient query
      const ordersQuery = db.collection('orders')
        .orderBy('orderDate', 'desc')
        .limit(1000); // Limit to prevent memory issues

      const unsubscribe = ordersQuery.onSnapshot(
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const orderId = change.doc.id;
            const orderData = change.doc.data() as any;

            if (change.type === 'added') {
              console.log(`[Socket.IO] New order detected: ${orderId}`);
              // Broadcast new order to relevant tailors
              if (orderData.tailorId) {
                namespace.to(`tailor:${orderData.tailorId}`).emit('order:new', {
                  orderId,
                  ...orderData,
                });
              }
            } else if (change.type === 'modified') {
              console.log(`[Socket.IO] Order modified: ${orderId}`);
              // Broadcast to everyone in the order room
              namespace.to(`order:${orderId}`).emit('order:updated', {
                orderId,
                ...orderData,
              });

              // If status changed, send special event
              const prevStatus = change.doc.data().status;
              const newStatus = orderData.status;
              if (prevStatus !== newStatus) {
                namespace.to(`order:${orderId}`).emit('order:status-changed', {
                  orderId,
                  oldStatus: prevStatus,
                  newStatus: newStatus,
                  timestamp: new Date().toISOString(),
                });
              }
            }
          });
        },
        (error) => {
          console.error('[Socket.IO] Order listener error:', error);
          // Retry after 5 seconds
          setTimeout(setupOrderListener, 5000);
        }
      );

      console.log('[Socket.IO] Order listener initialized');

      // Return unsubscribe function for graceful shutdown
      return unsubscribe;
    } catch (error) {
      console.error('[Socket.IO] Failed to setup order listener:', error);
      setTimeout(setupOrderListener, 5000);
    }
  }

  // Start listening for order changes
  setupOrderListener();

  // ========== PUBLIC API (called from REST endpoints) ==========
  /**
   * Broadcast a status change to all clients in an order room
   * Called from REST API after updating Firestore
   * 
   * Usage: orderTrackerIO.broadcastOrderStatusChange(orderId, oldStatus, newStatus)
   */
  namespace.broadcastOrderStatusChange = (
    orderId: string,
    oldStatus: string,
    newStatus: string,
    userId: string,
    reason?: string
  ) => {
    namespace.to(`order:${orderId}`).emit('order:status-changed', {
      orderId,
      oldStatus,
      newStatus,
      changedBy: userId,
      changedAt: new Date().toISOString(),
      reason,
    } as OrderStatusChangePayload);
    console.log(
      `[Socket.IO] Broadcast status change: ${orderId} (${oldStatus} → ${newStatus})`
    );
  };

  /**
   * Notify tailor of new order assignment
   * Called when order is assigned to a tailor
   */
  namespace.broadcastOrderAssignment = (
    orderId: string,
    orderNumber: string | undefined,
    tailorId: string,
    orderData: any
  ) => {
    namespace.to(`tailor:${tailorId}`).emit('order:assigned', {
      orderId,
      orderNumber,
      productName: orderData.productName,
      productImage: orderData.productImage,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      tailorId,
      assignedAt: new Date().toISOString(),
    } as OrderAssignmentPayload);
    console.log(`[Socket.IO] Broadcast assignment: ${orderId} → tailor ${tailorId}`);
  };

  /**
   * Send a generic notification to a user
   * Called for various order-related events
   */
  namespace.broadcastNotification = (
    userId: string,
    type: string,
    data: any
  ) => {
    namespace.to(`user:${userId}`).emit('notification', {
      type,
      data,
      timestamp: new Date().toISOString(),
    });
    console.log(`[Socket.IO] Notification → user ${userId} (${type})`);
  };

  /**
   * Broadcast to all users in an order room
   * Called for order updates that affect all participants
   */
  namespace.broadcastOrderUpdate = (
    orderId: string,
    field: string,
    oldValue: any,
    newValue: any,
    userId: string
  ) => {
    namespace.to(`order:${orderId}`).emit('order:field-updated', {
      orderId,
      field,
      oldValue,
      newValue,
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    } as OrderUpdatePayload);
    console.log(
      `[Socket.IO] Field update: ${orderId}.${field} = ${newValue}`
    );
  };

  // Return namespace with broadcast methods attached
  return namespace;
}

/**
 * Type declaration for extended Namespace with broadcast methods
 * Use this type hint in other files when importing the namespace
 */
export type OrderTrackingNamespace = ReturnType<typeof setupOrderTracking>;
