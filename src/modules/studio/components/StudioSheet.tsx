import React, { useEffect, useRef } from 'react';
import { motion, useAnimation, PanInfo, useDragControls } from 'framer-motion';
import styles from '../styles/StudioSheet.module.css';
import { getEnabledBlocks } from '../config/layoutConfig';
import { GenerationHistory } from '../../history/components/GenerationHistory';
import { GallerySection } from './GallerySection';
import { traceStep } from '../../../utils/trace';

interface StudioSheetProps {
  children: React.ReactNode;
  initialSnap?: 'collapsed' | 'standard' | 'expanded';
}

export const StudioSheet: React.FC<StudioSheetProps> = ({ 
  children, 
  initialSnap = 'collapsed' 
}) => {
  const controls = useAnimation();
  const dragControls = useDragControls();
  const contentRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const blocks = getEnabledBlocks();
  const [sheetHeightPx, setSheetHeightPx] = React.useState<number | null>(null);

  // Keep the sheet above the master footer. This offset must match the mobile footer height.
  const FOOTER_OFFSET_PX = 74;

  const [variants, setVariants] = React.useState({
    expanded: { y: 0 },
    standard: { y: 500 },
    collapsed: { y: 700 }
  });

  React.useLayoutEffect(() => {
    const updateVariants = () => {
      const vv = window.visualViewport;
      const viewportHeight = vv?.height || window.innerHeight;
      const viewportTop = vv?.offsetTop ?? 0;
      const layoutHeight = window.innerHeight;
      const chromeTopInset = Math.max(0, layoutHeight - viewportHeight);
      const headerHeightRaw = getComputedStyle(document.documentElement).getPropertyValue('--header-height');
      const headerHeight = Math.max(0, Number.parseFloat(headerHeightRaw) || 0);
      const safeTop = Math.max(8, viewportTop, chromeTopInset + 8, headerHeight);
      const computedSheetHeight = Math.max(0, (viewportHeight * 0.92) - FOOTER_OFFSET_PX);
      const sheetHeight = computedSheetHeight || sheetRef.current?.getBoundingClientRect().height || 0;
      const handleHeight = Math.max(48, Math.ceil(handleRef.current?.getBoundingClientRect().height || 0));

      // Ensure the handle stays below the visible top (address bar/header)
      const targetHandleBottom = safeTop;
      const expandedY = Math.max(0, (targetHandleBottom - handleHeight) - (layoutHeight - sheetHeight));

      setSheetHeightPx((prev) => (prev === sheetHeight ? prev : sheetHeight));
      
      // Use fixed pixel values for predictable positioning:
      // - expanded: fully open
      // - standard: middle position for browsing
      // - collapsed: show only handle (dynamic height)
      
      setVariants({
        expanded: { y: expandedY },
        standard: { y: Math.min(sheetHeight * 0.65, 520) },
        collapsed: { y: sheetHeight - handleHeight }
      });
    };

    updateVariants();
    window.addEventListener('resize', updateVariants);
    window.visualViewport?.addEventListener('resize', updateVariants);
    window.visualViewport?.addEventListener('scroll', updateVariants);
    return () => {
      window.removeEventListener('resize', updateVariants);
      window.visualViewport?.removeEventListener('resize', updateVariants);
      window.visualViewport?.removeEventListener('scroll', updateVariants);
    };
  }, []);

  useEffect(() => {
    controls.start(initialSnap);
  }, [initialSnap, controls, variants]);

  useEffect(() => {
    const onExpand = () => {
      traceStep('StudioSheet EXPAND received');
      controls.start('expanded');
      if (contentRef.current) contentRef.current.scrollTop = 0;
    };

    const onCollapse = () => {
      traceStep('StudioSheet COLLAPSE received');
      controls.start('collapsed');
    };

    window.addEventListener('khuyoot:studio-sheet-expand', onExpand as EventListener);
    window.addEventListener('khuyoot:studio-sheet-collapse', onCollapse as EventListener);
    return () => {
      window.removeEventListener('khuyoot:studio-sheet-expand', onExpand as EventListener);
      window.removeEventListener('khuyoot:studio-sheet-collapse', onCollapse as EventListener);
    };
  }, [controls]);

  const onDragEnd = (event: any, info: PanInfo) => {
    const velocity = info.velocity.y;
    const currentY = info.offset.y + (variants[initialSnap as keyof typeof variants]?.y || 0);
    const threshold = variants.collapsed.y - 24;

    // One-drag behavior: snap to expanded unless released near collapsed.
    if (velocity < -20) {
      controls.start('expanded');
      return;
    }
    if (velocity > 20) {
      controls.start('collapsed');
      return;
    }

    if (currentY < threshold) controls.start('expanded');
    else controls.start('collapsed');
  };

  const renderBlock = (blockId: string, index: number) => {
    const isFirst = index === 0;
    const blockClass = isFirst ? "pt-0" : "mt-10 border-t border-slate-100 dark:border-white/10 pt-6";
    
    switch (blockId) {
      case 'selectors':
        return <div key="selectors" className={blockClass}>{children}</div>;
      case 'gallery':
        return (
          <div key="gallery" className={`${blockClass} pb-10`}>
            <GallerySection />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      ref={sheetRef}
      className={styles.sheetContainer}
      style={sheetHeightPx ? { height: `${sheetHeightPx}px` } : undefined}
      initial={initialSnap}
      animate={controls}
      variants={variants}
      drag="y"
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ top: 0, bottom: variants.collapsed.y }}
      dragElastic={0.1}
      onDragEnd={onDragEnd}
      transition={{ type: 'spring', damping: 30, stiffness: 250 }}
    >
      {/* Drag Handle Area */}
      <div 
        className={styles.dragHandleArea}
        ref={handleRef}
        onPointerDown={(e) => dragControls.start(e)}
      >
        <div className={styles.dragHandle} />
      </div>
      
      {/* Content Area */}
      <div 
        className={styles.scrollableContent}
        ref={contentRef}
      >
        {blocks.map((block, idx) => renderBlock(block.id, idx))}
      </div>
    </motion.div>
  );
};
