export interface StudioBlock {
  id: string;
  title: string;
  enabled: boolean;
  order: number;
}

export const STUDIO_LAYOUT_CONFIG: StudioBlock[] = [
  {
    id: 'selectors',
    title: 'Selection Tools',
    enabled: true,
    order: 1,
  },
  {
    id: 'gallery',
    title: 'Community Gallery',
    enabled: true,
    order: 2,
  }
];

export const getEnabledBlocks = () => {
  return [...STUDIO_LAYOUT_CONFIG]
    .filter(block => block.enabled)
    .sort((a, b) => a.order - b.order);
};
