import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ImageLibraryItem } from '../../../../types';

interface ImageViewerModalProps {
  image: ImageLibraryItem | null;
  onClose: () => void;
  categoryName?: string;
  onGenerateThumbnail: (image: ImageLibraryItem) => void;
  isGeneratingThumbnail: boolean;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  image,
  onClose,
  categoryName,
  onGenerateThumbnail,
  isGeneratingThumbnail
}) => {
  const [viewerInfo, setViewerInfo] = useState<{ full?: { bytes?: number }; thumb?: { bytes?: number } }>({});
  const [viewerDims, setViewerDims] = useState<{ full?: { w: number; h: number }; thumb?: { w: number; h: number } }>({});

  const fetchImageInfo = async (url: string): Promise<{ contentLength?: number; contentType?: string }> => {
    try {
      const res = await fetch(`/api/proxy-image-info?url=${encodeURIComponent(url)}`);
      if (!res.ok) return { contentLength: undefined, contentType: undefined };
      const data = await res.json();
      return {
        contentLength: typeof data?.contentLength === 'number' ? data.contentLength : undefined,
        contentType: typeof data?.contentType === 'string' ? data.contentType : undefined
      };
    } catch {
      return { contentLength: undefined, contentType: undefined };
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!image) {
        setViewerInfo({});
        setViewerDims({});
        return;
      }

      setViewerInfo({});
      setViewerDims({});

      const fullUrl = image.imageUrl;
      const thumbUrl = image.thumbnailUrl;

      const [fullInfo, thumbInfo] = await Promise.all([
        fullUrl
          ? fetchImageInfo(fullUrl)
          : Promise.resolve({ contentLength: undefined, contentType: undefined }),
        thumbUrl
          ? fetchImageInfo(thumbUrl)
          : Promise.resolve({ contentLength: undefined, contentType: undefined })
      ]);

      if (cancelled) return;

      setViewerInfo({
        full: { bytes: typeof fullInfo.contentLength === 'number' ? fullInfo.contentLength : undefined },
        thumb: { bytes: typeof thumbInfo.contentLength === 'number' ? thumbInfo.contentLength : undefined }
      });
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [image]);

  if (!image) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition z-10"
        >
          <X size={24} className="text-white" />
        </button>

        {/* Image Info */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-4 py-2 rounded-lg z-10">
          <p className="text-white text-sm font-medium">{image.label}</p>
          <p className="text-white/70 text-xs mt-1">{categoryName}</p>
        </div>

        {/* Images */}
        <div
          className="w-full h-full flex flex-col md:flex-row items-center justify-center gap-4 px-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Full */}
          <div className="flex-1 w-full h-full flex flex-col items-center justify-center">
            <div className="w-full flex items-center justify-between mb-2">
              <div className="text-white text-xs bg-black/40 backdrop-blur-md px-3 py-1 rounded">
                كامل
                {typeof viewerDims.full?.w === 'number' && typeof viewerDims.full?.h === 'number'
                  ? ` — ${viewerDims.full.w}×${viewerDims.full.h}`
                  : ''}
                {typeof viewerInfo.full?.bytes === 'number'
                  ? ` — ${(viewerInfo.full.bytes / 1024).toFixed(0)} KB`
                  : ''}
              </div>
              <a
                href={image.imageUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded"
              >
                تحميل
              </a>
            </div>
            <img
              src={image.imageUrl}
              alt={image.label}
              className="max-w-full max-h-[70vh] object-contain"
              onLoad={(e) => {
                const img = e.currentTarget;
                setViewerDims(prev => ({
                  ...prev,
                  full: { w: img.naturalWidth, h: img.naturalHeight }
                }));
              }}
            />
          </div>

          {/* Thumbnail */}
          <div className="flex-1 w-full h-full flex flex-col items-center justify-center">
            <div className="w-full flex items-center justify-between mb-2">
              <div className="text-white text-xs bg-black/40 backdrop-blur-md px-3 py-1 rounded">
                مصغّر
                {image.thumbnailUrl
                  ? ''
                  : ' — غير متوفر'}
                {image.thumbnailUrl && typeof viewerDims.thumb?.w === 'number' && typeof viewerDims.thumb?.h === 'number'
                  ? ` — ${viewerDims.thumb.w}×${viewerDims.thumb.h}`
                  : ''}
                {image.thumbnailUrl && typeof viewerInfo.thumb?.bytes === 'number'
                  ? ` — ${(viewerInfo.thumb.bytes / 1024).toFixed(0)} KB`
                  : ''}
              </div>
              {image.thumbnailUrl ? (
                <a
                  href={image.thumbnailUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded"
                >
                  تحميل
                </a>
              ) : (
                <button
                  onClick={() => onGenerateThumbnail(image)}
                  disabled={isGeneratingThumbnail}
                  className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded disabled:opacity-60"
                >
                  {isGeneratingThumbnail ? 'جارٍ...' : 'إنشاء مصغّر'}
                </button>
              )}
            </div>

            {image.thumbnailUrl ? (
              <img
                src={image.thumbnailUrl}
                alt={`${image.label} thumbnail`}
                className="max-w-full max-h-[70vh] object-contain"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  setViewerDims(prev => ({
                    ...prev,
                    thumb: { w: img.naturalWidth, h: img.naturalHeight }
                  }));
                }}
              />
            ) : (
              <div className="w-full max-w-md h-56 flex items-center justify-center border border-white/20 rounded bg-black/20">
                <p className="text-white/70 text-sm">لا يوجد مصغّر لهذه الصورة</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
