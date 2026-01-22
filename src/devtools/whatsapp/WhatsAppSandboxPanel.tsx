import React, { useState } from 'react';

/**
 * WhatsApp Sandbox Testing Panel
 * 
 * DEV-ONLY component for testing WhatsApp integration.
 * Only visible when VITE_DEVTOOLS=true or in dev mode.
 * 
 * Can be safely deleted without affecting production.
 */

export const WhatsAppSandboxPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [to, setTo] = useState('');
  const [name, setName] = useState('');
  const [order, setOrder] = useState('');

  const handleSendTest = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/whatsapp/send-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: to || undefined,
          name: name || undefined,
          order: order || undefined,
          date: new Date().toLocaleDateString()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send message');
        setResult(data);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckHealth = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/whatsapp/health');
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: '24px',
      maxWidth: '800px',
      margin: '40px auto',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          🧪 WhatsApp Sandbox Testing
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px' }}>
          DEV-ONLY: Test WhatsApp Business Platform integration (Meta test number - Path A)
        </p>
      </div>

      {/* Instructions */}
      <div style={{
        padding: '16px',
        backgroundColor: '#fef3c7',
        border: '1px solid #fbbf24',
        borderRadius: '6px',
        marginBottom: '24px',
        fontSize: '14px'
      }}>
        <strong>⚠️ Setup Instructions:</strong>
        <ol style={{ marginTop: '8px', paddingLeft: '20px' }}>
          <li>Generate temp token in Meta API Testing page</li>
          <li>Add to Vercel Preview env: <code>WA_TEMP_ACCESS_TOKEN</code></li>
          <li>Redeploy preview to pick up new env var</li>
          <li>Configure Meta webhook to point to preview URL</li>
        </ol>
      </div>

      {/* Health Check */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={handleCheckHealth}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {loading ? 'Checking...' : '✓ Check Health'}
        </button>
      </div>

      {/* Send Test Form */}
      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        marginBottom: '24px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          Send Test Template Message
        </h2>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
            Recipient Phone (wa_id)
          </label>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="e.g., 96892988080 (leave empty to use WA_DEFAULT_TO)"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
            Customer Name (optional)
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., John Doe"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
            Order Number (optional)
          </label>
          <input
            type="text"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            placeholder="e.g., #ORD123"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>

        <button
          onClick={handleSendTest}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          {loading ? 'Sending...' : '📤 Send Sandbox Test Message'}
        </button>
      </div>

      {/* Result/Error Display */}
      {error && (
        <div style={{
          padding: '16px',
          backgroundColor: '#fee2e2',
          border: '1px solid #ef4444',
          borderRadius: '6px',
          marginBottom: '16px'
        }}>
          <strong style={{ color: '#dc2626' }}>Error:</strong>
          <pre style={{ marginTop: '8px', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
            {error}
          </pre>
        </div>
      )}

      {result && (
        <div style={{
          padding: '16px',
          backgroundColor: '#f0fdf4',
          border: '1px solid #10b981',
          borderRadius: '6px'
        }}>
          <strong style={{ color: '#059669' }}>Response:</strong>
          <pre style={{
            marginTop: '8px',
            fontSize: '13px',
            whiteSpace: 'pre-wrap',
            maxHeight: '300px',
            overflow: 'auto'
          }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: '24px',
        padding: '12px',
        backgroundColor: '#e0e7ff',
        border: '1px solid #818cf8',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#4338ca'
      }}>
        <strong>📝 Note:</strong> This panel is DEV-ONLY and can be safely removed by deleting /src/devtools/whatsapp folder.
      </div>
    </div>
  );
};
