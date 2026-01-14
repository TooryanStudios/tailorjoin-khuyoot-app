import React from 'react';
import { createPortal } from 'react-dom';

export function PortalModal(props: {
  open: boolean;
  portalTarget: HTMLElement | null;
  onClose: () => void;
  children: React.ReactNode;
  overlayClassName: string;
  containerClassName: string;
  dataDebugModal?: string;
  overlayStyle?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
}) {
  const {
    open,
    portalTarget,
    onClose,
    children,
    overlayClassName,
    containerClassName,
    dataDebugModal,
    overlayStyle,
    containerStyle,
  } = props;

  if (!open || !portalTarget) return null;

  return createPortal(
    <div
      className={overlayClassName}
      data-overlay="khuyoot-modal"
      data-overlay-owner="PortalModal"
      data-debug-modal={dataDebugModal}
      onClick={onClose}
      style={overlayStyle}
    >
      <div
        className={containerClassName}
        data-debug-modal={dataDebugModal}
        onClick={(e) => e.stopPropagation()}
        style={containerStyle}
      >
        {children}
      </div>
    </div>,
    portalTarget
  );
}
