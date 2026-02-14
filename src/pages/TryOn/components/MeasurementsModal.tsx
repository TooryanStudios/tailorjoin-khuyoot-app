import React from 'react';
import { useTranslation } from 'react-i18next';
import { ClientMeasurementsV2 } from '../../../modules/measurements/ClientMeasurementsV2';

interface MeasurementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
}

export const MeasurementsModal: React.FC<MeasurementsModalProps> = ({ isOpen, onClose, productId }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-6xl h-[90vh] bg-white rounded-2xl shadow-2xl relative overflow-hidden animate-scale-in">
        <ClientMeasurementsV2 
          isModal 
          onClose={onClose} 
          productId={productId} 
        />
      </div>
    </div>
  );
};
