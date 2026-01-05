import React from 'react';
import { GripVertical, Eye, EyeOff, Save } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { useLayoutStore } from '../../modules/homepage-v2/store/useLayoutStore';
import manifestJson from '../../modules/homepage-v2/config/layout-manifest.json';
import type { HomePageV2BlockKey, HomePageV2CardItem, HomePageV2LayoutManifest } from '../../modules/homepage-v2/types';

const manifest = manifestJson as unknown as HomePageV2LayoutManifest;

const PREVIEW_FLAG_KEY = 'khuyoot:homepage-v2:preview';
const PREVIEW_STATE_KEY = 'khuyoot:homepage-v2:previewState';

const LABELS: Record<HomePageV2BlockKey, string> = {
  blockA: 'Block A · Film Hub',
  blockB: 'Block B · AI Films',
  blockC: 'Block C · Magic & Effects',
  blockD: 'Block D · AI Faces',
  blockE: 'Block E · Cities & Scapes',
  blockF: 'Block F · Explore Features',
  dynamicHero: 'Dynamic Hero',
  actionCards: 'Action Cards',
  masonryDiscovery: 'Masonry Discovery Grid',
};

function makeStableId(prefix: string): string {
  try {
    // modern browsers
    const anyCrypto = crypto as unknown as { randomUUID?: () => string };
    if (typeof anyCrypto?.randomUUID === 'function') return `${prefix}-${anyCrypto.randomUUID()}`;
  } catch {
    // ignore
  }

  const now = Date.now().toString(36);
  const perf = (typeof performance !== 'undefined' ? performance.now() : 0).toString().replace('.', '');
  return `${prefix}-${now}-${perf}`;
}

function normalizeCardItems(items: unknown, idPrefix: string): HomePageV2CardItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter(Boolean)
    .map((raw: any) => {
      const id = typeof raw?.id === 'string' && raw.id.trim().length ? raw.id.trim() : makeStableId(idPrefix);
      const title = typeof raw?.title === 'string' ? raw.title : '';
      const href = typeof raw?.href === 'string' ? raw.href : '';
      const mediaUrl = typeof raw?.mediaUrl === 'string' ? raw.mediaUrl : '';
      const mediaType = raw?.mediaType === 'video' ? 'video' : 'image';
      const enabled = typeof raw?.enabled === 'boolean' ? raw.enabled : true;
      return { id, title, href, mediaType, mediaUrl, enabled } as HomePageV2CardItem;
    });
}

export const VisibilityToggle: React.FC = () => {
  const { appSettings, saveAppSettings } = useApp();

  const order = useLayoutStore((s) => s.order);
  const visibility = useLayoutStore((s) => s.visibility);
  const hero = useLayoutStore((s) => s.hero);
  const blockConfig = useLayoutStore((s) => s.blockConfig);
  const moveBlock = useLayoutStore((s) => s.moveBlock);
  const setVisible = useLayoutStore((s) => s.setVisible);
  const setHero = useLayoutStore((s) => s.setHero);
  const setBlockConfig = useLayoutStore((s) => s.setBlockConfig);
  const hydrateFromRemote = useLayoutStore((s) => s.hydrateFromRemote);

  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string>('');
  const lastHydratedLayoutRef = React.useRef<string | null>(null);

  // Live preview: while this admin panel is open, broadcast the current layout to other tabs.
  React.useEffect(() => {
    try {
      localStorage.setItem(PREVIEW_FLAG_KEY, '1');
    } catch {
      // ignore
    }
    return () => {
      try {
        localStorage.removeItem(PREVIEW_FLAG_KEY);
        localStorage.removeItem(PREVIEW_STATE_KEY);
      } catch {
        // ignore
      }
    };
  }, []);

  React.useEffect(() => {
    const handle = window.setTimeout(() => {
      try {
        localStorage.setItem(
          PREVIEW_STATE_KEY,
          JSON.stringify({
            manifestVersion: manifest.version,
            order,
            visibility,
            hero,
            blockConfig,
          })
        );
      } catch {
        // ignore
      }
    }, 60);

    return () => window.clearTimeout(handle);
  }, [order, visibility, hero, blockConfig]);

  React.useEffect(() => {
    const remoteLayout = (appSettings as any)?.homePageV2Layout ?? null;
    const serialized = remoteLayout ? JSON.stringify(remoteLayout) : 'null';
    if (lastHydratedLayoutRef.current === serialized) return;
    lastHydratedLayoutRef.current = serialized;
    hydrateFromRemote(remoteLayout);
  }, [appSettings, hydrateFromRemote]);

  const onSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await saveAppSettings(
        {
          ...(appSettings as any),
          homePageV2Layout: {
            manifestVersion: manifest.version,
            order,
            visibility,
            hero,
            blockConfig,
          },
        },
        { silent: true, optimistic: false }
      );
      setMessage('✅ Saved Homepage V2 layout');
      setTimeout(() => setMessage(''), 2500);
    } catch (e) {
      console.error('[Admin] Save homePageV2Layout failed', e);
      setMessage('❌ Failed to save');
      setTimeout(() => setMessage(''), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">Homepage 2.1 (Omani Boutique)</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Drag to reorder blocks, toggle visibility.</p>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition ${
            saving
              ? 'bg-slate-100 dark:bg-slate-900/40 text-slate-400 border-slate-200 dark:border-slate-700 cursor-wait'
              : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
          }`}
        >
          <Save size={16} />
          Save
        </button>
      </div>

      {message ? <div className="mt-3 text-xs text-slate-600 dark:text-slate-300">{message}</div> : null}

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden lg:col-span-2">
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 text-xs font-medium text-slate-600 dark:text-slate-300">Blocks</div>
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {order.map((key, idx) => {
              const enabled = visibility[key] !== false;
              const cfg = blockConfig[key];
              const label = LABELS[key] ?? manifest.blocks.find((b) => b.key === key)?.title ?? String(key);
              return (
                <div
                  key={key}
                  draggable
                  onDragStart={() => setDragIndex(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIndex === null) return;
                    moveBlock(dragIndex, idx);
                    setDragIndex(null);
                  }}
                  className="px-3 py-3 bg-white dark:bg-slate-800"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <GripVertical size={16} className="text-slate-400" />
                      <div className="text-sm text-slate-900 dark:text-white">{label}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setVisible(key, !enabled)}
                      className={`inline-flex items-center gap-2 px-2 py-1 rounded-md text-xs border transition ${
                        enabled
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                          : 'bg-slate-100 dark:bg-slate-900/40 text-slate-500 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {enabled ? <Eye size={14} /> : <EyeOff size={14} />}
                      {enabled ? 'Visible' : 'Hidden'}
                    </button>
                  </div>

                  {cfg ? (
                    <details className="mt-3 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                      <summary className="cursor-pointer select-none px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Settings
                      </summary>
                      <div className="p-3 space-y-3">
                        {key === 'dynamicHero' ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-300">
                            <label className="flex flex-col gap-1">
                              <span>Headline</span>
                              <input
                                value={cfg.headline ?? ''}
                                onChange={(e) => setBlockConfig(key, { headline: e.target.value })}
                                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                              />
                            </label>
                            <label className="flex flex-col gap-1 md:col-span-2">
                              <span>Subheadline</span>
                              <input
                                value={cfg.subheadline ?? ''}
                                onChange={(e) => setBlockConfig(key, { subheadline: e.target.value })}
                                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                              />
                            </label>

                            <label className="flex flex-col gap-1">
                              <span>Primary Button</span>
                              <input
                                value={cfg.primaryCtaText ?? ''}
                                onChange={(e) => setBlockConfig(key, { primaryCtaText: e.target.value })}
                                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                              />
                            </label>
                            <label className="flex flex-col gap-1">
                              <span>Secondary Button</span>
                              <input
                                value={cfg.secondaryCtaText ?? ''}
                                onChange={(e) => setBlockConfig(key, { secondaryCtaText: e.target.value })}
                                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                              />
                            </label>
                            <label className="flex flex-col gap-1">
                              <span>Height (px)</span>
                              <input
                                type="number"
                                value={cfg.heroHeightPx ?? 520}
                                min={240}
                                max={1200}
                                onChange={(e) => setBlockConfig(key, { heroHeightPx: Number(e.target.value) })}
                                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                              />
                            </label>

                            <label className="flex flex-col gap-1">
                              <span>Media Type</span>
                              <select
                                value={cfg.mediaType ?? 'image'}
                                onChange={(e) => setBlockConfig(key, { mediaType: e.target.value as any })}
                                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                              >
                                <option value="image">Image</option>
                                <option value="video">Video</option>
                              </select>
                            </label>
                            <label className="flex flex-col gap-1 md:col-span-2">
                              <span>Media URL</span>
                              <input
                                value={cfg.mediaUrl ?? ''}
                                onChange={(e) => setBlockConfig(key, { mediaUrl: e.target.value })}
                                placeholder="https://..."
                                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                              />
                            </label>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs text-slate-600 dark:text-slate-300">
                            <label className="flex flex-col gap-1">
                              <span>Title</span>
                              <input
                                value={cfg.title ?? ''}
                                onChange={(e) => setBlockConfig(key, { title: e.target.value })}
                                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                              />
                            </label>
                            <label className="flex flex-col gap-1">
                              <span>Max Columns</span>
                              <input
                                type="number"
                                value={cfg.maxColumns ?? 1}
                                min={1}
                                max={12}
                                onChange={(e) => setBlockConfig(key, { maxColumns: Number(e.target.value) })}
                                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                              />
                            </label>
                            <label className="flex flex-col gap-1">
                              <span>Max Rows</span>
                              <input
                                type="number"
                                value={cfg.maxRows ?? 1}
                                min={1}
                                max={6}
                                onChange={(e) => setBlockConfig(key, { maxRows: Number(e.target.value) })}
                                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                              />
                            </label>
                            <label className="flex flex-col gap-1">
                              <span>Card Width</span>
                              <input
                                type="number"
                                value={cfg.cardWidth ?? 180}
                                min={80}
                                max={400}
                                onChange={(e) => setBlockConfig(key, { cardWidth: Number(e.target.value) })}
                                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                              />
                            </label>
                            <label className="flex flex-col gap-1">
                              <span>Card Height</span>
                              <input
                                type="number"
                                value={cfg.cardHeight ?? 110}
                                min={40}
                                max={400}
                                onChange={(e) => setBlockConfig(key, { cardHeight: Number(e.target.value) })}
                                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                              />
                            </label>
                            <label className="flex flex-col gap-1">
                              <span>Card Gap (px)</span>
                              <input
                                type="number"
                                value={cfg.cardGapPx ?? 12}
                                min={0}
                                max={64}
                                onChange={(e) => setBlockConfig(key, { cardGapPx: Number(e.target.value) })}
                                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                              />
                            </label>
                            <label className="flex flex-col gap-1">
                              <span>Card Radius (px)</span>
                              <input
                                type="number"
                                value={cfg.cardRadiusPx ?? 12}
                                min={0}
                                max={9999}
                                onChange={(e) => setBlockConfig(key, { cardRadiusPx: Number(e.target.value) })}
                                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                              />
                            </label>
                          </div>
                        )}

                        {key === 'blockB' ? (
                          <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 space-y-3">
                            <label className="flex flex-col gap-1">
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Explore All Tools Link</span>
                              <input
                                value={(cfg as any)?.exploreAllToolsHref ?? '/designer-v2-1'}
                                onChange={(e) => setBlockConfig(key, { exploreAllToolsHref: e.target.value })}
                                placeholder="/designer-v2-1"
                                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                              />
                            </label>

                            {(() => {
                              const items = normalizeCardItems((cfg as any).items, 'blockB');

                              const updateItem = (id: string, patch: Partial<HomePageV2CardItem>) => {
                                const next = normalizeCardItems((cfg as any).items, 'blockB').map((it) => (it.id === id ? { ...it, ...patch } : it));
                                setBlockConfig(key, { items: next } as any);
                              };

                              const removeItem = (id: string) => {
                                const next = normalizeCardItems((cfg as any).items, 'blockB').filter((it) => it.id !== id);
                                setBlockConfig(key, { items: next } as any);
                              };

                              const addItem = () => {
                                const next = normalizeCardItems((cfg as any).items, 'blockB');
                                next.push({
                                  id: makeStableId('blockB'),
                                  title: '',
                                  href: '',
                                  mediaType: 'image',
                                  mediaUrl: '',
                                });
                                setBlockConfig(key, { items: next } as any);
                              };

                              return (
                                <>
                                  <div className="flex items-center justify-between gap-2">
                                    <div>
                                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">Cards</div>
                                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Each card: media (image/video), title, link</div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={addItem}
                                      className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                      + Add card
                                    </button>
                                  </div>

                                  {items.length === 0 ? <div className="text-xs text-slate-500 dark:text-slate-400">No cards yet.</div> : null}

                                  <div className="space-y-3">
                                    {items.map((it) => (
                                      <div key={it.id} className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3">
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                                            {it.title?.trim() ? it.title : 'Untitled card'}
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => removeItem(it.id)}
                                            className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                          >
                                            Remove
                                          </button>
                                        </div>

                                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                                          <label className="flex flex-col gap-1">
                                            <span className="text-[11px] text-slate-500 dark:text-slate-400">Title</span>
                                            <input
                                              value={it.title}
                                              onChange={(e) => updateItem(it.id, { title: e.target.value })}
                                              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                            />
                                          </label>

                                          <label className="flex flex-col gap-1">
                                            <span className="text-[11px] text-slate-500 dark:text-slate-400">Link</span>
                                            <input
                                              value={it.href}
                                              onChange={(e) => updateItem(it.id, { href: e.target.value })}
                                              placeholder="/path or https://..."
                                              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                            />
                                          </label>

                                          <label className="flex flex-col gap-1">
                                            <span className="text-[11px] text-slate-500 dark:text-slate-400">Media Type</span>
                                            <select
                                              value={it.mediaType}
                                              onChange={(e) => updateItem(it.id, { mediaType: e.target.value === 'video' ? 'video' : 'image' })}
                                              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                            >
                                              <option value="image">Image</option>
                                              <option value="video">Video</option>
                                            </select>
                                          </label>

                                          <label className="flex flex-col gap-1 lg:col-span-4">
                                            <span className="text-[11px] text-slate-500 dark:text-slate-400">Media URL</span>
                                            <input
                                              value={it.mediaUrl}
                                              onChange={(e) => updateItem(it.id, { mediaUrl: e.target.value })}
                                              placeholder="https://..."
                                              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                            />
                                          </label>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        ) : null}

                        {key === 'actionCards' ? (
                          <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 space-y-3">
                            {(() => {
                              const items = normalizeCardItems((cfg as any).items, 'actionCards');

                              const updateItem = (id: string, patch: Partial<HomePageV2CardItem>) => {
                                const next = normalizeCardItems((cfg as any).items, 'actionCards').map((it) =>
                                  it.id === id ? { ...it, ...patch } : it
                                );
                                setBlockConfig(key, { items: next } as any);
                              };

                              const removeItem = (id: string) => {
                                const next = normalizeCardItems((cfg as any).items, 'actionCards').filter((it) => it.id !== id);
                                setBlockConfig(key, { items: next } as any);
                              };

                              const addItem = () => {
                                const next = normalizeCardItems((cfg as any).items, 'actionCards');
                                next.push({
                                  id: makeStableId('actionCards'),
                                  title: '',
                                  href: '',
                                  mediaType: 'image',
                                  mediaUrl: '',
                                  enabled: true,
                                });
                                setBlockConfig(key, { items: next } as any);
                              };

                              return (
                                <>
                                  <div className="flex items-center justify-between gap-2">
                                    <div>
                                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">Cards</div>
                                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Each card: media (image/video), title, link</div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={addItem}
                                      className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                      + Add card
                                    </button>
                                  </div>

                                  {items.length === 0 ? <div className="text-xs text-slate-500 dark:text-slate-400">No cards yet.</div> : null}

                                  <div className="space-y-3">
                                    {items.map((it) => (
                                      <div key={it.id} className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3">
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-2">
                                            <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                              <input
                                                type="checkbox"
                                                checked={it.enabled !== false}
                                                onChange={(e) => updateItem(it.id, { enabled: e.target.checked })}
                                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
                                              />
                                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                                                {it.title?.trim() ? it.title : 'Untitled card'}
                                              </span>
                                            </label>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => removeItem(it.id)}
                                            className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                          >
                                            Remove
                                          </button>
                                        </div>

                                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                                          <label className="flex flex-col gap-1">
                                            <span className="text-[11px] text-slate-500 dark:text-slate-400">Title</span>
                                            <input
                                              value={it.title}
                                              onChange={(e) => updateItem(it.id, { title: e.target.value })}
                                              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                            />
                                          </label>

                                          <label className="flex flex-col gap-1">
                                            <span className="text-[11px] text-slate-500 dark:text-slate-400">Link</span>
                                            <input
                                              value={it.href}
                                              onChange={(e) => updateItem(it.id, { href: e.target.value })}
                                              placeholder="/path or https://..."
                                              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                            />
                                          </label>

                                          <label className="flex flex-col gap-1">
                                            <span className="text-[11px] text-slate-500 dark:text-slate-400">Media Type</span>
                                            <select
                                              value={it.mediaType}
                                              onChange={(e) => updateItem(it.id, { mediaType: e.target.value === 'video' ? 'video' : 'image' })}
                                              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                            >
                                              <option value="image">Image</option>
                                              <option value="video">Video</option>
                                            </select>
                                          </label>

                                          <label className="flex flex-col gap-1 lg:col-span-4">
                                            <span className="text-[11px] text-slate-500 dark:text-slate-400">Media URL</span>
                                            <input
                                              value={it.mediaUrl}
                                              onChange={(e) => updateItem(it.id, { mediaUrl: e.target.value })}
                                              placeholder="https://..."
                                              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                            />
                                          </label>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        ) : null}
                      </div>
                    </details>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 text-xs font-medium text-slate-600 dark:text-slate-300">Hero Media</div>
          <div className="p-3 space-y-3">
            <div className="flex items-center gap-3">
              <label className="text-xs text-slate-600 dark:text-slate-300 w-24">Type</label>
              <select
                value={hero.mediaType}
                onChange={(e) => setHero({ mediaType: e.target.value as any })}
                className="flex-1 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs text-slate-600 dark:text-slate-300 w-24">URL</label>
              <input
                value={hero.mediaUrl}
                onChange={(e) => setHero({ mediaUrl: e.target.value })}
                placeholder="https://..."
                className="flex-1 px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              />
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Videos are only mounted when the section is within 500px of viewport.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
