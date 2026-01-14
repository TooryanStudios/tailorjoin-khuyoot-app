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
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -ml-32 -mb-32" />

      <div className="relative flex items-center gap-4 mb-10">
        <div className="p-3 bg-pink-500/20 rounded-2xl border border-pink-500/20 shadow-inner">
          <Share2 className="text-pink-400" size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">روابط السوشيال ميديا</h2>
          <p className="text-slate-400 mt-1">أضف روابط حساباتك على منصات التواصل الاجتماعي</p>
        </div>
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white/5 rounded-2xl border border-white/5 p-6 hover:border-pink-500/30 transition-colors group">
          <label className="block text-sm font-medium text-slate-400 mb-3 mr-1 flex items-center gap-2">
            <span className="text-xl group-hover:scale-125 transition-transform">📷</span>
            Instagram
          </label>
          <input
            type="url"
            value={socialMedia.instagram}
            onChange={(e) => setSocialMedia(prev => ({ ...prev, instagram: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition-all outline-none"
            placeholder="https://instagram.com/khuyoot"
          />
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/5 p-6 hover:border-blue-400/30 transition-colors group">
          <label className="block text-sm font-medium text-slate-400 mb-3 mr-1 flex items-center gap-2">
            <span className="text-xl group-hover:scale-125 transition-transform">🐦</span>
            Twitter / X
          </label>
          <input
            type="url"
            value={socialMedia.twitter}
            onChange={(e) => setSocialMedia(prev => ({ ...prev, twitter: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all outline-none"
            placeholder="https://twitter.com/khuyoot"
          />
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/5 p-6 hover:border-blue-600/30 transition-colors group">
          <label className="block text-sm font-medium text-slate-400 mb-3 mr-1 flex items-center gap-2">
            <span className="text-xl group-hover:scale-125 transition-transform">📘</span>
            Facebook
          </label>
          <input
            type="url"
            value={socialMedia.facebook}
            onChange={(e) => setSocialMedia(prev => ({ ...prev, facebook: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600/50 transition-all outline-none"
            placeholder="https://facebook.com/khuyoot"
          />
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/5 p-6 hover:border-green-500/30 transition-colors group">
          <label className="block text-sm font-medium text-slate-400 mb-3 mr-1 flex items-center gap-2">
            <span className="text-xl group-hover:scale-125 transition-transform">💬</span>
            WhatsApp Business
          </label>
          <input
            type="tel"
            value={socialMedia.whatsapp}
            onChange={(e) => setSocialMedia(prev => ({ ...prev, whatsapp: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all outline-none"
            placeholder="+96512345678"
          />
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/5 p-6 hover:border-slate-200/30 transition-colors group">
          <label className="block text-sm font-medium text-slate-400 mb-3 mr-1 flex items-center gap-2">
            <span className="text-xl group-hover:scale-125 transition-transform">🎵</span>
            TikTok
          </label>
          <input
            type="url"
            value={socialMedia.tiktok}
            onChange={(e) => setSocialMedia(prev => ({ ...prev, tiktok: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-slate-200/50 focus:border-slate-200/50 transition-all outline-none"
            placeholder="https://tiktok.com/@khuyoot"
          />
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/5 p-6 hover:border-yellow-400/30 transition-colors group">
          <label className="block text-sm font-medium text-slate-400 mb-3 mr-1 flex items-center gap-2">
            <span className="text-xl group-hover:scale-125 transition-transform">👻</span>
            Snapchat
          </label>
          <input
            type="url"
            value={socialMedia.snapchat}
            onChange={(e) => setSocialMedia(prev => ({ ...prev, snapchat: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400/50 transition-all outline-none"
            placeholder="https://snapchat.com/add/khuyoot"
          />
        </div>
      </div>

      {/* Sticky Save Bar */}
      <div className="sticky bottom-0 left-0 right-0 mt-10 -mx-8 -mb-8 p-6 bg-slate-900/80 backdrop-blur-md border-t border-white/10 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          {message && (
            <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 ${
              message.includes('✅') 
                ? 'bg-green-500/20 text-green-400 border border-green-500/20' 
                : 'bg-red-500/20 text-red-400 border border-red-500/20'
            }`}>
              {message}
            </div>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-3 bg-pink-600 hover:bg-pink-500 disabled:bg-slate-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-pink-900/20 hover:shadow-pink-500/40 disabled:cursor-not-allowed group"
        >
          <Save size={20} className={saving ? 'animate-spin' : 'group-hover:scale-110 transition-transform'} />
          {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
        </button>
      </div>
    </div>
  );
};
