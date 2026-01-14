import React from 'react';
import { GripVertical, Eye, EyeOff, Save } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { useLayoutStore } from '../../modules/homepage-v2/store/useLayoutStore';
import manifestJson from '../../modules/homepage-v2/config/layout-manifest.json';
import type { HomePageV2BlockKey, HomePageV2CardItem, HomePageV2LayoutManifest } from '../../modules/homepage-v2/types';
import { uploadSettingsImage, uploadSettingsVideo } from '../../../services/storageService';

const manifest = manifestJson as unknown as HomePageV2LayoutManifest;

const PREVIEW_FLAG_KEY = 'khuyoot:homepage-v2:preview';
const PREVIEW_STATE_KEY = 'khuyoot:homepage-v2:previewState';

const LABELS: Record<HomePageV2BlockKey, string> = {
  blockA: 'Block A · Film Hub',
  blockB: 'Block B · AI Films',
  blockC: 'Block C · Magic & Effects',
  blockD: 'Block D · AI Faces',
  blockE: 'Block E · Cities & Scapes',
  blockF: 'Block F · Terms & Privacy',
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

  const heroMediaInputRef = React.useRef<HTMLInputElement | null>(null);
  const [heroUploadBusy, setHeroUploadBusy] = React.useState(false);
  const [heroUploadMessage, setHeroUploadMessage] = React.useState<string>('');

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

  const uploadHeroMedia = async (file: File, currentMediaType: 'image' | 'video') => {
    if (!file) return;
    if (heroUploadBusy) return;

    setHeroUploadBusy(true);
    setHeroUploadMessage('Uploading...');

    try {
      const inferredType: 'image' | 'video' = file.type?.startsWith('video/')
        ? 'video'
        : file.type?.startsWith('image/')
          ? 'image'
          : currentMediaType;

      if (inferredType === 'image') {
        const res = await uploadSettingsImage(file, 'homepage-v2/dynamicHero');
        setBlockConfig('dynamicHero', { mediaType: 'image', mediaUrl: res.full, updatedAt: Date.now() });
      } else {
        const url = await uploadSettingsVideo(file, 'homepage-v2/dynamicHero');
        setBlockConfig('dynamicHero', { mediaType: 'video', mediaUrl: url, updatedAt: Date.now() });
      }

      setHeroUploadMessage('✅ Uploaded and applied');
      window.setTimeout(() => setHeroUploadMessage(''), 2500);
    } catch (e) {
      console.error('[Admin] DynamicHero media upload failed', e);
      setHeroUploadMessage('❌ Upload failed');
      window.setTimeout(() => setHeroUploadMessage(''), 2500);
    } finally {
      setHeroUploadBusy(false);
      try {
        if (heroMediaInputRef.current) heroMediaInputRef.current.value = '';
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="mt-3 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white">Homepage 2.1 Layout</h3>
          <p className="text-xs text-slate-400 mt-0.5">Drag to reorder blocks, toggle visibility.</p>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 ${
            saving
              ? 'bg-slate-800 text-slate-500 border-white/5 cursor-wait'
              : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20 active:scale-95'
          }`}
        >
          <Save size={14} />
          Save
        </button>
      </div>

      {message ? <div className="mt-2 p-2 rounded-lg bg-white/5 border border-white/10 text-xs text-blue-400 animate-in fade-in slide-in-from-top-2">{message}</div> : null}

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="rounded-xl border border-white/10 overflow-hidden lg:col-span-2 bg-slate-900/20">
          <div className="px-3 py-2 bg-white/5 border-b border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-400">Blocks</div>
          <div className="divide-y divide-white/10">
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
                  className="px-3 py-2 bg-transparent hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <GripVertical size={14} className="text-slate-600 group-hover:text-slate-400 cursor-grab active:cursor-grabbing" />
                      <div className="text-sm font-medium text-white">{label}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setVisible(key, !enabled)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border transition-all duration-300 ${
                        enabled
                          ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                          : 'bg-slate-800 text-slate-500 border-white/5 hover:bg-slate-700'
                      }`}
                    >
                      {enabled ? <Eye size={12} /> : <EyeOff size={12} />}
                      {enabled ? 'Visible' : 'Hidden'}
                    </button>
                  </div>

                  {cfg ? (
                    <details className="mt-2 rounded-lg border border-white/10 bg-white/5 overflow-hidden">
                      <summary className="cursor-pointer select-none px-3 py-1.5 text-[10px] font-bold text-slate-300 hover:bg-white/5 transition-colors">
                        Settings
                      </summary>
                      <div className="p-3 space-y-2">
                        {key === 'dynamicHero' ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-slate-400">
                            <label className="flex flex-col gap-1">
                              <span className="font-medium text-[10px]">Headline</span>
                              <input
                                value={cfg.headline ?? ''}
                                onChange={(e) => setBlockConfig(key, { headline: e.target.value })}
                                className="px-2 py-1 rounded-md border border-white/10 bg-slate-900/50 text-white text-xs focus:border-blue-500 outline-none transition-colors"
                              />
                            </label>
                            <label className="flex flex-col gap-1 md:col-span-2">
                              <span className="font-medium text-[10px]">Subheadline</span>
                              <input
                                value={cfg.subheadline ?? ''}
                                onChange={(e) => setBlockConfig(key, { subheadline: e.target.value })}
                                className="px-2 py-1 rounded-md border border-white/10 bg-slate-900/50 text-white text-xs focus:border-blue-500 outline-none transition-colors"
                              />
                            </label>

                            <label className="flex flex-col gap-1">
                              <span className="font-medium text-[10px]">Primary Button</span>
                              <input
                                value={cfg.primaryCtaText ?? ''}
                                onChange={(e) => setBlockConfig(key, { primaryCtaText: e.target.value })}
                                className="px-2 py-1 rounded-md border border-white/10 bg-slate-900/50 text-white text-xs focus:border-blue-500 outline-none transition-colors"
                              />
                            </label>
                            <label className="flex flex-col gap-1">
                              <span className="font-medium text-[10px]">Secondary Button</span>
                              <input
                                value={cfg.secondaryCtaText ?? ''}
                                onChange={(e) => setBlockConfig(key, { secondaryCtaText: e.target.value })}
                                className="px-2 py-1 rounded-md border border-white/10 bg-slate-900/50 text-white text-xs focus:border-blue-500 outline-none transition-colors"
                              />
                            </label>
                            <label className="flex flex-col gap-1">
                              <span className="font-medium text-[10px]">Height (px)</span>
                              <input
                                type="number"
                                value={cfg.heroHeightPx ?? 520}
                                min={240}
                                max={1200}
                                onChange={(e) => setBlockConfig(key, { heroHeightPx: Number(e.target.value) })}
                                className="px-2 py-1 rounded-md border border-white/10 bg-slate-900/50 text-white text-xs focus:border-blue-500 outline-none transition-colors"
                              />
                            </label>

                            <label className="flex flex-col gap-1">
                              <span className="font-medium text-[10px]">Media Type</span>
                              <select
                                value={cfg.mediaType ?? 'image'}
                                onChange={(e) => setBlockConfig(key, { mediaType: e.target.value as any })}
                                className="px-2 py-1 rounded-md border border-white/10 bg-slate-900/50 text-white text-xs focus:border-blue-500 outline-none transition-colors"
                              >
                                <option value="image">Image</option>
                                <option value="video">Video</option>
                              </select>
                            </label>
                            <label className="flex flex-col gap-1 md:col-span-2">
                              <span className="font-medium text-[10px]">Media URL</span>
                              <input
                                value={cfg.mediaUrl ?? ''}
                                onChange={(e) => setBlockConfig(key, { mediaUrl: e.target.value })}
                                placeholder="https://..."
                                className="px-2 py-1 rounded-md border border-white/10 bg-slate-900/50 text-white text-xs focus:border-blue-500 outline-none transition-colors"
                              />
                            </label>

                            <div className="md:col-span-2 lg:col-span-3 rounded-lg border border-white/10 bg-slate-900/30 p-2">
                              {/* Current media preview */}
                              {cfg.mediaUrl && (
                                <div className="mb-2 rounded-md overflow-hidden border border-white/10">
                                  {cfg.mediaType === 'video' ? (
                                    <video
                                      src={cfg.mediaUrl}
                                      className="w-full h-20 object-cover"
                                      muted
                                      playsInline
                                      loop
                                      autoPlay
                                    />
                                  ) : (
                                    <img
                                      src={cfg.mediaUrl}
                                      alt="Hero preview"
                                      className="w-full h-20 object-cover"
                                    />
                                  )}
                                  <div className="px-2 py-1 bg-black/50 text-[9px] text-slate-300 truncate">
                                    {cfg.mediaUrl}
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <div className="text-[10px] font-bold text-slate-200">Upload Media</div>
                                  <div className="text-[9px] text-slate-400 mt-0.5">
                                    Upload an {cfg.mediaType === 'video' ? 'MP4/WebM video' : 'image'} and we will fill the URL automatically.
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  disabled={heroUploadBusy}
                                  onClick={() => heroMediaInputRef.current?.click()}
                                  className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all duration-200 active:scale-95 ${
                                    heroUploadBusy
                                      ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-wait'
                                      : 'bg-blue-600 text-white hover:bg-blue-500'
                                  }`}
                                >
                                  {heroUploadBusy ? 'Uploading...' : 'Choose File'}
                                </button>
                              </div>

                              <input
                                ref={heroMediaInputRef}
                                type="file"
                                accept={cfg.mediaType === 'video' ? 'video/*' : 'image/*'}
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  uploadHeroMedia(file, (cfg.mediaType ?? 'image') as any);
                                }}
                              />

                              {heroUploadMessage ? (
                                <div className="mt-2 text-[11px] text-slate-300">{heroUploadMessage}</div>
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-xs text-slate-400">
                            <label className="flex flex-col gap-1.5">
                              <span className="font-medium">Title</span>
                              <input
                                value={cfg.title ?? ''}
                                onChange={(e) => setBlockConfig(key, { title: e.target.value })}
                                className="px-3 py-2 rounded-lg border border-white/10 bg-slate-900/50 text-white text-sm focus:border-blue-500 outline-none transition-colors"
                              />
                            </label>
                            {key === 'masonryDiscovery' && (
                              <label className="flex flex-col gap-1.5">
                                <span className="font-medium">Subtitle</span>
                                <input
                                  value={cfg.subtitle ?? ''}
                                  onChange={(e) => setBlockConfig(key, { subtitle: e.target.value })}
                                  className="px-3 py-2 rounded-lg border border-white/10 bg-slate-900/50 text-white text-sm focus:border-blue-500 outline-none transition-colors"
                                />
                              </label>
                            )}
                            <label className="flex flex-col gap-1.5">
                              <span className="font-medium">Max Columns</span>
                              <input
                                type="number"
                                value={cfg.maxColumns ?? (key === 'blockC' ? 6 : key === 'actionCards' ? 3 : 1)}
                                min={1}
                                max={12}
                                onChange={(e) => setBlockConfig(key, { maxColumns: Number(e.target.value) })}
                                className="px-3 py-2 rounded-lg border border-white/10 bg-slate-900/50 text-white text-sm focus:border-blue-500 outline-none transition-colors"
                              />
                            </label>
                            <label className="flex flex-col gap-1.5">
                              <span className="font-medium">Max Rows</span>
                              <input
                                type="number"
                                value={cfg.maxRows ?? 1}
                                min={1}
                                max={6}
                                onChange={(e) => setBlockConfig(key, { maxRows: Number(e.target.value) })}
                                className="px-3 py-2 rounded-lg border border-white/10 bg-slate-900/50 text-white text-sm focus:border-blue-500 outline-none transition-colors"
                              />
                            </label>
                            <label className="flex flex-col gap-1.5">
                              <span className="font-medium">Card Width</span>
                              <input
                                type="number"
                                value={cfg.cardWidth ?? 180}
                                min={80}
                                max={400}
                                onChange={(e) => setBlockConfig(key, { cardWidth: Number(e.target.value) })}
                                className="px-3 py-2 rounded-lg border border-white/10 bg-slate-900/50 text-white text-sm focus:border-blue-500 outline-none transition-colors"
                              />
                            </label>
                            <label className="flex flex-col gap-1.5">
                              <span className="font-medium">Card Height</span>
                              <input
                                type="number"
                                value={cfg.cardHeight ?? 110}
                                min={40}
                                max={400}
                                onChange={(e) => setBlockConfig(key, { cardHeight: Number(e.target.value) })}
                                className="px-3 py-2 rounded-lg border border-white/10 bg-slate-900/50 text-white text-sm focus:border-blue-500 outline-none transition-colors"
                              />
                            </label>
                            <label className="flex flex-col gap-1.5">
                              <span className="font-medium">Card Gap (px)</span>
                              <input
                                type="number"
                                value={cfg.cardGapPx ?? 12}
                                min={0}
                                max={64}
                                onChange={(e) => setBlockConfig(key, { cardGapPx: Number(e.target.value) })}
                                className="px-3 py-2 rounded-lg border border-white/10 bg-slate-900/50 text-white text-sm focus:border-blue-500 outline-none transition-colors"
                              />
                            </label>
                            <label className="flex flex-col gap-1.5">
                              <span className="font-medium">Card Radius (px)</span>
                              <input
                                type="number"
                                value={cfg.cardRadiusPx ?? 12}
                                min={0}
                                max={9999}
                                onChange={(e) => setBlockConfig(key, { cardRadiusPx: Number(e.target.value) })}
                                className="px-3 py-2 rounded-lg border border-white/10 bg-slate-900/50 text-white text-sm focus:border-blue-500 outline-none transition-colors"
                              />
                            </label>
                          </div>
                        )}

                        {key === 'blockF' ? (
                          <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 space-y-2">
                            {(() => {
                              const items = normalizeCardItems((cfg as any).items, 'blockF');

                              const updateItem = (id: string, patch: Partial<HomePageV2CardItem>) => {
                                const next = normalizeCardItems((cfg as any).items, 'blockF').map((it) => (it.id === id ? { ...it, ...patch } : it));
                                setBlockConfig(key, { items: next } as any);
                              };

                              const removeItem = (id: string) => {
                                const next = normalizeCardItems((cfg as any).items, 'blockF').filter((it) => it.id !== id);
                                setBlockConfig(key, { items: next } as any);
                              };

                              const addItem = () => {
                                const next = normalizeCardItems((cfg as any).items, 'blockF');
                                next.push({ id: makeStableId('blockF'), title: '', href: '/privacy', mediaType: 'image', mediaUrl: '' });
                                setBlockConfig(key, { items: next } as any);
                              };

                              return (
                                <>
                                  <div className="flex items-center justify-between gap-1.5">
                                    <div>
                                      <div className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">Buttons</div>
                                      <div className="text-[9px] text-slate-500 dark:text-slate-400">Add/remove buttons for Privacy and Terms</div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={addItem}
                                      className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] hover:bg-slate-100 dark:hover:bg-slate-800"
                                    >
                                      + Add button
                                    </button>
                                  </div>

                                  {items.length === 0 ? <div className="text-[10px] text-slate-500 dark:text-slate-400">No buttons yet.</div> : null}

                                  <div className="space-y-2">
                                    {items.map((it) => (
                                      <div key={it.id} className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-2">
                                        <div className="flex items-center justify-between gap-1.5">
                                          <div className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 truncate">{it.title?.trim() ? it.title : 'Untitled'}</div>
                                          <button
                                            type="button"
                                            onClick={() => removeItem(it.id)}
                                            className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[10px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                          >
                                            Remove
                                          </button>
                                        </div>

                                        <div className="mt-1.5 space-y-1.5">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <label className="flex flex-col gap-1">
                                              <span className="text-[11px] text-slate-500 dark:text-slate-400">Label</span>
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
                                                placeholder="/privacy or /terms or https://..."
                                                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                              />
                                            </label>
                                          </div>
                                          <label className="flex flex-col gap-1">
                                            <span className="text-[11px] text-slate-500 dark:text-slate-400">Text (displayed under button)</span>
                                            <textarea
                                              value={it.text || ''}
                                              onChange={(e) => updateItem(it.id, { text: e.target.value })}
                                              placeholder="Optional text to show below this button"
                                              rows={2}
                                              className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm resize-none"
                                            />
                                          </label>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </>
                              );
                            })()}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <label className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Terms Content</span>
                                <textarea
                                  value={(cfg as any)?.termsContent ?? ''}
                                  onChange={(e) => setBlockConfig(key, { termsContent: e.target.value } as any)}
                                  rows={6}
                                  placeholder="Enter Terms details (supports plain text)"
                                  className="px-2 py-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                />
                              </label>
                              <label className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Privacy Content</span>
                                <textarea
                                  value={(cfg as any)?.privacyContent ?? ''}
                                  onChange={(e) => setBlockConfig(key, { privacyContent: e.target.value } as any)}
                                  rows={6}
                                  placeholder="Enter Privacy details (supports plain text)"
                                  className="px-2 py-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                                />
                              </label>
                            </div>
                          </div>
                        ) : null}

                        {key === 'blockB' ? (
                          <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 space-y-2">
                            <label className="flex flex-col gap-0.5">
                              <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200">Explore All Tools Link</span>
                              <input
                                value={(cfg as any)?.exploreAllToolsHref ?? '/designer-v2-1'}
                                onChange={(e) => setBlockConfig(key, { exploreAllToolsHref: e.target.value })}
                                placeholder="/designer-v2-1"
                                className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
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
                                      <div key={it.id} className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-2">
                                        <div className="flex items-center justify-between gap-1.5">
                                          <div className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 truncate">
                                            {it.title?.trim() ? it.title : 'Untitled card'}
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => removeItem(it.id)}
                                            className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[10px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                          >
                                            Remove
                                          </button>
                                        </div>

                                        <div className="mt-1.5 grid grid-cols-2 md:grid-cols-4 gap-1.5">
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

        <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-2 py-1.5 bg-slate-50 dark:bg-slate-900/50 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Hero Media</div>
          <div className="p-2 space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-slate-600 dark:text-slate-300 w-16">Type</label>
              <select
                value={hero.mediaType}
                onChange={(e) => setHero({ mediaType: e.target.value as any })}
                className="flex-1 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[10px] text-slate-600 dark:text-slate-300 w-16">URL</label>
              <input
                value={hero.mediaUrl}
                onChange={(e) => setHero({ mediaUrl: e.target.value })}
                placeholder="https://..."
                className="flex-1 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
              />
            </div>

            <div className="text-[9px] text-slate-500 dark:text-slate-400">
              Videos are only mounted when the section is within 500px of viewport.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
