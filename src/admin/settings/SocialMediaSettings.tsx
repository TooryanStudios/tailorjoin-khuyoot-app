import React, { useState, useEffect } from 'react';
import { Save, Share2 } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export const SocialMediaSettings: React.FC = () => {
  const { appSettings, saveAppSettings } = useApp();
  const [socialMedia, setSocialMedia] = useState({
    instagram: '',
    twitter: '',
    facebook: '',
    whatsapp: '',
    tiktok: '',
    snapchat: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (appSettings.socialMedia) {
      setSocialMedia({
        instagram: appSettings.socialMedia.instagram || '',
        twitter: appSettings.socialMedia.twitter || '',
        facebook: appSettings.socialMedia.facebook || '',
        whatsapp: appSettings.socialMedia.whatsapp || '',
        tiktok: appSettings.socialMedia.tiktok || '',
        snapchat: appSettings.socialMedia.snapchat || '',
      });
    }
  }, [appSettings]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      await saveAppSettings({
        ...appSettings,
        socialMedia
      }, { silent: true, optimistic: true });
      
      setMessage('✅ تم حفظ روابط السوشيال ميديا بنجاح');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving social media settings:', error);
      setMessage('❌ حدث خطأ أثناء الحفظ');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
          <Share2 className="text-pink-600 dark:text-pink-400" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">روابط السوشيال ميديا</h2>
          <p className="text-sm text-slate-500">أضف روابط حساباتك على منصات التواصل الاجتماعي</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            📷 Instagram
          </label>
          <input
            type="url"
            value={socialMedia.instagram}
            onChange={(e) => setSocialMedia(prev => ({ ...prev, instagram: e.target.value }))}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="https://instagram.com/khuyoot"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            🐦 Twitter / X
          </label>
          <input
            type="url"
            value={socialMedia.twitter}
            onChange={(e) => setSocialMedia(prev => ({ ...prev, twitter: e.target.value }))}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="https://twitter.com/khuyoot"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            📘 Facebook
          </label>
          <input
            type="url"
            value={socialMedia.facebook}
            onChange={(e) => setSocialMedia(prev => ({ ...prev, facebook: e.target.value }))}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="https://facebook.com/khuyoot"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            💬 WhatsApp Business
          </label>
          <input
            type="tel"
            value={socialMedia.whatsapp}
            onChange={(e) => setSocialMedia(prev => ({ ...prev, whatsapp: e.target.value }))}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="+96512345678"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            🎵 TikTok
          </label>
          <input
            type="url"
            value={socialMedia.tiktok}
            onChange={(e) => setSocialMedia(prev => ({ ...prev, tiktok: e.target.value }))}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="https://tiktok.com/@khuyoot"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            👻 Snapchat
          </label>
          <input
            type="url"
            value={socialMedia.snapchat}
            onChange={(e) => setSocialMedia(prev => ({ ...prev, snapchat: e.target.value }))}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder="https://snapchat.com/add/khuyoot"
          />
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-pink-600 hover:bg-pink-700 disabled:bg-slate-400 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
        >
          <Save size={20} />
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
        {message && (
          <span className={`text-sm font-medium ${message.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
};
