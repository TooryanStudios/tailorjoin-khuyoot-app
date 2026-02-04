import React from 'react';
import { useAuth } from '../auth/useAuth';

export const LoginPage: React.FC = () => {
  const { status, user, login, logout } = useAuth();
  
  const [email, setEmail] = React.useState('user@test.com');
  const [password, setPassword] = React.useState('TestPass@123');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'authenticated' && user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
        }}>
          <h1 style={{ margin: '0 0 20px', fontSize: '24px', color: '#333' }}>
            Welcome!
          </h1>
          <p style={{ color: '#666', marginBottom: '30px' }}>
            Logged in as: <strong>{user.email}</strong>
          </p>
          <button
            onClick={logout}
            style={{
              width: '100%',
              padding: '12px',
              background: '#e53e3e',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        maxWidth: '500px',
        width: '100%',
      }}>
        <h1 style={{ margin: '0 0 10px', fontSize: '28px', color: '#333', textAlign: 'center' }}>
          Login
        </h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
          {status === 'loading' ? 'Loading...' : 'Enter your credentials'}
        </p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 600 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || status === 'loading'}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #cbd5e0',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontWeight: 600 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || status === 'loading'}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #cbd5e0',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              marginBottom: '20px',
              padding: '12px',
              background: '#fff5f5',
              border: '1px solid #feb2b2',
              borderRadius: '8px',
              color: '#c53030',
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || status === 'loading'}
            style={{
              width: '100%',
              padding: '14px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading || status === 'loading' ? 'not-allowed' : 'pointer',
              opacity: loading || status === 'loading' ? 0.6 : 1,
            }}
          >
            {loading || status === 'loading' ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
