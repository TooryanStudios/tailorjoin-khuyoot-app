import React from 'react';
import { PortalModal } from './PortalModal';
import { FabricPickerModalContent } from './FabricPickerModalContent';

type FabricPickerContentProps = React.ComponentProps<typeof FabricPickerModalContent>;

export function TryOnFabricPickerModal(props: {
  open: boolean;
  portalTarget: HTMLElement | null;
  onClose: () => void;
  contentProps: Omit<FabricPickerContentProps, 'onClose'>;
}) {
  const { open, portalTarget, onClose, contentProps } = props;

  return (
    <PortalModal
      open={open}
      portalTarget={portalTarget}
      onClose={onClose}
      dataDebugModal="TRYON-FABRIC-PICKER"
      overlayClassName="fixed inset-0 z-[2147483647] bg-black/50 flex items-center justify-center p-4"
      containerClassName="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl lg:max-w-5xl w-full max-h-[80vh] flex flex-col relative"
      overlayStyle={{ touchAction: 'none' }}
      containerStyle={{
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
      }}
    >
      <FabricPickerModalContent onClose={onClose} {...contentProps} />
    </PortalModal>
  );
}
