/**
 * useOrderTracking - Hook for real-time order status tracking
 * 
 * Automatically joins an order room and listens for status changes
 * Falls back to Firestore listener if Socket.IO unavailable
 */

import { useEffect, useState } from 'react';
import { getOrderSocket } from './useOrderSocket';
import { firebaseService } from '../services/firebase';
import type { Order, OrderStatus } from '../../types';

interface OrderTrackingState {
  order: Order | null;
  status: OrderStatus | null;
  updatedAt: string | null;
  loading: boolean;
  error: string | null;
  realtimeConnected: boolean;
}

interface UseOrderTrackingOptions {
  autoJoin?: boolean;
  onStatusChange?: (oldStatus: OrderStatus, newStatus: OrderStatus) => void;
  fallbackToFirestore?: boolean;
}

/**
 * Hook: Track real-time order status updates
 * 
 * @param orderId - The order ID to track
 * @param options - Configuration options
 * @returns Current order state with real-time updates
 * 
 * @example
 * ```tsx
 * const { order, status, loading } = useOrderTracking(orderId);
 * return <div>Order status: {status}</div>;
 * ```
 */
export function useOrderTracking(
  orderId: string | undefined,
  options: UseOrderTrackingOptions = {}
) {
  const {
    autoJoin = true,
    onStatusChange,
    fallbackToFirestore = true,
  } = options;

  const socket = getOrderSocket();
  const [state, setState] = useState<OrderTrackingState>({
    order: null,
    status: null,
    updatedAt: null,
    loading: !orderId,
    error: null,
    realtimeConnected: false,
  });

  // Track previous status to detect changes
  const [previousStatus, setPreviousStatus] = useState<OrderStatus | null>(null);

  useEffect(() => {
    if (!orderId) {
      setState((prev) => ({
        ...prev,
        loading: false,
        order: null,
        status: null,
      }));
      return;
    }

    let unsubscribeFirestore: (() => void) | null = null;
    let socketConnected = false;

    // ===== SOCKET.IO SETUP =====
    if (socket && autoJoin) {
      const roomName = `order:${orderId}`;

      const handleConnect = () => {
        console.log(`[useOrderTracking] Socket connected, joining ${roomName}`);
        socket.emit('order:join', { orderId });
        socketConnected = true;
        setState((prev) => ({
          ...prev,
          realtimeConnected: true,
        }));
      };

      const handleDisconnect = () => {
        console.log(`[useOrderTracking] Socket disconnected`);
        socketConnected = false;
        setState((prev) => ({
          ...prev,
          realtimeConnected: false,
        }));
      };

      // Listen for current order snapshot
      const handleOrderCurrent = (orderData: any) => {
        console.log(`[useOrderTracking] Received order snapshot for ${orderId}`);
        setState((prev) => ({
          ...prev,
          order: orderData,
          status: orderData.status,
          updatedAt: new Date().toISOString(),
          loading: false,
          error: null,
        }));
        setPreviousStatus(orderData.status);
      };

      // Listen for order status changes
      const handleStatusChanged = (data: any) => {
        console.log(
          `[useOrderTracking] Status changed: ${data.oldStatus} → ${data.newStatus}`
        );
        setState((prev) => ({
          ...prev,
          status: data.newStatus,
          updatedAt: data.timestamp || new Date().toISOString(),
          error: null,
        }));

        if (onStatusChange && previousStatus && previousStatus !== data.newStatus) {
          onStatusChange(previousStatus, data.newStatus);
        }
        setPreviousStatus(data.newStatus);
      };

      // Listen for general order updates
      const handleOrderUpdated = (orderData: any) => {
        console.log(`[useOrderTracking] Order updated for ${orderId}`);
        setState((prev) => ({
          ...prev,
          order: { ...prev.order, ...orderData },
          status: orderData.status || prev.status,
          updatedAt: new Date().toISOString(),
          error: null,
        }));
      };

      // Listen for errors
      const handleError = (error: any) => {
        console.warn(`[useOrderTracking] Socket error:`, error);
        setState((prev) => ({
          ...prev,
          error: error.message || 'Socket error',
        }));
      };

      // Attach listeners
      if (socket.connected) {
        handleConnect();
      } else {
        socket.once('connect', handleConnect);
      }

      socket.on('order:current', handleOrderCurrent);
      socket.on('order:status-changed', handleStatusChanged);
      socket.on('order:updated', handleOrderUpdated);
      socket.on('disconnect', handleDisconnect);
      socket.on('error', handleError);

      return () => {
        // Leave room and clean up
        socket.emit('order:leave', { orderId });
        socket.off('order:current', handleOrderCurrent);
        socket.off('order:status-changed', handleStatusChanged);
        socket.off('order:updated', handleOrderUpdated);
        socket.off('disconnect', handleDisconnect);
        socket.off('error', handleError);

        if (unsubscribeFirestore) {
          unsubscribeFirestore();
        }
      };
    }

    // ===== FIRESTORE FALLBACK =====
    // If Socket.IO not available or disabled, use Firestore listener
    if (fallbackToFirestore && !socketConnected) {
      console.log(`[useOrderTracking] Falling back to Firestore for ${orderId}`);

      try {
        const db = (window as any).__firebaseAdmin?.app?.firestore?.();
        if (db) {
          unsubscribeFirestore = firebaseService
            .listenToOrder(orderId, (order) => {
              if (order) {
                setState((prev) => ({
                  ...prev,
                  order,
                  status: order.status,
                  updatedAt: new Date().toISOString(),
                  loading: false,
                  error: null,
                }));
                setPreviousStatus(order.status);
              }
            })
            .catch((error) => {
              console.error(`[useOrderTracking] Firestore error:`, error);
              setState((prev) => ({
                ...prev,
                loading: false,
                error: error.message || 'Failed to fetch order',
              }));
            });
        }
      } catch (error) {
        console.warn(`[useOrderTracking] Firestore fallback unavailable`, error);
        // Fetch once as fallback
        setState((prev) => ({ ...prev, loading: true }));
        firebaseService
          .getOrder(orderId)
          .then((order) => {
            if (order) {
              setState((prev) => ({
                ...prev,
                order,
                status: order.status,
                loading: false,
              }));
              setPreviousStatus(order.status);
            }
          })
          .catch((error) => {
            setState((prev) => ({
              ...prev,
              loading: false,
              error: error.message || 'Failed to fetch order',
            }));
          });
      }

      return () => {
        if (unsubscribeFirestore) {
          unsubscribeFirestore();
        }
      };
    }

    return () => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, [orderId, socket, autoJoin, fallbackToFirestore, onStatusChange, previousStatus]);

  return state;
}

/**
 * Hook: Lightweight status-only tracking
 * More efficient when you only need the status, not the full order
 */
export function useOrderStatus(orderId: string | undefined) {
  const { status, updatedAt, realtimeConnected } = useOrderTracking(orderId, {
    fallbackToFirestore: true,
  });
  return { status, updatedAt, realtimeConnected };
}
