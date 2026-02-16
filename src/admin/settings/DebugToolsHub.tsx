import * as React from 'react';
import { ExternalLink, Link as LinkIcon, ShieldAlert, RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

type ToolItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  kind: 'route' | 'static' | 'doc' | 'external';
  devOnly?: boolean;
  badge?: string;
  extraLinks?: Array<{ label: string; href: string }>;
};

type LinkCheckState =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'ok'; status: number }
  | { state: 'error'; message: string };

const ToolCard = React.memo(function ToolCard(props: {
  item: ToolItem;
  check: LinkCheckState | undefined;
}) {
  const { item, check } = props;

  const badge = item.badge || (item.devOnly ? 'DEV' : undefined);

  return (
    <div className="rounded-2xl border-[1.5px] border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white truncate">{item.title}</h3>
            {badge ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-100">
                {badge}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{item.description}</p>
        </div>

        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 transition-colors"
          title={item.href}
        >
          <ExternalLink size={14} />
          فتح
        </a>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/30 px-3 py-2 text-[11px] text-zinc-600 dark:text-zinc-300 max-w-full">
          <LinkIcon size={14} className="text-zinc-400" />
          <span className="truncate" dir="ltr">{item.href}</span>
        </div>

        {check?.state === 'checking' ? (
          <div className="inline-flex items-center gap-2 text-xs text-zinc-400">
            <Loader2 size={14} className="animate-spin" />
            Checking…
          </div>
        ) : check?.state === 'ok' ? (
          <div className="inline-flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 size={14} />
            OK ({check.status})
          </div>
        ) : check?.state === 'error' ? (
          <div className="inline-flex items-center gap-2 text-xs text-red-600 dark:text-red-300">
            <XCircle size={14} />
            {check.message}
          </div>
        ) : null}
      </div>

      {item.extraLinks?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.extraLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/20 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/40 transition-colors"
            >
              <ExternalLink size={14} />
              {l.label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
});

function withOrigin(path: string): string {
  const safe = String(path || '').trim();
  if (!safe) return '/';
  if (/^https?:\/\//i.test(safe)) return safe;
  if (safe.startsWith('/')) return safe;
  return `/${safe}`;
}

async function headCheck(url: string, timeoutMs: number): Promise<number> {
  const controller = new AbortController();
  const id = window.setTimeout(() => controller.abort(), Math.max(100, timeoutMs));
  try {
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    return res.status;
  } finally {
    window.clearTimeout(id);
  }
}

export function DebugToolsHub() {
  const isDev = Boolean((import.meta as any)?.env?.DEV);

  const items = React.useMemo<ReadonlyArray<ToolItem>>(
    () => [
      {
        id: 'firebase-auth-diagnostic',
        title: 'Firebase Auth Diagnostic',
        description: 'Standalone page to test Firebase Auth + persistence modes and network instrumentation.',
        href: withOrigin('/firebase-auth-diagnostic.html'),
        kind: 'static',
        extraLinks: [
          { label: 'p=memory', href: withOrigin('/firebase-auth-diagnostic.html?p=memory') },
          { label: 'p=session', href: withOrigin('/firebase-auth-diagnostic.html?p=session') },
          { label: 'p=local', href: withOrigin('/firebase-auth-diagnostic.html?p=local') },
        ],
      },
      {
        id: 'firebase-test',
        title: 'Firebase Test (Legacy)',
        description: 'Basic Firebase test page (older diagnostic).',
        href: withOrigin('/firebase-test.html'),
        kind: 'static',
      },
      {
        id: 'regions-test',
        title: 'Regions Test',
        description: 'Test page for Regions CRUD/queries.',
        href: withOrigin('/test-regions.html'),
        kind: 'static',
      },
      {
        id: 'regions-add',
        title: 'Add Test Regions',
        description: 'Seeds test region documents (admin/dev helper).',
        href: withOrigin('/add-test-regions.html'),
        kind: 'static',
      },
      {
        id: 'clear-sw',
        title: 'Clear Service Worker',
        description: 'Utility to unregister SW + clear caches (helps with “stale build” bugs).',
        href: withOrigin('/clear-sw.html'),
        kind: 'static',
      },
      {
        id: 'visualizer',
        title: '3D Visualizer',
        description: 'In-app Visualizer UI.',
        href: withOrigin('/visualizer'),
        kind: 'route',
      },
      {
        id: 'designer-v2-1',
        title: 'Designer V2.1',
        description: 'AI-powered design generation interface with fabric selection and lighting controls.',
        href: withOrigin('/designer-v2-1'),
        kind: 'route',
      },
      {
        id: 'tryon',
        title: 'Try-On (Designer V2.1 Fork)',
        description: 'Virtual try-on experience - forked from Designer V2.1.',
        href: withOrigin('/tryon'),
        kind: 'route',
        badge: 'NEW',
      },
      {
        id: 'video-lab',
        title: 'Video Producer (Video Lab)',
        description: 'Dev page to generate MP4 via local Python server (MoviePy).',
        href: withOrigin('/__dev/video-lab'),
        kind: 'route',
        devOnly: true,
      },
      {
        id: 'nav-debug',
        title: 'Nav Debug',
        description: 'Dev navigation debug routes.',
        href: withOrigin('/__dev/nav-debug'),
        kind: 'route',
        devOnly: true,
      },
      {
        id: 'whatsapp-sandbox',
        title: 'WhatsApp Sandbox',
        description: 'Dev sandbox panel for WhatsApp integration.',
        href: withOrigin('/__dev/whatsapp-sandbox'),
        kind: 'route',
        devOnly: true,
      },
      {
        id: 'test-template-picker',
        title: 'Test Template Picker',
        description: 'Standalone test route for template selection UI.',
        href: withOrigin('/test-template-picker'),
        kind: 'route',
      },
      {
        id: 'jank-sandbox',
        title: 'Jank Sandbox',
        description: 'Performance sandbox route (no client layout).',
        href: withOrigin('/jank-sandbox'),
        kind: 'route',
      },
      {
        id: 'pdf-test',
        title: 'PDF Studio Test',
        description: 'Testing HTML-to-PDF conversion, page breaks, and live blob preview.',
        href: withOrigin('/pdf-test'),
        kind: 'route',
        badge: 'NEW',
      },
      {
        id: 'auth-test',
        title: 'Auth Speed Test (Login)',
        description: 'Diagnostic page for authentication speed and token persistence.',
        href: withOrigin('/auth-test'),
        kind: 'route',
      },
      {
        id: 'issues-fixes-doc',
        title: 'ISSUES_AND_FIXES.md',
        description: 'Central incident log (Auth, SecureToken 403, IndexedDB hangs, etc.).',
        href: withOrigin('/ISSUES_AND_FIXES.md'),
        kind: 'doc',
      },
      {
        id: 'black-screen-report',
        title: 'BLACK_SCREEN_DIAGNOSTIC_REPORT.md',
        description: 'Black screen investigation report + remediation notes.',
        href: withOrigin('/BLACK_SCREEN_DIAGNOSTIC_REPORT.md'),
        kind: 'doc',
      },
      {
        id: 'image-loading-fix',
        title: 'IMAGE_LOADING_FIX.md',
        description: 'Image loading / layout shift fixes and guidance.',
        href: withOrigin('/IMAGE_LOADING_FIX.md'),
        kind: 'doc',
      },
      {
        id: 'notifications-troubleshooting',
        title: 'NOTIFICATIONS_TROUBLESHOOTING.md',
        description: 'Notifications troubleshooting guide.',
        href: withOrigin('/NOTIFICATIONS_TROUBLESHOOTING.md'),
        kind: 'doc',
      },
      {
        id: 'firebase-cors',
        title: 'FIREBASE_CORS_SETUP.md',
        description: 'Firebase CORS setup notes (Storage, etc.).',
        href: withOrigin('/FIREBASE_CORS_SETUP.md'),
        kind: 'doc',
      },
    ],
    []
  );

  const [query, setQuery] = React.useState('');
  const normalizedQuery = query.trim().toLowerCase();

  const visibleItems = React.useMemo(() => {
    const base = items.filter((it) => {
      if (!isDev && it.devOnly) return false;
      if (!normalizedQuery) return true;
      return (
        it.title.toLowerCase().includes(normalizedQuery) ||
        it.description.toLowerCase().includes(normalizedQuery) ||
        it.href.toLowerCase().includes(normalizedQuery)
      );
    });

    // stable ordering
    return base;
  }, [items, isDev, normalizedQuery]);

  const [checks, setChecks] = React.useState<Record<string, LinkCheckState>>({});

  const runChecks = React.useCallback(async () => {
    const next: Record<string, LinkCheckState> = {};
    for (const it of visibleItems) next[it.id] = { state: 'checking' };
    setChecks((prev) => ({ ...prev, ...next }));

    await Promise.all(
      visibleItems.map(async (it) => {
        try {
          const status = await headCheck(it.href, 3500);
          setChecks((prev) => ({ ...prev, [it.id]: { state: 'ok', status } }));
        } catch (e: any) {
          const msg = e?.name === 'AbortError' ? 'timeout' : (e?.message || 'error');
          setChecks((prev) => ({ ...prev, [it.id]: { state: 'error', message: msg } }));
        }
      })
    );
  }, [visibleItems]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl border-[1.5px] border-black/10 dark:border-white/10 p-6 shadow-sm space-y-5" dir="rtl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white">أدوات التصحيح والتشخيص</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            صفحة واحدة تجمع كل صفحات الاختبار والتشخيص والوثائق لتسهيل الوصول أثناء الدعم.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isDev ? (
            <div className="inline-flex items-center gap-2 rounded-xl border border-amber-300/60 bg-amber-100 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              <ShieldAlert size={16} />
              بعض الأدوات تظهر فقط في DEV
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => void runChecks()}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 transition-colors"
          >
            <RefreshCw size={14} />
            Check links
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن أداة أو ملف…"
          className="w-full md:w-96 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
        />
        <div className="text-xs text-zinc-600 dark:text-zinc-400">{visibleItems.length} links</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleItems.map((it) => (
          <ToolCard key={it.id} item={it} check={checks[it.id]} />
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/40 p-4 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
        <div className="font-bold text-zinc-900 dark:text-zinc-200 mb-2">ملاحظات سريعة</div>
        <ul className="space-y-1">
          <li>• صفحات HTML (مثل Firebase Auth Diagnostic) تُفتح في تبويب جديد.</li>
          <li>• Video Lab يحتاج تشغيل Python server: <span dir="ltr">tools/video_lab/server.py</span></li>
          <li>• إذا كان Auth “stuck initializing”، جرّب <span dir="ltr">p=memory</span> أو <span dir="ltr">p=session</span>.</li>
        </ul>
      </div>
    </div>
  );
}
