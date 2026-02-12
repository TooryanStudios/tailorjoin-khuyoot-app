import * as React from 'react';

type FabricMeta = {
  fabric_url?: string;
  thumbnail_url?: string;
  product_id?: string;
};

function extractFabricMeta(debug: any): FabricMeta | null {
  if (!debug || typeof debug !== 'object') return null;

  const candidates: any[] = [
    debug,
    (debug as any).metadata,
    (debug as any).generation_metadata,
    (debug as any).generationMetadata,
    (debug as any).fabric,
  ].filter(Boolean);

  for (const c of candidates) {
    if (!c || typeof c !== 'object') continue;

    const fabric_url =
      (typeof c.fabric_url === 'string' && c.fabric_url) ||
      (typeof c.fabricUrl === 'string' && c.fabricUrl) ||
      undefined;

    const thumbnail_url =
      (typeof c.thumbnail_url === 'string' && c.thumbnail_url) ||
      (typeof c.thumbnailUrl === 'string' && c.thumbnailUrl) ||
      undefined;

    const product_id =
      (typeof c.product_id === 'string' && c.product_id) ||
      (typeof c.productId === 'string' && c.productId) ||
      undefined;

    if (fabric_url || thumbnail_url || product_id) return { fabric_url, thumbnail_url, product_id };
  }

  return null;
}

export const SourceFabricTile = React.memo(function SourceFabricTile(props: {
  debug?: any;
  fallbackFabricImageUrl?: string;
}) {
  const meta = React.useMemo(() => extractFabricMeta(props.debug), [props.debug]);

  const href = meta?.fabric_url || undefined;
  const thumb = meta?.thumbnail_url || props.fallbackFabricImageUrl || undefined;

  if (!href && !thumb) return null;

  return (
    <a
      href={href || thumb}
      target="_blank"
      rel="noopener noreferrer"
      className="absolute bottom-4 left-4 z-50 rounded-lg border border-zinc-800 bg-black/50 backdrop-blur-sm p-1 hover:bg-black/60 transition-colors"
      title={meta?.product_id ? `Product: ${meta.product_id}` : 'View Fabric'}
    >
      <div className="flex flex-col items-center gap-1">
        {thumb ? (
          <img src={thumb} alt="Source Fabric" className="w-12 h-12 rounded object-cover" loading="lazy" decoding="async" />
        ) : null}
        <span className="text-[10px] leading-none text-white">View Fabric</span>
      </div>
    </a>
  );
});
