export type HomePageV2BlockKey =
  | 'blockA'
  | 'blockB'
  | 'blockC'
  | 'blockD'
  | 'blockE'
  | 'blockF'
  | 'dynamicHero'
  | 'actionCards'
  | 'masonryDiscovery';

export type HeroMediaType = 'video' | 'image';

export type HomePageV2CardItem = {
  id: string;
  title: string;
  href: string;
  mediaType: HeroMediaType;
  mediaUrl: string;
  enabled?: boolean;
};

export type HomePageV2BlockConfig = {
  // Generic layout fields (used by most blocks)
  title?: string;
  maxColumns?: number;
  maxRows?: number;
  cardWidth?: number;
  cardHeight?: number;
  cardGapPx?: number;
  cardRadiusPx?: number;

  // Optional list-driven blocks (e.g. BlockB cards)
  items?: HomePageV2CardItem[];

  // BlockB-specific fields
  exploreAllToolsHref?: string;

  // DynamicHero-specific fields
  headline?: string;
  subheadline?: string;
  primaryCtaText?: string;
  secondaryCtaText?: string;
  mediaType?: HeroMediaType;
  mediaUrl?: string;
  heroHeightPx?: number;
};

export type HomePageV2BlockManifest = {
  key: HomePageV2BlockKey;
  title: string;
  component: string;
  defaultVisible: boolean;
  defaultConfig?: HomePageV2BlockConfig;
};

export type HomePageV2LayoutManifest = {
  version: number;
  blocks: HomePageV2BlockManifest[];
};

export type HomePageV2HeroConfig = {
  mediaType: HeroMediaType;
  mediaUrl: string;
};

export type HomePageV2LayoutState = {
  manifestVersion: number;
  order: HomePageV2BlockKey[];
  visibility: Record<HomePageV2BlockKey, boolean>;
  hero: HomePageV2HeroConfig;
  blockConfig: Partial<Record<HomePageV2BlockKey, HomePageV2BlockConfig>>;
};
