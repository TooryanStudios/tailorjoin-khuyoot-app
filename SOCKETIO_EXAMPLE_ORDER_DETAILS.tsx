/**
 * Example: Integrate Real-Time Order Tracking into Customer Order Details Page
 * 
 * This file demonstrates how to add Socket.IO real-time status updates
 * to an existing order details component using the useOrderTracking hook.
 * 
 * Copy and adapt this code into your actual order details page.
 */

import React, { useState } from 'react';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { useAuth } from '@/context/AppContext';
import type { Order, OrderStatus } from '@/types';

interface OrderDetailsExampleProps {
  orderId: string;
}

/**
 * Example: Customer Order Details with Real-Time Updates
 * 
 * Features:
 * - Real-time status updates via Socket.IO
 * - Fallback to Firestore if WebSocket unavailable
 * - Toast notifications on status change
 * - Connection status indicator
 * - Loaded via hook in ~30 lines
 */
export const OrderDetailsExample: React.FC<OrderDetailsExampleProps> = ({
  orderId,
}) => {
  const { user } = useAuth();
  const [notificationMessage, setNotificationMessage] = useState<string>('');

  // Use the hook to get real-time order data
  const { order, status, loading, error, realtimeConnected } = useOrderTracking(
    orderId,
    {
      // Called whenever status changes
      onStatusChange: (oldStatus, newStatus) => {
        const statusLabels: Record<OrderStatus, string> = {
          pending: 'قيد الانتظار',
          measuring: 'أخذ المقاسات',
          cutting: 'قص',
          sewing: 'خياطة',
          ready: 'جاهز',
          delivered: 'تم التسليم',
          cancelled: 'ملغي',
          rejected: 'مرفوض',
        };

        const message = `Order status changed: ${statusLabels[oldStatus]} → ${statusLabels[newStatus]}`;
        setNotificationMessage(message);

        // Play notification sound (optional)
        try {
          new Audio('/notification.mp3').play().catch(() => {});
        } catch (e) {}

        // Auto-dismiss notification after 5 seconds
        setTimeout(() => setNotificationMessage(''), 5000);
      },
    }
  );

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div role="status">⏳ Loading order details...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div
        style={{
          padding: '2rem',
          backgroundColor: '#fee2e2',
          borderRadius: '0.5rem',
          color: '#991b1b',
        }}
      >
        ❌ Error: {error || 'Order not found'}
      </div>
    );
  }

  // Is this order owned by the current user?
  const isOwner = user?.uid === order.userId;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      {/* ============ NOTIFICATION MESSAGE ============ */}
      {notificationMessage && (
        <div
          style={{
            padding: '1rem',
            marginBottom: '2rem',
            backgroundColor: '#dbeafe',
            borderLeft: '4px solid #3b82f6',
            borderRadius: '0.5rem',
            color: '#1e40af',
            animation: 'slideIn 0.3s ease-in-out',
          }}
        >
          🔔 {notificationMessage}
        </div>
      )}

      {/* ============ CONNECTION STATUS ============ */}
      <div style={{ marginBottom: '2rem', fontSize: '0.875rem' }}>
        {realtimeConnected ? (
          <span style={{ color: '#15803d' }}>
            🔴 Real-time updates connected (WebSocket)
          </span>
        ) : (
          <span style={{ color: '#b45309' }}>
            ⭕ Offline mode (updates may be delayed, syncing via Firestore)
          </span>
        )}
      </div>

      {/* ============ ORDER HEADER ============ */}
      <div
        style={{
          borderBottom: '2px solid #e5e7eb',
          paddingBottom: '1rem',
          marginBottom: '2rem',
        }}
      >
        <h1 style={{ margin: '0 0 0.5rem 0' }}>
          Order #{order.orderNumber || order.id.slice(0, 8)}
        </h1>
        <p style={{ color: '#666', margin: 0 }}>
          Placed on {new Date(order.orderDate).toLocaleDateString()}
        </p>
      </div>

      {/* ============ STATUS SECTION ============ */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
          STATUS
        </h2>
        <div
          style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            padding: '1rem',
            backgroundColor: getStatusColor(status as OrderStatus),
            borderRadius: '0.5rem',
            color: 'white',
            textAlign: 'center',
          }}
        >
          {getStatusLabel(status as OrderStatus)}
        </div>
      </div>

      {/* ============ TAILOR INFO ============ */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Tailor</h2>
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#f9fafb',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
          }}
        >
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
            {order.tailorName}
          </p>
          <p style={{ margin: 0, color: '#666' }}>
            {order.tailorId && <code>{order.tailorId}</code>}
          </p>
        </div>
      </div>

      {/* ============ PRODUCT INFO ============ */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Product</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '200px 1fr',
            gap: '1.5rem',
          }}
        >
          {order.productImage && (
            <img
              src={order.productImage}
              alt={order.productName}
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '0.5rem',
                objectFit: 'cover',
              }}
            />
          )}
          <div>
            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
              {order.productName}
            </p>
            {order.productCategory && (
              <p style={{ color: '#666', margin: '0 0 1rem 0' }}>
                Category: {order.productCategory}
              </p>
            )}
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
              ${order.price.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* ============ MEASUREMENTS (if available) ============ */}
      {order.measurements && Object.keys(order.measurements).length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Measurements</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem',
            }}
          >
            {Object.entries(order.measurements).map(([key, value]) => (
              value !== undefined && (
                <div
                  key={key}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '0.5rem',
                  }}
                >
                  <p style={{ margin: '0 0 0.25rem 0', color: '#666', fontSize: '0.875rem' }}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </p>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{value} cm</p>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* ============ ACTIONS ============ */}
      {isOwner && status !== 'delivered' && status !== 'cancelled' && (
        <div style={{ marginTop: '2rem' }}>
          <button
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Cancel Order
          </button>
        </div>
      )}

      {/* ============ DEBUG INFO (dev only) ============ */}
      {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            marginTop: '2rem',
            padding: '1rem',
            backgroundColor: '#1f2937',
            color: '#f3f4f6',
            borderRadius: '0.5rem',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            maxHeight: '300px',
            overflow: 'auto',
          }}
        >
          {/* Debug: Show order data structure */}
          Order ID: {order.id}
          {'\n'}
          Owner: {isOwner ? 'Yes' : 'No'}
          {'\n'}
          Real-time: {realtimeConnected ? 'Connected' : 'Disconnected'}
          {'\n'}
          {'\n'}
          Raw Data:
          {'\n'}
          {JSON.stringify(order, null, 2)}
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

// ============ HELPER FUNCTIONS ============

function getStatusLabel(status: OrderStatus | null): string {
  const labels: Record<OrderStatus, string> = {
    pending: 'Waiting for Tailor',
    measuring: 'Taking Measurements',
    cutting: 'Cutting Fabric',
    sewing: 'Sewing',
    ready: 'Ready for Pickup',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    rejected: 'Rejected',
  };
  return labels[status as OrderStatus] || 'Unknown Status';
}

function getStatusColor(status: OrderStatus | null): string {
  const colors: Record<OrderStatus, string> = {
    pending: '#f59e0b', // amber
    measuring: '#3b82f6', // blue
    cutting: '#8b5cf6', // purple
    sewing: '#ec4899', // pink
    ready: '#10b981', // emerald
    delivered: '#06b6d4', // cyan
    cancelled: '#6b7280', // gray
    rejected: '#ef4444', // red
  };
  return colors[status as OrderStatus] || '#6b7280';
}

// ============ INTEGRATION INSTRUCTIONS ============
/**
 * STEP 1: Copy this file to your order details page location
 * Example: src/modules/orders/OrderDetailsPage.tsx
 * 
 * STEP 2: Import and use in your main order page:
 * 
 *   import { OrderDetailsExample } from '@/examples/OrderDetailsExample';
 * 
 *   export function MyOrderDetailsPage() {
 *     const { orderId } = useParams();
 *     return <OrderDetailsExample orderId={orderId!} />;
 *   }
 * 
 * STEP 3: Test with:
 *   npm run dev:all
 * 
 *   Then:
 *   - Open order details
 *   - Check DevTools Network tab for WebSocket connection to localhost:8788
 *   - Manually update order status in Firestore Console
 *   - Watch status update in real-time <1s
 * 
 * STEP 4: Customize styling, colors, RTL (Arabic) layout as needed
 * 
 * STEP 5: Remove debug info section for production
 */
