type TraceEvent = {
  t: number;
  name: string;
  data?: Record<string, unknown>;
};

type TraceSession = {
  id: string;
  label: string;
  startedAt: number;
  events: TraceEvent[];
};

declare global {
  interface Window {
    __khuyootTraceSessions?: Record<string, TraceSession>;
    __khuyootTraceActiveId?: string;
  }
}

function now(): number {
  return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
}

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `trace-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}

function isEnabled(): boolean {
  try {
    // Enable by default in dev; can be forced in prod via localStorage flag.
    const forced = typeof localStorage !== 'undefined' && localStorage.getItem('khuyoot_trace') === '1';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV;
    return Boolean(isDev || forced);
  } catch {
    return false;
  }
}

function getStore(): Record<string, TraceSession> {
  if (!window.__khuyootTraceSessions) window.__khuyootTraceSessions = {};
  return window.__khuyootTraceSessions;
}

export function traceStart(label: string, data?: Record<string, unknown>): string {
  if (!isEnabled()) return '';

  const id = newId();
  const t0 = now();
  const session: TraceSession = {
    id,
    label,
    startedAt: t0,
    events: [],
  };
  getStore()[id] = session;
  window.__khuyootTraceActiveId = id;

  traceStep(id, 'START', data);
  console.groupCollapsed(`[TRACE ${id}] ${label}`);
  console.log('START', data || {});
  console.groupEnd();

  return id;
}

export function traceStep(idOrName: string, nameMaybe?: string | Record<string, unknown>, data?: Record<string, unknown>): void {
  if (!isEnabled()) return;

  const store = getStore();
  const activeId = window.__khuyootTraceActiveId;

  const hasExplicitId = typeof nameMaybe === 'string';
  const id = hasExplicitId ? idOrName : (activeId || '');
  const name = hasExplicitId ? (nameMaybe as string) : idOrName;
  const payload = hasExplicitId ? data : (nameMaybe as any);

  if (!id || !store[id]) return;

  const t = now();
  store[id].events.push({ t, name, data: payload });

  const dt = (t - store[id].startedAt).toFixed(1);
  // Keep console noise readable: one concise line per step.
  // eslint-disable-next-line no-console
  console.log(`[TRACE +${dt}ms] ${name}`, payload || '');
}

export function traceEnd(id?: string, data?: Record<string, unknown>): void {
  if (!isEnabled()) return;

  const store = getStore();
  const activeId = window.__khuyootTraceActiveId;
  const finalId = id || activeId || '';
  if (!finalId || !store[finalId]) return;

  traceStep(finalId, 'END', data);

  const session = store[finalId];
  const total = (now() - session.startedAt).toFixed(1);
  console.groupCollapsed(`[TRACE ${finalId}] END (${total}ms) ${session.label}`);
  console.table(
    session.events.map((e) => ({
      ms: (e.t - session.startedAt).toFixed(1),
      step: e.name,
      data: e.data ? JSON.stringify(e.data) : '',
    }))
  );
  console.groupEnd();

  if (window.__khuyootTraceActiveId === finalId) {
    window.__khuyootTraceActiveId = '';
  }
}

export function traceSetActive(id: string): void {
  if (!isEnabled()) return;
  if (!id) return;
  window.__khuyootTraceActiveId = id;
}
