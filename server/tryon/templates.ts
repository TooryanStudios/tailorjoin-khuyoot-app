export type ServerGarmentTemplate = {
  id: string;
  name: string;
  imageUrl: string;
};

// Server-authoritative mapping (prevents arbitrary template URLs).
export const SERVER_GARMENT_TEMPLATES: ServerGarmentTemplate[] = [
  {
    id: 'dishdasha',
    name: 'دشداشة',
    imageUrl:
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'abaya',
    name: 'عباية',
    imageUrl:
      'https://images.unsplash.com/photo-1520975682031-a636b0d4823f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'dress',
    name: 'فستان',
    imageUrl:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'suit',
    name: 'بدلة',
    imageUrl:
      'https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=1200&q=80',
  },
];

export function getTemplateById(id: string) {
  return SERVER_GARMENT_TEMPLATES.find((t) => t.id === id) || null;
}
