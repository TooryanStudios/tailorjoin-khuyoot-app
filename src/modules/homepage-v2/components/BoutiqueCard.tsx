import React from 'react';
import { motion } from 'framer-motion';

type BoutiqueCardProps = {
  title: string;
  subtitle?: string;
  mediaUrl: string;
  mediaType?: 'image' | 'video';
  badge?: 'new' | 'live';
  onClick?: () => void;
};

const ACCENT_GOLD = '#D4AF37';

export const BoutiqueCard = React.memo(
  React.forwardRef<HTMLDivElement, BoutiqueCardProps>(function BoutiqueCard(
    { title, subtitle, mediaUrl, mediaType = 'image', badge, onClick },
    ref
  ) {
    const [imageLoaded, setImageLoaded] = React.useState(false);
    const videoRef = React.useRef<HTMLVideoElement>(null);

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        whileHover={{ y: -12 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
          mass: 0.8,
        }}
        onClick={onClick}
        className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 group cursor-pointer"
      >
        {/* Media Layer with Zoom on Hover */}
        {mediaType === 'video' ? (
          <motion.video
            ref={videoRef}
            src={mediaUrl}
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            onLoadedData={() => setImageLoaded(true)}
            draggable={false}
          />
        ) : (
          <motion.img
            src={mediaUrl}
            alt={title}
            onLoad={() => setImageLoaded(true)}
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`absolute inset-0 w-full h-full object-cover ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            } transition-opacity duration-500`}
            draggable={false}
          />
        )}

        {/* Skeleton Loader (if image not loaded) */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 animate-pulse" />
        )}

        {/* Glass Overlay with Luxury Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A0B2E] via-[rgba(26,11,46,0.2)] to-transparent opacity-90" />

        {/* Hover Glow Effect */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-t from-[#0B0315] via-transparent to-transparent pointer-events-none"
          transition={{ duration: 0.3 }}
        />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
          {/* Badge */}
          {badge && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="inline-block mb-4 bg-[#D4AF37] text-black text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest w-fit"
            >
              {badge === 'new' ? '✨ NEW' : '🔴 LIVE'}
            </motion.span>
          )}

          {/* Title */}
          <h3 className="text-2xl md:text-3xl font-black tracking-tight text-white leading-tight mb-2">
            {title}
          </h3>

          {/* Subtitle + CTA (appears on hover) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileHover={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2"
          >
            {subtitle && <p className="text-white/70 text-sm font-medium">{subtitle}</p>}
            <p className="text-[#D4AF37] text-sm font-semibold flex items-center gap-2">
              Tap to open <span className="text-lg">→</span>
            </p>
          </motion.div>
        </div>

        {/* Hover Drop-Shadow Effect */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: '0 0 40px rgba(212, 175, 55, 0.25)',
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
    );
  })
);

BoutiqueCard.displayName = 'BoutiqueCard';
