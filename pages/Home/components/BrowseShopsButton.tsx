import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';

export const BrowseShopsButton: React.FC = () => {
  const navigate = useNavigate();
  const { appSettings } = useApp();
  
  const buttonText = appSettings.siteTexts?.browseShopsText || 'استعرض جميع المحلات والبوتيكات';

  return (
    <div className="mb-8">
      <button
        onClick={() => navigate('/shops')}
        className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white font-bold py-4 rounded-2xl hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
      >
        <span>{buttonText}</span>
        <ArrowLeft size={20} />
      </button>
    </div>
  );
};
