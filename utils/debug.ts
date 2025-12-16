export function getQueryParam(name: string): string | null {
  // Works for both standard search and hash-based routers (#/route?debug=1)
  const fromSearch = new URLSearchParams(window.location.search).get(name);
  if (fromSearch) return fromSearch;
  const hash = window.location.hash || '';
  const qIndex = hash.indexOf('?');
  if (qIndex >= 0) {
    const qs = hash.substring(qIndex + 1);
    return new URLSearchParams(qs).get(name);
  }
  return null;
}

export function isDebugEnabled(explicit?: boolean): boolean {
  if (explicit === true) return true;
  try {
    if (typeof window !== 'undefined') {
      // URL gate: #/route?debug=1 or ?debug=1
      const qp = getQueryParam('debug');
      if (qp === '1' || qp === 'true') return true;

      // Storage gates
      if (localStorage.getItem('kh_showDebug') === '1') return true;
      if (sessionStorage.getItem('kh_showDebug') === '1') return true;

      // Global flag gate (can be toggled by admin panel in future)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w: any = window as any;
      if (w.__KH_DEBUG__ === true) return true;
    }

    // Env gate
    // Vite-style envs available at build time
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SHOW_DEBUG === '1') {
      return true;
    }
  } catch {
    // ignore any access errors
  }
  return false;
}

export function enableDebug(flag = true) {
  try {
    if (flag) localStorage.setItem('kh_showDebug', '1');
    else localStorage.removeItem('kh_showDebug');
  } catch {}
}

export function disableDebug() {
  try {
    localStorage.removeItem('kh_showDebug');
  } catch {}
}
