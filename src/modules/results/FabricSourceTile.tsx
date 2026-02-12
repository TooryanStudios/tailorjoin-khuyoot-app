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

export const FabricSourceTile = React.memo(function FabricSourceTile(props: {
  debug?: any;
  fallbackThumbnailUrl?: string;
  productId?: string;
}) {
  const meta = React.useMemo(() => extractFabricMeta(props.debug), [props.debug]);

  const internalProductUrl = props.productId ? `/product/${props.productId}` : undefined;
  const shopUrl = meta?.fabric_url || internalProductUrl;
  
  // Prioritize live previews (data/blob URLs) for tiling/uploads over historical debug data
  const thumbnailUrl = (props.fallbackThumbnailUrl?.startsWith('data:') || props.fallbackThumbnailUrl?.startsWith('blob:'))
    ? props.fallbackThumbnailUrl
    : (meta?.thumbnail_url || props.fallbackThumbnailUrl || undefined);

  if (!shopUrl && !thumbnailUrl) return null;

  const content = (
    <div className="flex flex-col items-center gap-2">
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt="Fabric"
          className="w-20 h-20 rounded-lg object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : null}
      <span className="text-xs leading-none text-white whitespace-nowrap font-medium">Shop this Fabric</span>
    </div>
  );

  // If we don't yet have a marketplace URL (pre-generation), show the tile as non-clickable
  // but keep it visible and synced to the current fabric selection.
  if (!shopUrl) {
    return (
      <div
        className="absolute bottom-4 left-4 z-[70] rounded-xl border border-zinc-800 bg-black/50 backdrop-blur-sm p-2"
        title="Selected Fabric"
      >
        {content}
      </div>
    );
  }

  const isExternal = /^https?:\/\//i.test(shopUrl);

  return (
    <a
      href={shopUrl}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className="absolute bottom-4 left-4 z-[70] rounded-xl border border-zinc-800 bg-black/50 backdrop-blur-sm p-2 hover:bg-black/60 transition-colors"
      title={meta?.product_id ? `Product: ${meta.product_id}` : 'Shop this Fabric'}
    >
      {content}
    </a>
  );
});
