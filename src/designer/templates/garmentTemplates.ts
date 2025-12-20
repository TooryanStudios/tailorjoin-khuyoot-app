export type GarmentTemplate = {
  id: string;
  name: string;
  imageUrl: string;
  tags?: string[];
};

// Template-only catalog (no user photos).
// NOTE: These are placeholders; replace with your approved template assets when available.
export const GARMENT_TEMPLATES: GarmentTemplate[] = [
  {
    id: 'dishdasha',
    name: 'دشداشة',
    imageUrl:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
    tags: ['men', 'traditional'],
  },
  {
    id: 'abaya',
    name: 'عباية',
    imageUrl:
      'https://images.unsplash.com/photo-1520975682031-a636b0d4823f?auto=format&fit=crop&w=1200&q=80',
    tags: ['women', 'traditional'],
  },
  {
    id: 'dress',
    name: 'فستان',
    imageUrl:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
    tags: ['women'],
  },
  {
    id: 'suit',
    name: 'بدلة',
    imageUrl:
      'https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=1200&q=80',
    tags: ['men', 'formal'],
  },
];
