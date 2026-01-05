import React from 'react';
import { PortalModal } from './PortalModal';
import { TemplatePickerModalContent } from './TemplatePickerModalContent';

type TemplatePickerContentProps = React.ComponentProps<typeof TemplatePickerModalContent>;

export function TryOnTemplatePickerModal(props: {
  open: boolean;
  portalTarget: HTMLElement | null;
  onClose: () => void;
  contentProps: Omit<TemplatePickerContentProps, 'onClose'>;
}) {
  const { open, portalTarget, onClose, contentProps } = props;

  return (
    <PortalModal
      open={open}
      portalTarget={portalTarget}
      onClose={onClose}
      dataDebugModal="TRYON-TEMPLATE-PICKER"
      overlayClassName="fixed inset-0 z-[2147483647] bg-black/50 flex items-start justify-center p-4 overflow-y-auto"
      containerClassName="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl lg:max-w-3xl w-full max-h-[80vh] md:h-[80vh] flex flex-col relative"
      overlayStyle={{
        touchAction: 'pan-y',
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
      }}
      containerStyle={{
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
      }}
    >
      <TemplatePickerModalContent onClose={onClose} {...contentProps} />
    </PortalModal>
  );
}
