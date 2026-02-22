/**
 * useOrderSocket - Shared Socket.IO connection hook for order tracking
 * 
 * Manages connection lifecycle, authentication, and error handling
 * All order-related hooks should use this as their base
 */

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketConnectionState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

const socketRef = useRef<Socket | null>(null);
const listenerCountRef = useRef(0);

/**
 * Get or create the Socket.IO connection to /orders namespace
 * Handles authentication and reconnection automatically
 */
function getOrderSocket(): Socket | null {
  // Skip if Socket.IO is disabled
  if (process.env.VITE_ENABLE_SOCKETIO === 'false') {
    return null;
  }

  // Return existing connection if available
  if (socketRef.current?.connected || socketRef.current?.connecting) {
    return socketRef.current;
  }

  try {
    // Get auth token from localStorage (same as REST API)
    const token = localStorage.getItem('firebaseAuthToken') ||
                  localStorage.getItem('firebase_authToken') ||
                  sessionStorage.getItem('firebaseAuthToken');

    if (!token) {
      console.warn('[useOrderSocket] No auth token available');
      return null;
    }

    // Get API server URL from environment or infer from current location
    const apiUrl = process.env.VITE_API_URL || 
                   (typeof window !== 'undefined' 
                     ? `${window.location.protocol}//${window.location.hostname}:8788`
                     : 'http://localhost:8788');

    // Create new connection
    socketRef.current = io(`${apiUrl}/orders`, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    // Global error handler
    socketRef.current.on('error', (error) => {
      console.error('[Socket.IO] Connection error:', error);
    });

    socketRef.current.on('connect_error', (error) => {
      console.warn('[Socket.IO] Connect error:', error);
    });

    console.log('[Socket.IO] Connection created to /orders namespace');
    return socketRef.current;
  } catch (error) {
    console.error('[useOrderSocket] Failed to create socket:', error);
    return null;
  }
}

/**
 * Increment listener count for connection lifecycle management
 */
function addListener() {
  listenerCountRef.current += 1;
}

/**
 * Decrement listener count, disconnect if no listeners remain
 */
function removeListener() {
  listenerCountRef.current -= 1;
  if (listenerCountRef.current <= 0 && socketRef.current?.connected) {
    // Keep connection alive (other hooks might need it)
    // Only disconnect if needed for memory conservation in future
  }
}

/**
 * Hook: Get Socket.IO connection state and socket instance
 * Use this in components that need low-level socket access
 */
export function useOrderSocket(): [
  socket: Socket | null,
  state: SocketConnectionState
] {
  const [connectionState, setConnectionState] = useState<SocketConnectionState>({
    connected: false,
    connecting: false,
    error: null,
  });

  useEffect(() => {
    const socket = getOrderSocket();
    if (!socket) {
      setConnectionState({
        connected: false,
        connecting: false,
        error: 'Socket.IO disabled or no token',
      });
      return;
    }

    addListener();

    // Update state on connection events
    const handleConnect = () => {
      console.log('[useOrderSocket] Connected');
      setConnectionState({
        connected: true,
        connecting: false,
        error: null,
      });
    };

    const handleDisconnect = () => {
      console.log('[useOrderSocket] Disconnected');
      setConnectionState({
        connected: false,
        connecting: false,
        error: null,
      });
    };

    const handleConnecting = () => {
      setConnectionState((prev) => ({
        ...prev,
        connecting: true,
      }));
    };

    const handleError = (error: any) => {
      setConnectionState((prev) => ({
        ...prev,
        error: error?.message || 'Connection error',
      }));
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleError);

    // Initial state
    setConnectionState({
      connected: socket.connected,
      connecting: socket.connecting,
      error: null,
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleError);
      removeListener();
    };
  }, []);

  return [socketRef.current, connectionState];
}

export { getOrderSocket };
