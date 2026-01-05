import * as React from 'react';
import { CreditBadge } from '../../../CreditManager';

export type FloatingCreditChipProps = {
  onRefill?: () => void;
};

export const FloatingCreditChip = React.memo(function FloatingCreditChip(props: FloatingCreditChipProps) {
  const { onRefill } = props;

  return (
    <div className="w-full flex justify-end items-center px-4 py-2.5 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800/50 rounded-[4px]">
      <div className="origin-right">
        <CreditBadge onRefill={onRefill} minimal />
      </div>
    </div>
  );
});
