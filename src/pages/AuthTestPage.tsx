import React from 'react';
import { useAuth } from '../auth/useAuth';
import { doc, getDoc, getDocFromCache, setDoc, serverTimestamp, connectFirestoreEmulator, enableIndexedDbPersistence, disableNetwork, enableNetwork, getFirestore } from 'firebase/firestore';
import { getIdToken } from 'firebase/auth';
import { db, firebaseService } from '../services/firebase';

/**
 * Minimal page to test and debug authentication loading speed.
 * No heavy components - just auth state and login form.
 */
export const AuthTestPage: React.FC = () => {
  const { status, user, login, logout } = useAuth();
  
  const [email, setEmail] = React.useState('diag_user_01@test.com');
  const [password, setPassword] = React.useState('TestPass@123');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [startTime] = React.useState(Date.now());

  type DiagLevel = 'info' | 'warn' | 'error';
  type DiagEntry = {
    t: number;
    level: DiagLevel;
    title: string;
    details?: string;
  };

  const [diag, setDiag] = React.useState<DiagEntry[]>(() => [
    { t: Date.now(), level: 'info', title: 'Page mounted', details: 'AuthTestPage mounted' },
  ]);

  const addDiag = React.useCallback((entry: Omit<DiagEntry, 't'>) => {
    setDiag((prev) => {
      const next = [...prev, { ...entry, t: Date.now() }];
      return next.slice(-80);
    });
  }, []);

  const formatDelta = React.useCallback(
    (t: number) => {
      const ms = Math.max(0, t - startTime);
      if (ms < 1000) return `${ms}ms`;
      return `${(ms / 1000).toFixed(1)}s`;
    },
    [startTime]
  );

  // Track auth state transitions (fast, localStorage / onIdTokenChanged)
  React.useEffect(() => {
    addDiag({
      level: status === 'authenticated' ? 'info' : status === 'unauthenticated' ? 'warn' : 'info',
      title: `Auth status: ${status}`,
      details: user
        ? `uid=${user.uid} email=${user.email || '-'} displayName=${user.displayName || '-'} photoURL=${(user as any).photoURL || '-'}`
        : 'user=null',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  React.useEffect(() => {
    addDiag({
      level: user ? 'info' : 'warn',
      title: user ? 'Auth user hydrated' : 'Auth user missing',
      details: user
        ? `uid=${user.uid} email=${user.email || '-'} displayName=${user.displayName || '-'} photoURL=${(user as any).photoURL || '-'}`
        : 'Waiting for auth to restore from Firebase/localStorage',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  // Track AppContext profile sync (Firestore users/{uid})
  
  // Intentionally do NOT load AppContext profile or any other data here.
  // This page is meant to isolate auth timing.

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const loginStart = Date.now();
    console.log('🔐 Login started at:', loginStart);

    try {
      await login(email, password);
      const loginEnd = Date.now();
      console.log('✅ Login completed in:', loginEnd - loginStart, 'ms');
      
      // IMMEDIATE PROBE: Don't wait for the useEffect
      probeFirestoreProfile();
    } catch (err: any) {
      const loginEnd = Date.now();
      console.error('❌ Login failed after:', loginEnd - loginStart, 'ms', err);
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err: any) {
      setError(err?.message || 'Logout failed');
    }
  };

  const elapsed = Date.now() - startTime;

  const usernameSource = user?.displayName
    ? 'Firebase Auth displayName'
    : user?.email
      ? 'Firebase Auth email'
      : 'none yet';
  const profileImageSource = (user as any)?.photoURL ? 'Firebase Auth photoURL' : 'none';

  const pending = {
    auth: status === 'loading',
  };

  const [copyNote, setCopyNote] = React.useState<string>('');
  
  const [envInfo] = React.useState(() => {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isEdge = ua.indexOf('Edg/') > -1;
    const hasIDB = typeof indexedDB !== 'undefined';
    const hasLS = typeof localStorage !== 'undefined';
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const persistenceParam = params.get('persistence');
    const testMode = params.get('testMode');
    return { isEdge, hasIDB, hasLS, persistenceParam, testMode };
  });

  const [profileProbe, setProfileProbe] = React.useState<{ at: number; ok: boolean; message: string; data?: any } | null>(null);
  const [creditsProbe, setCreditsProbe] = React.useState<{ at: number; ok: boolean; message: string; data?: any } | null>(null);

  const withTimeout = React.useCallback(<T,>(p: Promise<T>, ms: number, label: string) => {
    let timer: ReturnType<typeof window.setTimeout> | null = null;
    const timeout = new Promise<never>((_, reject) => {
      timer = window.setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms) as any;
    });
    return Promise.race([p, timeout]).finally(() => {
      if (timer != null) window.clearTimeout(timer);
    });
  }, []);

  const probeFirestoreProfile = React.useCallback(async () => {
    if (status !== 'authenticated' || !user?.uid) {
      addDiag({ level: 'warn', title: 'Profile probe skipped', details: 'Not authenticated or uid missing' });
      setProfileProbe({ at: Date.now(), ok: false, message: 'Not authenticated or uid missing' });
      return;
    }
    if (!db) {
      addDiag({ level: 'error', title: 'Profile probe failed', details: 'Firestore db is not initialized' });
      setProfileProbe({ at: Date.now(), ok: false, message: 'Firestore db is not initialized' });
      return;
    }

    const started = Date.now();
    addDiag({ level: 'info', title: 'Profile probe started', details: `users/${user.uid}` });

    try {
      const ref = doc(db, 'users', user.uid);
      
      // Try cache first to avoid waiting for Firestore sync (which can take 25s on page refresh)
      let snap;
      let source = 'cache';
      try {
        console.log('[Profile Probe] Trying cache first...');
        snap = await getDocFromCache(ref);
      } catch (cacheError) {
        console.log('[Profile Probe] Cache miss, fetching from network...');
        source = 'network';
        snap = await withTimeout(getDoc(ref), 30000, 'getDoc(users)');
      }
      
      const ms = Date.now() - started;

      if (!snap.exists()) {
        addDiag({ level: 'warn', title: 'Profile doc not found', details: `users/${user.uid} (${ms}ms)` });
        setProfileProbe({ at: Date.now(), ok: false, message: `users/${user.uid} not found (${ms}ms)` });
        return;
      }

      const data = snap.data();
      const name = (data as any)?.name ?? (data as any)?.displayName ?? null;
      const profileImage = (data as any)?.profileImage ?? (data as any)?.avatar ?? (data as any)?.photoURL ?? null;

      // Detect image type for diagnostics
      let imageType = '-';
      let imagePreview = '-';
      if (profileImage) {
        if (typeof profileImage === 'string') {
          if (profileImage.startsWith('data:')) {
            imageType = 'base64 data URL';
            imagePreview = profileImage.slice(0, 60) + '...';
          } else if (profileImage.startsWith('http')) {
            imageType = 'URL';
            imagePreview = profileImage.slice(0, 80) + (profileImage.length > 80 ? '...' : '');
          } else {
            imageType = 'unknown string';
            imagePreview = profileImage.slice(0, 60) + '...';
          }
        } else if (typeof profileImage === 'object') {
          imageType = 'object/blob';
          imagePreview = JSON.stringify(profileImage).slice(0, 80) + '...';
        } else {
          imageType = typeof profileImage;
          imagePreview = String(profileImage).slice(0, 60);
        }
      }

      addDiag({
        level: 'info',
        title: 'Profile doc loaded',
        details: `users/${user.uid} (${ms}ms) name=${name ?? '-'} source=${source}`,
      });
      setProfileProbe({
        at: Date.now(),
        ok: true,
        message: `Loaded (${ms}ms) name=${name ?? '-'} from ${source}`,
        data: { name: name ?? 'N/A' },
      });
    } catch (err: any) {
      const ms = Date.now() - started;
      addDiag({ level: 'error', title: 'Profile probe error', details: `${ms}ms ${err?.message || String(err)}` });
      setProfileProbe({ at: Date.now(), ok: false, message: `${ms}ms ${err?.message || String(err)}` });
    }
  }, [addDiag, status, user?.uid]);

  // AUTO-PROBE: Trigger profile probe immediately on successful authentication
  React.useEffect(() => {
    if (status === 'authenticated' && user?.uid) {
      console.log('🚀 [AuthTestPage] Auto-probing profile for authenticated user...');
      probeFirestoreProfile();
    }
  }, [status, user?.uid, probeFirestoreProfile]);

  const probeCredits = React.useCallback(async () => {
    if (status !== 'authenticated' || !user?.uid) {
      addDiag({ level: 'warn', title: 'Credits probe skipped', details: 'Not authenticated or uid missing' });
      setCreditsProbe({ at: Date.now(), ok: false, message: 'Not authenticated or uid missing' });
      return;
    }

    const started = Date.now();
    addDiag({ level: 'info', title: 'Credits probe started', details: `user_profiles/${user.uid}` });

    try {
      if (!firebaseService?.isInitialized?.()) {
        const ms = Date.now() - started;
        addDiag({ level: 'warn', title: 'Credits probe disabled', details: `${ms}ms firebaseService not initialized` });
        setCreditsProbe({ at: Date.now(), ok: false, message: `firebaseService not initialized (${ms}ms)` });
        return;
      }

      const p = await withTimeout(firebaseService.getUserCreditProfile(user.uid), 4000, 'getUserCreditProfile');
      const ms = Date.now() - started;

      if (!p) {
        addDiag({ level: 'warn', title: 'Credits doc not found', details: `user_profiles/${user.uid} (${ms}ms)` });
        setCreditsProbe({ at: Date.now(), ok: false, message: `user_profiles/${user.uid} not found (${ms}ms)` });
        return;
      }

      addDiag({
        level: 'info',
        title: 'Credits loaded',
        details: `user_profiles/${user.uid} (${ms}ms) balance=${p.credit_balance} tier=${p.tier ?? '-'}`,
      });
      setCreditsProbe({ at: Date.now(), ok: true, message: `Loaded (${ms}ms) balance=${p.credit_balance} tier=${p.tier ?? '-'}`, data: p });
    } catch (err: any) {
      const ms = Date.now() - started;
      addDiag({ level: 'error', title: 'Credits probe error', details: `${ms}ms ${err?.message || String(err)}` });
      setCreditsProbe({ at: Date.now(), ok: false, message: `${ms}ms ${err?.message || String(err)}` });
    }
  }, [addDiag, status, user?.uid, withTimeout]);

  const probeAll = React.useCallback(async () => {
    await probeFirestoreProfile();
    await probeCredits();
  }, [probeCredits, probeFirestoreProfile]);

  const [firestorePing, setFirestorePing] = React.useState<{ at: number; ok: boolean; message: string } | null>(null);
  const [tokenRefreshResult, setTokenRefreshResult] = React.useState<{ at: number; ok: boolean; message: string } | null>(null);

  // Force token refresh to unblock Firestore
  const forceTokenRefresh = React.useCallback(async () => {
    const auth = firebaseService.auth;
    const fbUser = auth?.currentUser;
    if (!fbUser) {
      addDiag({ level: 'warn', title: 'Token refresh skipped', details: 'No Firebase user' });
      setTokenRefreshResult({ at: Date.now(), ok: false, message: 'No Firebase user' });
      return;
    }

    const started = Date.now();
    addDiag({ level: 'info', title: 'Token refresh started', details: 'Calling getIdToken(true)...' });

    try {
      await getIdToken(fbUser, true);  // force=true
      const ms = Date.now() - started;
      addDiag({ level: 'info', title: 'Token refresh OK', details: `${ms}ms` });
      setTokenRefreshResult({ at: Date.now(), ok: true, message: `OK (${ms}ms)` });
    } catch (err: any) {
      const ms = Date.now() - started;
      addDiag({ level: 'error', title: 'Token refresh ERROR', details: `${ms}ms ${err?.message}` });
      setTokenRefreshResult({ at: Date.now(), ok: false, message: `${ms}ms ${err?.message}` });
    }
  }, [addDiag]);

  const pingFirestore = React.useCallback(async () => {
    if (!db) {
      addDiag({ level: 'error', title: 'Firestore ping failed', details: 'db is not initialized' });
      setFirestorePing({ at: Date.now(), ok: false, message: 'db not initialized' });
      return;
    }

    const started = Date.now();
    const uid = user?.uid;

    if (!uid) {
      addDiag({ level: 'warn', title: 'Firestore ping skipped', details: 'No user uid available' });
      setFirestorePing({ at: Date.now(), ok: false, message: 'No user uid - login first' });
      return;
    }

    addDiag({ level: 'info', title: 'Firestore ping started', details: 'Testing getDoc...' });

    try {
      const ref = doc(db, 'users', uid);
      const snap = await getDoc(ref);
      const ms = Date.now() - started;

      if (snap.exists()) {
        addDiag({ level: 'info', title: 'Firestore ping OK', details: `${ms}ms - user doc exists` });
        setFirestorePing({ at: Date.now(), ok: true, message: `OK (${ms}ms) - connected` });
      } else {
        addDiag({ level: 'info', title: 'Firestore ping OK', details: `${ms}ms - user doc not found but connected` });
        setFirestorePing({ at: Date.now(), ok: true, message: `OK (${ms}ms) - connected (no profile)` });
      }
    } catch (err: any) {
      const ms = Date.now() - started;
      addDiag({
        level: 'error',
        title: 'Firestore ping ERROR',
        details: `${ms}ms ${err?.message || String(err)}`,
      });
      setFirestorePing({ at: Date.now(), ok: false, message: `${ms}ms ${err?.message || String(err)}` });
    }
  }, [addDiag, user?.uid]);

  const [firestoreState, setFirestoreState] = React.useState<{ at: number; ok: boolean; message: string } | null>(null);

  const checkFirestoreState = React.useCallback(async () => {
    if (!db) {
      addDiag({ level: 'error', title: 'Firestore state check failed', details: 'db not initialized' });
      setFirestoreState({ at: Date.now(), ok: false, message: 'db not initialized' });
      return;
    }

    try {
      const started = Date.now();
      addDiag({ level: 'info', title: 'Checking Firestore state...', details: 'Analyzing persistence & network' });

      // Get Firestore internal state (hack to inspect)
      const dbAny = db as any;
      const clientState = {
        persistence: dbAny._persistenceKey ? 'ENABLED' : 'DISABLED',
        synced: dbAny._firestoreClient?.syncEngine?.isSynced?.() ?? 'UNKNOWN',
        pendingWrites: dbAny._firestoreClient?.syncEngine?.hasPendingWrites?.() ?? 'UNKNOWN',
        netConnected: dbAny._firestoreClient?.connectivityMonitor?.isOnline?.() ?? 'UNKNOWN',
      };

      const ms = Date.now() - started;
      const msg = `Persistence: ${clientState.persistence} | Synced: ${clientState.synced} | Pending: ${clientState.pendingWrites} | NetOnline: ${clientState.netConnected}`;
      
      addDiag({ level: 'info', title: 'Firestore state checked', details: `${ms}ms - ${msg}` });
      setFirestoreState({ at: Date.now(), ok: true, message: msg });
    } catch (err: any) {
      addDiag({ level: 'error', title: 'Firestore state check error', details: String(err) });
      setFirestoreState({ at: Date.now(), ok: false, message: String(err) });
    }
  }, [addDiag]);

  const [enableNetworkStatus, setEnableNetworkStatus] = React.useState<{ at: number; ok: boolean; message: string } | null>(null);

  const forceEnableNetwork = React.useCallback(async () => {
    if (!db) {
      addDiag({ level: 'error', title: 'Wait for sync failed', details: 'db not initialized' });
      return;
    }

    const started = Date.now();
    try {
      addDiag({ level: 'info', title: 'Waiting for Firestore sync...', details: 'Waiting for IndexedDB sync to complete' });

      const dbAny = db as any;
      const syncEngine = dbAny._firestoreClient?.syncEngine;
      
      if (!syncEngine) {
        throw new Error('SyncEngine not available');
      }

      // Poll for sync completion
      let waitTime = 0;
      const maxWait = 35000; // 35 seconds max
      while (waitTime < maxWait) {
        const isSynced = syncEngine.isSynced?.() ?? false;
        const hasPending = syncEngine.hasPendingWrites?.() ?? false;
        
        if (isSynced && !hasPending) {
          const ms = Date.now() - started;
          addDiag({ level: 'info', title: 'Firestore sync complete', details: `${ms}ms` });
          setEnableNetworkStatus({ at: Date.now(), ok: true, message: `Sync complete (${ms}ms)` });
          return;
        }
        
        await new Promise(r => setTimeout(r, 100));
        waitTime += 100;
      }
      
      throw new Error(`Sync timeout after ${waitTime}ms`);
    } catch (err: any) {
      const ms = Date.now() - started;
      addDiag({ level: 'error', title: 'Sync wait error', details: `${ms}ms ${String(err)}` });
      setEnableNetworkStatus({ at: Date.now(), ok: false, message: `${ms}ms ${String(err)}` });
    }
  }, [addDiag]);

  const [createProfileStatus, setCreateProfileStatus] = React.useState<{ at: number; ok: boolean; message: string } | null>(null);

  const createMissingProfile = React.useCallback(async () => {
    if (status !== 'authenticated' || !user?.uid) {
      addDiag({ level: 'warn', title: 'Create profile skipped', details: 'Not authenticated or uid missing' });
      setCreateProfileStatus({ at: Date.now(), ok: false, message: 'Not authenticated or uid missing' });
      return;
    }
    if (!db) {
      addDiag({ level: 'error', title: 'Create profile failed', details: 'Firestore db is not initialized' });
      setCreateProfileStatus({ at: Date.now(), ok: false, message: 'Firestore db not initialized' });
      return;
    }

    const started = Date.now();
    addDiag({ level: 'info', title: 'Creating profile doc', details: `users/${user.uid}` });

    try {
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const ms = Date.now() - started;
        addDiag({ level: 'info', title: 'Profile already exists', details: `users/${user.uid} (${ms}ms)` });
        setCreateProfileStatus({ at: Date.now(), ok: true, message: `Already exists (${ms}ms)` });
        return;
      }

      // Create new profile doc with defaults
      const newProfile = {
        id: user.uid,
        uid: user.uid,
        email: user.email || null,
        name: user.displayName || user.email?.split('@')[0] || 'Test User',
        profileImage: (user as any).photoURL || null,
        role: 'user',
        isGuest: false,
        joinDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(ref, newProfile);
      const ms = Date.now() - started;
      addDiag({ level: 'info', title: 'Profile created', details: `users/${user.uid} (${ms}ms) name=${newProfile.name}` });
      setCreateProfileStatus({ at: Date.now(), ok: true, message: `Created (${ms}ms) name=${newProfile.name}` });

      // Re-probe to confirm
      await probeFirestoreProfile();
    } catch (err: any) {
      const ms = Date.now() - started;
      addDiag({ level: 'error', title: 'Create profile error', details: `${ms}ms ${err?.message || String(err)}` });
      setCreateProfileStatus({ at: Date.now(), ok: false, message: `${ms}ms ${err?.message || String(err)}` });
    }
  }, [addDiag, probeFirestoreProfile, status, user]);

  const buildDiagnosticsReport = React.useCallback(() => {
    const pendingKeys = Object.entries(pending)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(', ');

    const lines: string[] = [];
    lines.push('Khuyoot Auth Diagnostics Report');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(`Elapsed: ${elapsed}ms`);
    lines.push('');
    lines.push(`Auth status: ${status}`);
    lines.push(
      `Auth user: ${
        user
          ? `uid=${user.uid} email=${user.email ?? '-'} displayName=${user.displayName ?? '-'} photoURL=${(user as any).photoURL ?? '-'}`
          : 'null'
      }`
    );
    lines.push('');
    lines.push(`Pending: ${pendingKeys || 'none'}`);
    lines.push(`Username source: ${usernameSource}`);
    lines.push(`Profile image source: ${profileImageSource}`);
    if (profileProbe) lines.push(`Profile probe: ${profileProbe.ok ? 'OK' : 'NOT OK'} — ${profileProbe.message}`);
    if (creditsProbe) lines.push(`Credits probe: ${creditsProbe.ok ? 'OK' : 'NOT OK'} — ${creditsProbe.message}`);
    lines.push('');
    lines.push('Timeline (latest first):');
    for (const e of diag.slice().reverse()) {
      lines.push(`${formatDelta(e.t)} [${e.level}] ${e.title}${e.details ? ` — ${e.details}` : ''}`);
    }
    return lines.join('\n');
  }, [creditsProbe, diag, elapsed, formatDelta, pending, profileImageSource, profileProbe, status, user, usernameSource]);

  const copyDiagnosticsReport = React.useCallback(async () => {
    const text = buildDiagnosticsReport();
    try {
      await navigator.clipboard.writeText(text);
      setCopyNote('Copied');
      addDiag({ level: 'info', title: 'Diagnostics copied', details: `chars=${text.length}` });
      window.setTimeout(() => setCopyNote(''), 2000);
      return;
    } catch {
      // ignore, fallback below
    }

    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', 'true');
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      el.style.top = '0';
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(el);

      if (ok) {
        setCopyNote('Copied');
        addDiag({ level: 'info', title: 'Diagnostics copied (fallback)', details: `chars=${text.length}` });
        window.setTimeout(() => setCopyNote(''), 2000);
      } else {
        setCopyNote('Copy failed');
        addDiag({ level: 'warn', title: 'Diagnostics copy failed', details: 'Clipboard API and fallback both failed' });
        window.setTimeout(() => setCopyNote(''), 3000);
      }
    } catch (err: any) {
      setCopyNote('Copy failed');
      addDiag({ level: 'error', title: 'Diagnostics copy error', details: err?.message || String(err) });
      window.setTimeout(() => setCopyNote(''), 3000);
    }
  }, [addDiag, buildDiagnosticsReport]);

  return (
    <div style={{
      height: '100vh',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        padding: '20px',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        overflowY: 'auto',
        width: '100%',
        boxSizing: 'border-box'
      }}>
      <div style={{
        marginTop: '20px', // Add top margin since we removed center justification
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        padding: '40px',
        maxWidth: '500px',
        width: '100%',
      }}>
        <h1 style={{ margin: '0 0 10px', fontSize: '28px', color: '#333', textAlign: 'center' }}>
          Auth Speed Test
        </h1>
        
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '30px',
          color: '#666'
        }}>
          Page Load Time: <strong style={{ color: elapsed > 1000 ? '#e53e3e' : '#38a169' }}>{elapsed}ms</strong>
        </div>

        {/* Diagnostics timeline (requested) */}
        <div style={{
          marginBottom: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          background: '#f8fafc',
          padding: '14px'
        }}>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ fontWeight: 700, color: '#2d3748', fontSize: '14px' }}>Diagnostics</div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
              {copyNote && (
                <span style={{ fontSize: '11px', color: '#38a169', fontWeight: 600 }}>{copyNote}</span>
              )}
              <button
                type="button"
                onClick={copyDiagnosticsReport}
                style={{
                  border: '1px solid #cbd5e0',
                  background: '#fff',
                  color: '#2d3748',
                  borderRadius: '8px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                Copy
              </button>
              <button
                type="button"
                onClick={() => setDiag([{ t: Date.now(), level: 'info', title: 'Diagnostics cleared' }])}
                style={{
                  border: '1px solid #cbd5e0',
                  background: '#fff',
                  color: '#2d3748',
                  borderRadius: '8px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Info section */}
          <div style={{ fontSize: '12px', color: '#4a5568', marginBottom: '12px' }}>
            <div>Pending: <span style={{ color: '#2d3748', fontWeight: 500 }}>{Object.entries(pending).filter(([, v]) => v).map(([k]) => k).join(', ') || 'none'}</span></div>
            <div>Username source: <span style={{ color: '#2d3748', fontWeight: 500 }}>{usernameSource}</span></div>
            <div>Profile image source: <span style={{ color: '#2d3748', fontWeight: 500 }}>{profileImageSource}</span></div>
          </div>

          {/* Environment Section */}
          <div style={{ 
            fontSize: '11px', 
            background: '#f7fafc', 
            padding: '8px', 
            borderRadius: '6px', 
            marginBottom: '12px',
            border: '1px solid #edf2f7' 
          }}>
            <div style={{ fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', color: '#718096' }}>Env Check</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
               <div>Browser: <span style={{ color: envInfo.isEdge ? '#d53f8c' : '#2d3748' }}>{envInfo.isEdge ? 'Edge' : 'Other'}</span></div>
               <div>IDB Support: <span style={{ color: envInfo.hasIDB ? '#38a169' : '#e53e3e' }}>{envInfo.hasIDB ? 'Yes' : 'Blocked'}</span></div>
               <div>Persistence: <span style={{ color: envInfo.persistenceParam === '0' ? '#e53e3e' : '#38a169' }}>{envInfo.persistenceParam === '0' ? 'Off (URL)' : 'On'}</span></div>
            </div>
            {envInfo.isEdge && envInfo.persistenceParam !== '0' && (
              <div style={{ marginTop: '6px', color: '#c05621', fontStyle: 'italic' }}>
                Tip: If Edge is hanging, try adding <b>?persistence=0</b> to the URL.
              </div>
            )}
          </div>

          {/* Solution Test Suite */}
          <div style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '10px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontWeight: 700, fontSize: '12px', marginBottom: '8px', color: '#1a202c', display: 'flex', justifyContent: 'space-between' }}>
              <span>PROPOSED SOLUTIONS TEST SUITE</span>
              {envInfo.testMode && <span style={{ color: '#3182ce', fontWeight: 800 }}>ACTIVE: {envInfo.testMode}</span>}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {[
                { id: 'A', label: 'A: Forced Sync', color: '#3182ce', bg: '#ebf8ff' },
                { id: 'B', label: 'B: Cache-First', color: '#38a169', bg: '#f0fff4' },
                { id: 'C', label: 'C: LS Mirror', color: '#805ad5', bg: '#faf5ff' },
                { id: 'D', label: 'D: No Sync', color: '#e53e3e', bg: '#fff5f5' },
              ].map(test => (
                <a
                  key={test.id}
                  href={`/auth-test?testMode=${test.id}`}
                  style={{
                    flex: '1 1 calc(50% - 6px)',
                    textAlign: 'center',
                    padding: '8px 4px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    border: `1px solid ${envInfo.testMode === test.id ? test.color : '#e2e8f0'}`,
                    background: envInfo.testMode === test.id ? test.bg : '#fff',
                    color: test.color,
                    transition: 'all 0.2s'
                  }}
                  onClick={(e) => {
                    // Force refresh to re-init firebase
                    window.location.href = `/auth-test?testMode=${test.id}`;
                    e.preventDefault();
                  }}
                >
                  {test.label}
                </a>
              ))}
              <a 
                href="/auth-test" 
                style={{ width: '100%', textAlign: 'center', fontSize: '10px', color: '#718096', textDecoration: 'none', marginTop: '4px' }}
              >
                Reset to Default
              </a>
            </div>
          </div>

          {/* Action buttons - wrapped grid */}
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '8px',
            paddingTop: '10px',
            borderTop: '1px solid #e2e8f0'
          }}>
            <button
              type="button"
              onClick={probeAll}
              style={{
                border: '1px solid #3182ce',
                background: '#ebf8ff',
                color: '#2b6cb0',
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              Probe All
            </button>
            <button
              type="button"
              onClick={forceTokenRefresh}
              style={{
                border: '1px solid #48bb78',
                background: '#f0fff4',
                color: '#276749',
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              Refresh Token
            </button>
            <button
              type="button"
              onClick={pingFirestore}
              style={{
                border: '1px solid #ed8936',
                background: '#fffaf0',
                color: '#c05621',
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              Ping DB
            </button>
            <button
              type="button"
              onClick={checkFirestoreState}
              style={{
                border: '1px solid #9f7aea',
                background: '#faf5ff',
                color: '#553399',
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              Check State
            </button>
            <button
              type="button"
              onClick={forceEnableNetwork}
              style={{
                border: '1px solid #d69e2e',
                background: '#fffaf0',
                color: '#7c2d12',
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              Wait Sync
            </button>
            <button
              type="button"
              onClick={handleLogin}
              style={{
                border: '1px solid #10b981',
                background: '#ecfdf5',
                color: '#047857',
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              🚀 Fast Re-Auth
            </button>
            <button
              type="button"
              onClick={probeFirestoreProfile}
              style={{
                border: '1px solid #cbd5e0',
                background: '#fff',
                color: '#2d3748',
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              Probe Profile
            </button>
            <button
              type="button"
              onClick={probeCredits}
              style={{
                border: '1px solid #cbd5e0',
                background: '#fff',
                color: '#2d3748',
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              Probe Credits
            </button>
          </div>

          {/* Create Profile button - shown when profile probe failed */}
          {profileProbe && !profileProbe.ok && status === 'authenticated' && (
            <div style={{
              marginTop: '10px',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid #fed7d7',
              background: '#fff5f5',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#c53030', marginBottom: '8px' }}>
                ⚠️ Missing profile document in <code>users/{user?.uid}</code>
              </div>
              <div style={{ fontSize: '11px', color: '#4a5568', marginBottom: '10px' }}>
                This test user has no Firestore profile. Click below to create one.
              </div>
              <button
                type="button"
                onClick={createMissingProfile}
                style={{
                  border: 'none',
                  background: '#38a169',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                Create Missing Profile
              </button>
              {createProfileStatus && (
                <div style={{
                  marginTop: '8px',
                  fontSize: '11px',
                  color: createProfileStatus.ok ? '#2f855a' : '#c53030',
                  fontWeight: 600,
                }}>
                  {createProfileStatus.ok ? '✓' : '✗'} {createProfileStatus.message}
                </div>
              )}
            </div>
          )}

          {tokenRefreshResult && (
            <div style={{
              marginTop: '10px',
              borderRadius: '10px',
              border: tokenRefreshResult.ok ? '1px solid #c6f6d5' : '1px solid #fed7d7',
              background: tokenRefreshResult.ok ? '#f0fff4' : '#fff5f5',
              padding: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: tokenRefreshResult.ok ? '#22543d' : '#c53030' }}>
                  Token Refresh: {tokenRefreshResult.ok ? 'OK' : 'FAILED'}
                </div>
                <div style={{ fontSize: '11px', color: '#718096' }}>+{formatDelta(tokenRefreshResult.at)}</div>
              </div>
              <div style={{ marginTop: '6px', fontSize: '11px', color: '#4a5568', wordBreak: 'break-word' }}>
                {tokenRefreshResult.message}
              </div>
            </div>
          )}

          {firestorePing && (
            <div style={{
              marginTop: '10px',
              borderRadius: '10px',
              border: firestorePing.ok ? '1px solid #c6f6d5' : '1px solid #fed7d7',
              background: firestorePing.ok ? '#f0fff4' : '#fff5f5',
              padding: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: firestorePing.ok ? '#22543d' : '#c53030' }}>
                  DB Ping: {firestorePing.ok ? 'OK' : 'FAILED'}
                </div>
                <div style={{ fontSize: '11px', color: '#718096' }}>+{formatDelta(firestorePing.at)}</div>
              </div>
              <div style={{ marginTop: '6px', fontSize: '11px', color: '#4a5568', wordBreak: 'break-word' }}>
                {firestorePing.message}
              </div>
            </div>
          )}

          {firestoreState && (
            <div style={{
              marginTop: '10px',
              borderRadius: '10px',
              border: '1px solid #bee3f8',
              background: '#ebf8ff',
              padding: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#2c5282' }}>
                  Firestore State
                </div>
                <div style={{ fontSize: '11px', color: '#718096' }}>+{formatDelta(firestoreState.at)}</div>
              </div>
              <div style={{ marginTop: '6px', fontSize: '11px', color: '#2d3748', wordBreak: 'break-word', fontFamily: 'monospace' }}>
                {firestoreState.message}
              </div>
            </div>
          )}

          {enableNetworkStatus && (
            <div style={{
              marginTop: '10px',
              borderRadius: '10px',
              border: enableNetworkStatus.ok ? '1px solid #c6f6d5' : '1px solid #fed7d7',
              background: enableNetworkStatus.ok ? '#f0fff4' : '#fff5f5',
              padding: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: enableNetworkStatus.ok ? '#22543d' : '#c53030' }}>
                  Network: {enableNetworkStatus.ok ? 'ENABLED' : 'FAILED'}
                </div>
                <div style={{ fontSize: '11px', color: '#718096' }}>+{formatDelta(enableNetworkStatus.at)}</div>
              </div>
              <div style={{ marginTop: '6px', fontSize: '11px', color: '#4a5568', wordBreak: 'break-word' }}>
                {enableNetworkStatus.message}
              </div>
            </div>
          )}

          {profileProbe && (
            <div style={{
              marginTop: '10px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              background: '#fff',
              padding: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: profileProbe.ok ? '#2f855a' : '#b7791f' }}>
                  Profile Probe: {profileProbe.ok ? 'OK' : 'NOT OK'}
                </div>
                <div style={{ fontSize: '11px', color: '#718096' }}>+{formatDelta(profileProbe.at)}</div>
              </div>
              <div style={{ marginTop: '6px', fontSize: '11px', color: '#4a5568', wordBreak: 'break-word' }}>
                {profileProbe.message}
              </div>
              {profileProbe.data && (
                <pre style={{
                  marginTop: '8px',
                  marginBottom: 0,
                  maxHeight: '140px',
                  overflow: 'auto',
                  fontSize: '11px',
                  background: '#f7fafc',
                  border: '1px solid #edf2f7',
                  borderRadius: '8px',
                  padding: '8px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {JSON.stringify(profileProbe.data, null, 2)}
                </pre>
              )}
            </div>
          )}

          {creditsProbe && (
            <div style={{
              marginTop: '10px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              background: '#fff',
              padding: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: creditsProbe.ok ? '#2f855a' : '#b7791f' }}>
                  Credits Probe: {creditsProbe.ok ? 'OK' : 'NOT OK'}
                </div>
                <div style={{ fontSize: '11px', color: '#718096' }}>+{formatDelta(creditsProbe.at)}</div>
              </div>
              <div style={{ marginTop: '6px', fontSize: '11px', color: '#4a5568', wordBreak: 'break-word' }}>
                {creditsProbe.message}
              </div>
              {creditsProbe.data && (
                <pre style={{
                  marginTop: '8px',
                  marginBottom: 0,
                  maxHeight: '140px',
                  overflow: 'auto',
                  fontSize: '11px',
                  background: '#f7fafc',
                  border: '1px solid #edf2f7',
                  borderRadius: '8px',
                  padding: '8px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {JSON.stringify(creditsProbe.data, null, 2)}
                </pre>
              )}
            </div>
          )}

          <div style={{
            marginTop: '10px',
            maxHeight: '180px',
            overflow: 'auto',
            paddingRight: '4px'
          }}>
            {diag.slice().reverse().map((e, idx) => {
              const color = e.level === 'error' ? '#c53030' : e.level === 'warn' ? '#b7791f' : '#2f855a';
              return (
                <div key={`${e.t}-${idx}`} style={{
                  display: 'flex',
                  gap: '10px',
                  padding: '6px 0',
                  borderBottom: idx === diag.length - 1 ? 'none' : '1px solid rgba(226,232,240,0.7)'
                }}>
                  <div style={{
                    width: '62px',
                    color: '#718096',
                    fontSize: '11px',
                    flexShrink: 0
                  }}>
                    +{formatDelta(e.t)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color }}>
                      {e.title}
                    </div>
                    {e.details && (
                      <div style={{ fontSize: '11px', color: '#4a5568', marginTop: '2px', wordBreak: 'break-word' }}>
                        {e.details}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{
          padding: '20px',
          background: status === 'authenticated' ? '#f0fff4' : '#fff5f5',
          borderRadius: '12px',
          marginBottom: '30px',
          border: `1px solid ${status === 'authenticated' ? '#c6f6d5' : '#fed7d7'}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#4a5568' }}>Status:</span>
            <strong style={{ 
              color: status === 'authenticated' ? '#2f855a' : 
                     status === 'loading' ? '#ed8936' : '#c53030' 
            }}>
              {status.toUpperCase()}
            </strong>
          </div>
          
          {user && (
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '14px', color: '#718096' }}>Current User:</div>
              <div style={{ fontWeight: 500, color: '#2d3748' }}>{user.email}</div>
              <div style={{ fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>UID: {user.uid}</div>
            </div>
          )}
        </div>

        {error && (
          <div style={{
            padding: '12px',
            background: '#fff5f5',
            color: '#c53030',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {status === 'authenticated' ? (
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '12px',
              background: '#e53e3e',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Sign Out
          </button>
        ) : (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#4a5568', marginBottom: '6px' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#4a5568', marginBottom: '6px' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: loading ? '#a0aec0' : '#4299e1',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                transition: 'background 0.2s'
              }}
            >

              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}
      </div>
      </div>
    </div>
  );
};



