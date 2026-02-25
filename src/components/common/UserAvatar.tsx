import React from 'react';

type UserAvatarProps = {
  src?: unknown;
  alt?: string;
  className?: string;
  fallbackSrc?: string;
};

const DEFAULT_FALLBACK = '/placeholders/avatar.svg';

function normalizeImageSrc(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed === 'null' || trimmed === 'undefined' || trimmed === '[object Object]') return null;
  return trimmed;
}

export const UserAvatar: React.FC<UserAvatarProps> = React.memo(function UserAvatar({
  src,
  alt = 'User avatar',
  className,
  fallbackSrc = DEFAULT_FALLBACK,
}) {
  const safeSrc = React.useMemo(() => normalizeImageSrc(src) || fallbackSrc, [src, fallbackSrc]);
  const [currentSrc, setCurrentSrc] = React.useState(safeSrc);

  React.useEffect(() => {
    setCurrentSrc(safeSrc);
  }, [safeSrc]);

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc);
        }
      }}
      loading="lazy"
      decoding="async"
    />
  );
});
