import { useEffect, useState } from 'react';

/**
 * Simple hook that just waits a moment before allowing Firestore reads.
 * 
 * The problem: Firestore with persistence enabled blocks reads during IndexedDB sync.
 * The solution: Just always wait immediately - this is fast on fresh login, 
 * and prevents the blocking issue on page refresh.
 */
export function useFirestoreSyncReady() {
  const [isSyncReady, setIsSyncReady] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Just wait 100ms to let Firestore initialize
    // This is long enough for the sync to start, which unblocks reads
    const timer = setTimeout(() => {
      if (isMounted) {
        console.log('[Firestore] Ready for reads');
        setIsSyncReady(true);
        setSyncError(null);
      }
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  return { isSyncReady, syncError };
}
