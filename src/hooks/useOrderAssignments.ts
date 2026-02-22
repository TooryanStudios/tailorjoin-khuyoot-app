/**
 * useOrderAssignments - Hook for tailors to receive new order assignments
 * 
 * Watches a tailor's personal room for new order notifications
 * Triggers callbacks on assignment, displays badges, plays notifications
 */

import { useEffect, useState, useCallback } from 'react';
import { getOrderSocket } from './useOrderSocket';
import { useAuth } from '../context/AppContext';

interface OrderAssignment {
  orderId: string;
  orderNumber?: string;
  productName: string;
  productImage: string;
  customerName?: string;
  customerPhone?: string;
  assignedAt: string;
}

interface UseOrderAssignmentsOptions {
  soundAlert?: boolean;
  onAssignment?: (assignment: OrderAssignment) => void;
  onNotification?: (type: string, data: any) => void;
}

/**
 * Hook: Listen for new order assignments assigned to current tailor
 * 
 * @param options - Configuration options
 * @returns Object with recent assignments and connection status
 * 
 * @example
 * ```tsx
 * const { assignments, count, realtimeConnected } = useOrderAssignments({
 *   soundAlert: true,
 *   onAssignment: (order) => showNotificationToast(order.productName)
 * });
 * 
 * return (
 *   <div>
 *     <Badge count={count} />
 *     {assignments.map(a => <OrderCard key={a.orderId} order={a} />)}
 *   </div>
 * );
 * ```
 */
export function useOrderAssignments(
  options: UseOrderAssignmentsOptions = {}
) {
  const { soundAlert = false, onAssignment, onNotification } = options;
  const { user } = useAuth();
  const socket = getOrderSocket();

  const [state, setState] = useState({
    assignments: [] as OrderAssignment[],
    unreadCount: 0,
    realtimeConnected: false,
    error: null as string | null,
  });

  const playNotificationSound = useCallback(() => {
    if (!soundAlert) return;
    
    // Use Web Audio API or fallback to simple beep
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Hz
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('[useOrderAssignments] Could not play sound:', error);
    }
  }, [soundAlert]);

  const markAsRead = useCallback((orderId: string) => {
    // Remove from unread list
    setState((prev) => ({
      ...prev,
      assignments: prev.assignments.filter((a) => a.orderId !== orderId),
      unreadCount: Math.max(0, prev.unreadCount - 1),
    }));

    // Notify server
    if (socket) {
      socket.emit('notification:read', { orderId });
    }
  }, [socket]);

  const clearAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      assignments: [],
      unreadCount: 0,
    }));
  }, []);

  useEffect(() => {
    // Need user ID to set up listeners
    if (!user?.uid) {
      setState((prev) => ({
        ...prev,
        error: 'User not authenticated',
      }));
      return;
    }

    // Need socket connection
    if (!socket) {
      console.log('[useOrderAssignments] Socket.IO disabled or not available');
      return;
    }

    const userId = user.uid;
    const roomName = `tailor:${userId}`;

    const handleConnect = () => {
      console.log(`[useOrderAssignments] Socket connected, listening in ${roomName}`);
      // Automatically join personal room (server-side could do this on auth)
      socket.emit('notification:subscribe', { room: roomName });
      setState((prev) => ({
        ...prev,
        realtimeConnected: true,
        error: null,
      }));
    };

    const handleDisconnect = () => {
      console.log(`[useOrderAssignments] Socket disconnected`);
      setState((prev) => ({
        ...prev,
        realtimeConnected: false,
      }));
    };

    // Handle new order assignments
    const handleOrderAssignment = (assignment: OrderAssignment) => {
      console.log(
        `[useOrderAssignments] New assignment: ${assignment.orderNumber} (${assignment.productName})`
      );

      setState((prev) => ({
        ...prev,
        assignments: [assignment, ...prev.assignments],
        unreadCount: prev.unreadCount + 1,
      }));

      playNotificationSound();

      if (onAssignment) {
        onAssignment(assignment);
      }
    };

    // Handle generic notifications
    const handleNotification = (payload: any) => {
      console.log(`[useOrderAssignments] Notification (${payload.type}):`, payload.data);

      if (onNotification) {
        onNotification(payload.type, payload.data);
      }

      // Track assignment notifications
      if (payload.type === 'order-assigned' && payload.data) {
        handleOrderAssignment(payload.data);
      }
    };

    const handleError = (error: any) => {
      console.error(`[useOrderAssignments] Socket error:`, error);
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

    socket.on('order:assigned', handleOrderAssignment);
    socket.on('notification', handleNotification);
    socket.on('disconnect', handleDisconnect);
    socket.on('error', handleError);

    return () => {
      socket.off('order:assigned', handleOrderAssignment);
      socket.off('notification', handleNotification);
      socket.off('disconnect', handleDisconnect);
      socket.off('error', handleError);
    };
  }, [user?.uid, socket, playNotificationSound, onAssignment, onNotification]);

  return {
    assignments: state.assignments,
    unreadCount: state.unreadCount,
    realtimeConnected: state.realtimeConnected,
    error: state.error,
    markAsRead,
    clearAll,
  };
}
