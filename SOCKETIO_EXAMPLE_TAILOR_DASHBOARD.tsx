/**
 * Example: Real-Time Order Assignment Notifications for Tailors
 * 
 * This demonstrates how to integrate useOrderAssignments hook into a tailor
 * dashboard to receive new order assignments in real-time with notifications
 * and sound alerts.
 */

import React, { useState, useEffect } from 'react';
import { useOrderAssignments } from '@/hooks/useOrderAssignments';
import { useNavigate } from 'react-router-dom';

/**
 * Example: Tailor Dashboard with Real-Time Order Assignments
 * 
 * Features:
 * - Receive new order assignments instantly
 * - Audio notification with sound alert
 * - Unread badge with count
 * - Click to view order details
 * - Mark as read
 * - Real-time status indicator
 */
export const TailorDashboardExample: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'all' | 'unread'>('unread');

  // Get real-time order assignments
  const {
    assignments,
    unreadCount,
    realtimeConnected,
    markAsRead,
    clearAll,
  } = useOrderAssignments({
    // Enable sound alert when new order assigned
    soundAlert: true,

    // Called when new order is assigned
    onAssignment: (order) => {
      console.log('New order assigned:', order.productName);
      // You could show an in-app toast notification here
      // toast.success(`New order: ${order.productName}`);
    },

    // Called for any notification event
    onNotification: (type, data) => {
      console.log(`Notification (${type}):`, data);
    },
  });

  // Filter assignments based on view mode
  const displayedAssignments =
    viewMode === 'unread' ? assignments : assignments;

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* ============ HEADER ============ */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          borderBottom: '2px solid #e5e7eb',
          paddingBottom: '1rem',
        }}
      >
        <h1 style={{ margin: 0 }}>My Orders</h1>

        {/* Connection Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: realtimeConnected ? '#10b981' : '#f59e0b',
              animation: realtimeConnected ? 'pulse 2s infinite' : 'none',
            }}
          />
          {realtimeConnected ? (
            <span style={{ color: '#10b981' }}>Live</span>
          ) : (
            <span style={{ color: '#f59e0b' }}>Polling</span>
          )}
        </div>
      </div>

      {/* ============ UNREAD BADGE ============ */}
      {unreadCount > 0 && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            borderLeft: '4px solid #ef4444',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold', color: '#7f1d1d' }}>
              🔔 {unreadCount} New Order{unreadCount > 1 ? 's' : ''}!
            </p>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#991b1b' }}>
              Tap to view and accept assignment
            </p>
          </div>
          <button
            onClick={clearAll}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* ============ FILTERS ============ */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '2rem',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '1rem',
        }}
      >
        <button
          onClick={() => setViewMode('unread')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: viewMode === 'unread' ? '#3b82f6' : '#f3f4f6',
            color: viewMode === 'unread' ? 'white' : '#1f2937',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          New ({unreadCount})
        </button>
        <button
          onClick={() => setViewMode('all')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: viewMode === 'all' ? '#3b82f6' : '#f3f4f6',
            color: viewMode === 'all' ? 'white' : '#1f2937',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          All ({assignments.length})
        </button>
      </div>

      {/* ============ ORDER LIST ============ */}
      {displayedAssignments.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            backgroundColor: '#f9fafb',
            borderRadius: '0.5rem',
            color: '#6b7280',
          }}
        >
          <p style={{ fontSize: '1.125rem', margin: '0 0 0.5rem 0' }}>
            {unreadCount === 0 ? '✅ All caught up!' : 'No new orders'}
          </p>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>
            New orders will appear here in real-time
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem',
          }}
        >
          {displayedAssignments.map((order) => (
            <OrderAssignmentCard
              key={order.orderId}
              order={order}
              onAccept={() => {
                markAsRead(order.orderId);
                navigate(`/orders/${order.orderId}`);
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

// ============ ORDER CARD COMPONENT ============

interface OrderAssignmentCardProps {
  order: any;
  onAccept: () => void;
}

const OrderAssignmentCard: React.FC<OrderAssignmentCardProps> = ({
  order,
  onAccept,
}) => {
  return (
    <div
      style={{
        border: '2px solid #3b82f6',
        borderRadius: '0.75rem',
        overflow: 'hidden',
        backgroundColor: 'white',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
      }}
      onClick={onAccept}
    >
      {/* Image */}
      {order.productImage && (
        <div
          style={{
            height: '200px',
            overflow: 'hidden',
            backgroundColor: '#f3f4f6',
          }}
        >
          <img
            src={order.productImage}
            alt={order.productName}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '1rem' }}>
        {/* Order Number */}
        {order.orderNumber && (
          <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.75rem' }}>
            Order #{order.orderNumber}
          </p>
        )}

        {/* Product Name */}
        <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1.125rem' }}>
          {order.productName}
        </h3>

        {/* Customer Info */}
        <div style={{ marginBottom: '1rem' }}>
          {order.customerName && (
            <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem' }}>
              <strong>Customer:</strong> {order.customerName}
            </p>
          )}
          {order.customerPhone && (
            <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem' }}>
              <strong>Phone:</strong>{' '}
              <a
                href={`tel:${order.customerPhone}`}
                style={{ color: '#3b82f6', textDecoration: 'none' }}
              >
                {order.customerPhone}
              </a>
            </p>
          )}
        </div>

        {/* Assigned Time */}
        <p
          style={{
            margin: '0 0 1rem 0',
            fontSize: '0.75rem',
            color: '#9ca3af',
          }}
        >
          Assigned {formatTime(new Date(order.assignedAt))}
        </p>

        {/* Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAccept();
          }}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '0.875rem',
          }}
        >
          View & Accept
        </button>
      </div>
    </div>
  );
};

// ============ HELPER FUNCTIONS ============

function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

// ============ INTEGRATION INSTRUCTIONS ============
/**
 * STEP 1: Copy this file to your tailor dashboard location
 * Example: src/modules/tailor/TailorDashboard.tsx
 * 
 * STEP 2: Import and use in your router:
 * 
 *   import { TailorDashboardExample } from '@/examples/TailorDashboardExample';
 * 
 *   // In your routes
 *   <Route path="/tailor/dashboard" element={<TailorDashboardExample />} />
 * 
 * STEP 3: Route to this page from your main tailor navigation
 * 
 * STEP 4: Test with:
 *   npm run dev:all
 * 
 *   Then:
 *   - Login as a tailor
 *   - Open dashboard (should show "All caught up!")
 *   - Open Firebase Console and create a new order with this tailor's ID
 *   - Watch: Toast notification appears, assignment card shows up
 *   - Listen for: Sound alert (if enabled)
 *   - Click "View & Accept" to navigate to order details
 * 
 * STEP 5: Customize:
 *   - Colors to match your brand
 *   - Add RTL (right-to-left) layout for Arabic
 *   - Connect to your actual tailor profile logic
 *   - Add swipe-to-accept on mobile
 *   - Integrate with your notification toast library
 * 
 * STEP 6: For Production:
 *   - Add error boundary
 *   - Add permission checks (verify user is a tailor)
 *   - Store "cleared" assignments to server
 *   - Add pagination for large order lists
 *   - Cache assignment list in IndexedDB for offline access
 */
