export { useThumbnailCache } from '../../../hooks/useThumbnailCache';

// Compatibility alias with the directive wording.
// Returns a stable thumbnail src (cached blob URL when available).
export function useImageCache(url: string | null | undefined) {
  const { getThumbnailSrc } = useThumbnailCache({ maxEntries: 30 });
  return getThumbnailSrc(url);
}
