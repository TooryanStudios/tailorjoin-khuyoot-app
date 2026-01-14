import React from 'react';

export interface MeasurementCardProps {
  title: string;
  value?: string | number;
  unit?: string;
}

export const MeasurementCard: React.FC<MeasurementCardProps> = ({ title, value, unit = 'CM' }) => {
  return (
    <div className="khiyoot-glass rounded-xl p-4">
      <div className="text-[11px] text-gold-400/80 mb-1">{title}</div>
      <div className="text-2xl font-bold">
        {value ?? '—'} <span className="text-sm text-white/60">{value ? unit : ''}</span>
      </div>
    </div>
  );
};

export default MeasurementCard;
