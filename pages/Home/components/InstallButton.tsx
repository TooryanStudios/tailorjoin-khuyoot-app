import React from 'react';
import { Download } from 'lucide-react';

interface InstallButtonProps {
  onInstallClick: () => void;
  isInstalled: boolean;
}

export const InstallButton: React.FC<InstallButtonProps> = ({ onInstallClick, isInstalled }) => {
  if (isInstalled) return null;

  return (
    <div className="mb-4 mt-4">
      <button
        onClick={onInstallClick}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl py-4 px-6 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all"
      >
        <Download size={24} />
        <div className="text-right">
          <div className="font-bold text-lg">أضف التطبيق للشاشة الرئيسية</div>
          <div className="text-xs text-blue-100">للوصول السريع والعمل بدون إنترنت</div>
        </div>
      </button>
    </div>
  );
};
