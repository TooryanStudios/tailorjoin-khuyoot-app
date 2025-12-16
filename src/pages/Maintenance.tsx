import React from 'react';

export const Maintenance: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8f9fa',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '48px 32px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        {/* Logo or Icon */}
        <div style={{
          fontSize: '64px',
          marginBottom: '24px'
        }}>
          🔧
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#212529',
          marginBottom: '16px',
          lineHeight: '1.2'
        }}>
          Khuyoot is under maintenance
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: '18px',
          color: '#6c757d',
          marginBottom: '40px',
          lineHeight: '1.6'
        }}>
          We're improving the experience. Please check back soon.
        </p>

        {/* Footer note */}
        <p style={{
          marginTop: '32px',
          fontSize: '14px',
          color: '#adb5bd'
        }}>
          Thank you for your patience
        </p>
      </div>
    </div>
  );
};
