import React from 'react';
import styles from './homepageV2.module.css';

export function SkeletonShimmer(props: { className?: string }) {
  return (
    <div
      className={
        `relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 ${styles.shimmer} ${
          props.className ?? ''
        }`
      }
      aria-hidden="true"
    />
  );
}
