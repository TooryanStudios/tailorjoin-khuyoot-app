import React from 'react';
import { useAuth } from '../auth/useAuth';
import { apiJson } from '../api/apiFetch';
import { useNavigate } from 'react-router-dom';
import { firebaseService } from '../services/firebase';

export const CookieAuthTest: React.FC = () => {
  const { status, user, logout } = useAuth();
  const navigate = useNavigate();
  const [serverUser, setServerUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showRawJson, setShowRawJson] = React.useState(false);

  // Login fields
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loginLoading, setLoginLoading] = React.useState(false);

  // Generation history
  const [generationHistory, setGenerationHistory] = React.useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [historyError, setHistoryError] = React.useState<string | null>(null);

  // Closet / Saved items
  const [closetItems, setClosetItems] = React.useState<any[]>([]);
  const [closetLoading, setClosetLoading] = React.useState(false);
  const [closetError, setClosetError] = React.useState<string | null>(null);

  // All user details
  const [showAllDetails, setShowAllDetails] = React.useState(false);

  const checkMe = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiJson<any>('/api/auth/me');
      setServerUser(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch /api/auth/me');
      setServerUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const data = await apiJson<any>('/api/designer-v2-1/history?limit=20');
      setGenerationHistory(data.generations || data || []);
    } catch (err: any) {
      setHistoryError(err.message || 'Failed to fetch generation history');
      setGenerationHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchClosetItems = async () => {
    setClosetLoading(true);
    setClosetError(null);
    try {
      // If user has saved items in their profile
      if (serverUser?.closet || serverUser?.savedItems) {
        setClosetItems(serverUser.closet || serverUser.savedItems || []);
      } else {
        setClosetItems([
          { message: 'No closet/saved items in user profile', source: 'profile' },
        ]);
      }
    } catch (err: any) {
      setClosetError(err.message || 'Failed to fetch closet');
      setClosetItems([]);
    } finally {
      setClosetLoading(false);
    }
  };

  React.useEffect(() => {
    if (status === 'authenticated') {
      checkMe();
      fetchHistory();
      fetchClosetItems();
    }
  }, [status]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setError(null);
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      setLoginLoading(false);
      return;
    }
    try {
      await firebaseService.login(email.trim(), password);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const truncateString = (str: string, maxLength: number = 100) => {
    if (!str || typeof str !== 'string') return String(str || 'null');
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '... (truncated)';
  };

  const formatValue = (key: string, value: any) => {
    // Skip photoURL in the grid since we show it as image
    if (key === 'photoURL') return null;

    // Handle base64 images - truncate them
    if (typeof value === 'string' && value.startsWith('data:image/')) {
      const parts = value.split(',');
      return `${parts[0]},... (${Math.round(value.length / 1024)}KB image data)`;
    }

    // Handle objects
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    // Handle regular strings
    return truncateString(String(value), 200);
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-100 overflow-y-auto">
      <div className="p-4 max-w-6xl mx-auto pb-20">
        <div className="flex items-center justify-between mb-6 mt-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">🔐 Firebase Auth Debug</h1>
          <div className="flex gap-2 text-[10px] items-center">
            <span className={`px-3 py-1 rounded-md font-bold uppercase ${status === 'authenticated' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
              {status}
            </span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-lg shadow-lg mb-4">
          <h2 className="text-emerald-400 font-bold mb-3 uppercase tracking-wider text-xs">Direct Login Setup</h2>
          <form onSubmit={handleLogin} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-black/40 border border-slate-700 rounded px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 bg-black/40 border border-slate-700 rounded px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2 bg-emerald-600/80 text-white text-xs font-bold rounded hover:bg-emerald-500 disabled:opacity-50 transition-colors uppercase"
            >
              {loginLoading ? 'Logging in...' : 'Sign In & Set Cookie'}
            </button>
          </form>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg mb-4">
            <p className="text-red-400">{error}</p>
          </div>
        ) : serverUser ? (
          <>
            {/* Profile Card */}
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border border-slate-700 p-6 rounded-xl shadow-xl mb-4">
              <div className="flex items-start gap-4 mb-4">
                {serverUser.photoURL ? (
                  <img
                    src={serverUser.photoURL}
                    alt={serverUser.displayName || 'User'}
                    className="w-24 h-24 rounded-full border-2 border-purple-500/50 object-cover flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(serverUser.displayName || 'U')}&background=7c3aed&color=fff&size=128`;
                    }}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-purple-500/20 border-2 border-purple-500/50 flex items-center justify-center text-3xl font-bold text-purple-300 flex-shrink-0">
                    {serverUser.displayName?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-white mb-1 break-words">{serverUser.displayName || 'Anonymous User'}</h3>
                  <p className="text-slate-400 text-sm mb-2 break-all">{serverUser.email}</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-purple-300 text-xs font-semibold">
                      {serverUser.tier || serverUser.subscription?.tier || 'free'}
                    </span>
                    <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-emerald-300 text-xs font-semibold">
                      {serverUser.credits || serverUser.credit_balance || 0} Credits
                    </span>
                    {serverUser.role && (
                      <span className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded text-yellow-300 text-xs font-semibold uppercase">
                        {serverUser.role}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Complete Firebase Profile Data */}
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-lg shadow-lg mb-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-yellow-400 font-bold uppercase tracking-wider text-xs">📊 Firebase Profile Fields</h2>
                <button
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="px-3 py-1 bg-slate-700 text-slate-300 text-[10px] font-bold rounded hover:bg-slate-600 transition-colors uppercase"
                >
                  {showRawJson ? 'Hide JSON' : 'Show Raw JSON'}
                </button>
              </div>

              {showRawJson && (
                <div className="bg-black/40 p-3 rounded border border-slate-800/50 font-mono text-xs overflow-auto mb-3 max-h-96">
                  <pre className="text-emerald-400 whitespace-pre-wrap break-words text-[10px]">
                    {JSON.stringify(serverUser, null, 2)}
                  </pre>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs max-h-[500px] overflow-y-auto pr-2">
                {Object.entries(serverUser).map(([key, value]: [string, any]) => {
                  const formattedValue = formatValue(key, value);
                  if (formattedValue === null) return null;

                  return (
                    <div key={key} className="bg-black/40 p-3 rounded border border-slate-800/50 break-words">
                      <div className="text-yellow-300 font-semibold mb-1 text-xs">{key}</div>
                      <div className="text-slate-300 font-mono text-[10px] break-all overflow-hidden">
                        {formattedValue}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-lg text-center">
            <p className="text-slate-400 mb-3">No session data loaded</p>
            <button
              onClick={checkMe}
              className="px-4 py-2 bg-blue-600/80 text-white text-xs font-bold rounded hover:bg-blue-500 transition-colors uppercase"
            >
              Fetch Profile Data
            </button>
          </div>
        )}

        {/* Server User Raw Data - Quick Debug */}
        {serverUser && (
          <div className="mt-6 p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
            <details className="text-xs">
              <summary className="text-slate-400 cursor-pointer hover:text-slate-300 font-semibold">📋 Raw serverUser JSON (for debugging)</summary>
              <pre className="mt-2 p-2 bg-black/60 rounded text-[8px] text-slate-300 overflow-auto max-h-96 font-mono">
                {JSON.stringify(serverUser, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Generation History Section */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-lg shadow-lg mb-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-cyan-400 font-bold uppercase tracking-wider text-xs">🖼️ Generation History</h2>
            <button
              onClick={fetchHistory}
              disabled={historyLoading}
              className="px-3 py-1 bg-cyan-600/80 text-white text-[10px] font-bold rounded hover:bg-cyan-500 disabled:opacity-50 transition-colors uppercase"
            >
              {historyLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {historyError && (
            <div className="bg-red-900/20 border border-red-500/30 p-3 rounded mb-3">
              <p className="text-red-400 text-xs">{historyError}</p>
            </div>
          )}

          {historyLoading ? (
            <div className="flex items-center justify-center h-24">
              <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : generationHistory.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-500 text-sm">No generations found</p>
              <p className="text-slate-600 text-xs mt-1">Generate some images in Designer V2.1 to see them here</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {generationHistory.map((gen: any, idx: number) => (
                <div key={gen.id || gen.jobId || idx} className="bg-black/40 p-3 rounded border border-slate-800/50">
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    {(gen.thumbnailUrl || gen.fullImageUrl) && (
                      <img
                        src={gen.thumbnailUrl || gen.fullImageUrl}
                        alt="Generation thumbnail"
                        className="w-20 h-20 object-cover rounded border border-slate-700 flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-cyan-300 font-mono text-[10px]">
                          {gen.jobId || gen.id || 'N/A'}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          gen.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                          gen.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          gen.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {gen.status || 'unknown'}
                        </span>
                      </div>
                      <div className="text-slate-400 text-[10px] mb-1">
                        Created: {gen.createdAt ? new Date(gen.createdAt._seconds ? gen.createdAt._seconds * 1000 : gen.createdAt).toLocaleString() : 'N/A'}
                      </div>
                      {gen.settings && (
                        <div className="text-slate-500 text-[9px] font-mono">
                          {gen.settings.garmentType && <span className="mr-2">Type: {gen.settings.garmentType}</span>}
                          {gen.settings.category && <span className="mr-2">Cat: {gen.settings.category}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Raw History Data Toggle */}
          <div className="mt-3 pt-3 border-t border-slate-800">
            <details className="text-xs">
              <summary className="text-slate-500 cursor-pointer hover:text-slate-400">View Raw History Data ({generationHistory.length} items)</summary>
              <pre className="mt-2 p-2 bg-black/40 rounded text-[9px] text-slate-400 overflow-auto max-h-48">
                {JSON.stringify(generationHistory, null, 2)}
              </pre>
            </details>
          </div>
        </div>

        {/* Closet/Saved Items Section */}
        <div className="mt-6 p-4 bg-slate-950/40 border border-slate-800 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-200">
              Closet / Saved Items {closetItems.length > 0 && `(${closetItems.length})`}
            </h3>
            <button
              onClick={fetchClosetItems}
              disabled={closetLoading}
              className="text-xs px-2 py-1 bg-slate-800 border border-slate-700 text-slate-400 rounded hover:bg-slate-700 transition-all disabled:opacity-50"
            >
              {closetLoading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {closetError && (
            <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded mb-3">
              {closetError}
            </div>
          )}

          {closetLoading ? (
            <div className="text-slate-400 text-xs py-4 text-center">Loading closet...</div>
          ) : closetItems.length === 0 ? (
            <div className="text-slate-400 text-xs py-4 text-center">No closet items found</div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {closetItems.map((item, idx) => (
                <div key={idx} className="p-2 bg-slate-900/50 border border-slate-700 rounded text-xs">
                  {item.message ? (
                    <div className="text-slate-400">{item.message}</div>
                  ) : (
                    <>
                      {item.thumbnailUrl && (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.name || 'closet item'}
                          className="w-full h-20 object-cover rounded mb-2 bg-slate-800"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23334155" width="100" height="100"/%3E%3C/svg%3E';
                          }}
                        />
                      )}
                      {item.name && <div className="font-semibold text-slate-200 mb-1">{item.name}</div>}
                      {item.category && <div className="text-slate-400">Category: {item.category}</div>}
                      {item.createdAt && (
                        <div className="text-slate-500 text-[9px] mt-1">
                          Added: {new Date(item.createdAt._seconds ? item.createdAt._seconds * 1000 : item.createdAt).toLocaleDateString()}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Raw Closet Data Toggle */}
          <div className="mt-3 pt-3 border-t border-slate-800">
            <details className="text-xs">
              <summary className="text-slate-500 cursor-pointer hover:text-slate-400">View Raw Closet Data</summary>
              <pre className="mt-2 p-2 bg-black/40 rounded text-[9px] text-slate-400 overflow-auto max-h-48">
                {JSON.stringify(closetItems, null, 2)}
              </pre>
            </details>
          </div>
        </div>

        {/* All User Details Section */}
        <div className="mt-6 p-4 bg-slate-950/40 border border-slate-800 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-200">
              Complete User Details
            </h3>
            <button
              onClick={() => setShowAllDetails(!showAllDetails)}
              className="text-xs px-2 py-1 bg-slate-800 border border-slate-700 text-slate-400 rounded hover:bg-slate-700 transition-all"
            >
              {showAllDetails ? 'Hide' : 'Show'}
            </button>
          </div>

          {showAllDetails && serverUser && (
            <div className="space-y-4">
              {/* Profile Information */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">Profile</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                    <div className="text-slate-500">Display Name</div>
                    <div className="text-slate-200 font-mono text-[10px]">{serverUser.displayName || 'N/A'}</div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                    <div className="text-slate-500">Email</div>
                    <div className="text-slate-200 font-mono text-[10px]">{serverUser.email || 'N/A'}</div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                    <div className="text-slate-500">UID</div>
                    <div className="text-slate-200 font-mono text-[10px]">{serverUser.uid || 'N/A'}</div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                    <div className="text-slate-500">Role</div>
                    <div className="text-slate-200 font-mono text-[10px]">{serverUser.role || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Billing & Credits */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">Billing & Credits</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                    <div className="text-slate-500">Tier</div>
                    <div className="text-slate-200 font-mono text-[10px]">{serverUser?.billing?.tier || serverUser?.tier || 'N/A'}</div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                    <div className="text-slate-500">Subscription Tier</div>
                    <div className="text-slate-200 font-mono text-[10px]">{serverUser?.subscription?.tier || 'N/A'}</div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                    <div className="text-slate-500">Credits</div>
                    <div className="text-amber-400 font-mono text-[10px] font-bold">{serverUser?.billing?.credits !== undefined ? serverUser.billing.credits : serverUser?.credits || 'N/A'}</div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                    <div className="text-slate-500">Subscription Status</div>
                    <div className="text-slate-200 font-mono text-[10px]">{serverUser?.billing?.subscriptionStatus || serverUser?.subscriptionStatus || 'N/A'}</div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700 col-span-2">
                    <div className="text-slate-500">Last Credit Action</div>
                    <div className="text-slate-200 font-mono text-[9px]">{serverUser?.last_credit_action || 'N/A'}</div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700 col-span-2">
                    <div className="text-slate-500">Last Credit Operation</div>
                    <div className="text-slate-200 font-mono text-[9px]">{serverUser?.last_credit_op || 'N/A'}</div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700 col-span-2">
                    <div className="text-slate-500">Last Credit Transaction ID</div>
                    <div className="text-slate-200 font-mono text-[9px] break-all">{serverUser?.last_credit_tx || 'N/A'}</div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700 col-span-2">
                    <div className="text-slate-500">Last Purchase ID</div>
                    <div className="text-slate-200 font-mono text-[9px] break-all">{serverUser?.last_purchase_id || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Location & Regional */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">Location</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                    <div className="text-slate-500">Region</div>
                    <div className="text-slate-200 font-mono text-[10px]">{serverUser.region || 'N/A'}</div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                    <div className="text-slate-500">Service Areas</div>
                    <div className="text-slate-200 font-mono text-[9px]">
                      {Array.isArray(serverUser.serviceAreas) ? serverUser.serviceAreas.join(', ') || 'N/A' : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">Account Status</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                    <div className="text-slate-500">Email Verified</div>
                    <div className={`font-mono text-[10px] ${serverUser.email_verified ? 'text-emerald-400' : 'text-red-400'}`}>
                      {serverUser.email_verified ? '✓ Yes' : '✗ No'}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                    <div className="text-slate-500">Anonymous</div>
                    <div className={`font-mono text-[10px] ${!serverUser.isAnonymous ? 'text-emerald-400' : 'text-yellow-400'}`}>
                      {serverUser.isAnonymous ? '⚠ Yes' : '✓ No'}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                    <div className="text-slate-500">Require Password Change</div>
                    <div className={`font-mono text-[10px] ${serverUser.requirePasswordChange ? 'text-red-400' : 'text-emerald-400'}`}>
                      {serverUser.requirePasswordChange ? '⚠ Yes' : '✓ No'}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                    <div className="text-slate-500">Hide Designer Intro</div>
                    <div className="text-slate-200 font-mono text-[10px]">{serverUser.hideDesignerIntro ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">Timestamps</h4>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                    <div className="text-slate-500">Join Date</div>
                    <div className="text-slate-200 font-mono text-[9px]">
                      {serverUser.joinDate ? new Date(serverUser.joinDate._seconds ? serverUser.joinDate._seconds * 1000 : serverUser.joinDate).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                    <div className="text-slate-500">Created At</div>
                    <div className="text-slate-200 font-mono text-[9px]">
                      {serverUser.createdAt ? new Date(serverUser.createdAt._seconds ? serverUser.createdAt._seconds * 1000 : serverUser.createdAt).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded border border-slate-700">
                    <div className="text-slate-500">Updated At</div>
                    <div className="text-slate-200 font-mono text-[9px]">
                      {serverUser.updatedAt ? new Date(serverUser.updatedAt._seconds ? serverUser.updatedAt._seconds * 1000 : serverUser.updatedAt).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Full JSON */}
              <div>
                <details className="text-xs">
                  <summary className="text-slate-500 cursor-pointer hover:text-slate-400 font-semibold">Full User Profile JSON</summary>
                  <pre className="mt-2 p-2 bg-black/40 rounded text-[8px] text-slate-400 overflow-auto max-h-64">
                    {JSON.stringify(serverUser, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={logout}
            className="flex-1 px-3 py-2 bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-bold rounded-md hover:bg-red-600/30 hover:text-white transition-all uppercase tracking-wide"
          >
            Logout
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold rounded-md hover:bg-slate-700 transition-all uppercase tracking-wide"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
};