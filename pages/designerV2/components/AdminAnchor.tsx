import React from 'react';

interface AdminAnchorProps extends React.HTMLAttributes<HTMLDivElement> {
  anchorId?: string;
  visible?: boolean;
  label?: string;
}

export const AdminAnchor = React.forwardRef<HTMLDivElement, AdminAnchorProps>(({ 
  anchorId,
  visible,
  label,
  className = '',
  children,
  id,
  ...rest
}, ref) => {
  const adminLabel = label ?? anchorId;

  return (
    <div
      ref={ref}
      id={anchorId ?? id}
      data-admin-anchor={anchorId}
      data-admin-label={adminLabel}
      className={`relative ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
});

AdminAnchor.displayName = 'AdminAnchor';
