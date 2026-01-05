import React, { useEffect, useRef } from 'react';
import { motion, useAnimation, PanInfo, useDragControls } from 'framer-motion';
import styles from '../styles/StudioSheet.module.css';
import { getEnabledBlocks } from '../config/layoutConfig';
import { GenerationHistory } from '../../history/components/GenerationHistory';
import { GallerySection } from './GallerySection';

interface StudioSheetProps {
  children: React.ReactNode;
  initialSnap?: 'collapsed' | 'standard' | 'expanded';
}

export const StudioSheet: React.FC<StudioSheetProps> = ({ 
  children, 
  initialSnap = 'standard' 
}) => {
  const controls = useAnimation();
  const dragControls = useDragControls();
  const contentRef = useRef<HTMLDivElement>(null);
  const blocks = getEnabledBlocks();

  // Keep the sheet above the master footer. This offset must match the mobile footer height.
  const FOOTER_OFFSET_PX = 74;

  const [variants, setVariants] = React.useState({
    expanded: { y: 0 },
    standard: { y: 500 },
    collapsed: { y: 700 }
  });

  React.useLayoutEffect(() => {
    const updateVariants = () => {
      const vh = window.innerHeight;
      // The sheet height is defined in CSS as calc(92vh - var(--footer-height))
      const sheetHeight = (vh * 0.92) - FOOTER_OFFSET_PX;
      
      setVariants({
        expanded: { y: 0 },
        standard: { y: Math.min(sheetHeight * 0.65, 520) },
        collapsed: { y: sheetHeight - 48 } // Leave 48px for the handle area
      });
    };

    updateVariants();
    window.addEventListener('resize', updateVariants);
    return () => window.removeEventListener('resize', updateVariants);
  }, []);

  useEffect(() => {
    controls.start(initialSnap);
  }, [initialSnap, controls, variants]);

  useEffect(() => {
    const onExpand = () => {
      controls.start('expanded');
      if (contentRef.current) contentRef.current.scrollTop = 0;
    };

    window.addEventListener('khuyoot:studio-sheet-expand', onExpand as EventListener);
    return () => window.removeEventListener('khuyoot:studio-sheet-expand', onExpand as EventListener);
  }, [controls]);

  const onDragEnd = (event: any, info: PanInfo) => {
    const velocity = info.velocity.y;
    const currentY = info.offset.y + (variants[initialSnap as keyof typeof variants]?.y || 0);

    // Thresholds for snapping
    const tExpanded = variants.standard.y * 0.4;
    const tStandard = variants.standard.y + (variants.collapsed.y - variants.standard.y) * 0.5;

    if (velocity > 20) {
      if (currentY < tExpanded) controls.start('standard');
      else controls.start('collapsed');
    } else if (velocity < -20) {
      if (currentY > tStandard) controls.start('standard');
      else controls.start('expanded');
    } else {
      if (currentY < tExpanded) controls.start('expanded');
      else if (currentY < tStandard) controls.start('standard');
      else controls.start('collapsed');
    }
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
      className={styles.sheetContainer}
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
