import React, { useState, useEffect } from 'react';
import { Save, Loader2, Layout, Type, Image as ImageIcon, MousePointer2 } from 'lucide-react';
import { ProductPageConfig } from '../../../types';
import { useApp } from '../../../context/AppContext';

export const ProductPageSettings = () => {
  const { appSettings, saveAppSettings } = useApp();
  const [config, setConfig] = useState<ProductPageConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (appSettings?.productPageConfig) {
      setConfig(JSON.parse(JSON.stringify(appSettings.productPageConfig))); // Deep copy
    } else {
      // Initialize with defaults if not set
      setConfig({
        buttons: {
          tryFabric: {
            enabled: true,
            title: "جربي القماش",
            subtitle: "تصور بالذكاء الاصطناعي",
            cta: "فتح المصمم",
            mediaType: 'graphic',
            graphicType: 'fabric'
          },
          measurements: {
            enabled: true,
            title: "المقاسات",
            subtitle: "أدخلي مقاساتك",
            cta: "تكوين",
            mediaType: 'graphic',
            graphicType: 'measurements'
          }
        },
        thumbnails: {
          size: 80,
          gap: 12,
          borderRadius: 16,
          aspectRatio: 'video'
        }
      });
    }
  }, [appSettings]);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await saveAppSettings({
        ...appSettings,
        productPageConfig: config
      });
    } catch (error) {
      console.error('Failed to save config', error);
    } finally {
      setSaving(false);
    }
  };

  const updateButton = (key: 'tryFabric' | 'measurements', field: string, value: any) => {
    if (!config) return;
    setConfig({
      ...config,
      buttons: {
        ...config.buttons,
        [key]: {
          ...config.buttons[key],
          [field]: value
        }
      }
    });
  };

  const updateThumbnails = (field: string, value: any) => {
    if (!config) return;
    setConfig({
      ...config,
      thumbnails: {
        ...config.thumbnails,
        [field]: value
      }
    });
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">إعدادات صفحة المنتج</h2>
          <p className="text-slate-500 mt-1">تخصيص مظهر وسلوك صفحة تفاصيل المنتج</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          حفظ التغييرات
        </button>
      </div>

      {/* Action Buttons Configuration */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-lime-500/10 rounded-lg">
            <MousePointer2 className="text-lime-500" size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">أزرار الإجراءات (Start Tailoring)</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Try Fabric Button */}
          <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-900 dark:text-white">زر "جربي القماش"</h4>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={config.buttons.tryFabric.enabled}
                  onChange={(e) => updateButton('tryFabric', 'enabled', e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-lime-300 dark:peer-focus:ring-lime-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-lime-500"></div>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">العنوان الرئيسي</label>
              <input
                type="text"
                value={config.buttons.tryFabric.title}
                onChange={(e) => updateButton('tryFabric', 'title', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">العنوان الفرعي</label>
              <input
                type="text"
                value={config.buttons.tryFabric.subtitle}
                onChange={(e) => updateButton('tryFabric', 'subtitle', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">نص الزر (CTA)</label>
              <input
                type="text"
                value={config.buttons.tryFabric.cta}
                onChange={(e) => updateButton('tryFabric', 'cta', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">نوع الوسائط</label>
              <select
                value={config.buttons.tryFabric.mediaType}
                onChange={(e) => updateButton('tryFabric', 'mediaType', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
              >
                <option value="graphic">رسم توضيحي (SVG)</option>
                <option value="image">صورة</option>
              </select>
            </div>
          </div>

          {/* Measurements Button */}
          <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-900 dark:text-white">زر "المقاسات"</h4>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={config.buttons.measurements.enabled}
                  onChange={(e) => updateButton('measurements', 'enabled', e.target.checked)}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-lime-300 dark:peer-focus:ring-lime-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-lime-500"></div>
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">العنوان الرئيسي</label>
              <input
                type="text"
                value={config.buttons.measurements.title}
                onChange={(e) => updateButton('measurements', 'title', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">العنوان الفرعي</label>
              <input
                type="text"
                value={config.buttons.measurements.subtitle}
                onChange={(e) => updateButton('measurements', 'subtitle', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">نص الزر (CTA)</label>
              <input
                type="text"
                value={config.buttons.measurements.cta}
                onChange={(e) => updateButton('measurements', 'cta', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">نوع الوسائط</label>
              <select
                value={config.buttons.measurements.mediaType}
                onChange={(e) => updateButton('measurements', 'mediaType', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent"
              >
                <option value="graphic">رسم توضيحي (SVG)</option>
                <option value="image">صورة</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnails Configuration */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <ImageIcon className="text-blue-500" size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">معرض الصور (Thumbnails)</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">حجم الصورة (px)</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="50"
                max="300"
                step="10"
                value={config.thumbnails.size}
                onChange={(e) => updateThumbnails('size', parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="w-12 text-center font-mono bg-slate-100 dark:bg-slate-700 rounded px-2 py-1 text-sm">
                {config.thumbnails.size}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">المسافة بين الصور (Gap)</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="40"
                step="2"
                value={config.thumbnails.gap}
                onChange={(e) => updateThumbnails('gap', parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="w-12 text-center font-mono bg-slate-100 dark:bg-slate-700 rounded px-2 py-1 text-sm">
                {config.thumbnails.gap}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">استدارة الحواف (Border Radius)</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="50"
                step="2"
                value={config.thumbnails.borderRadius}
                onChange={(e) => updateThumbnails('borderRadius', parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="w-12 text-center font-mono bg-slate-100 dark:bg-slate-700 rounded px-2 py-1 text-sm">
                {config.thumbnails.borderRadius}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">نسبة العرض للارتفاع</label>
            <div className="grid grid-cols-3 gap-2">
              {['square', 'video', 'portrait'].map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => updateThumbnails('aspectRatio', ratio)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    config.thumbnails.aspectRatio === ratio
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                  }`}
                >
                  {ratio === 'square' ? 'مربع 1:1' : ratio === 'video' ? 'فيديو 16:9' : 'طولي 3:4'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview Box */}
        <div className="mt-8 p-6 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
          <h4 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">معاينة حية</h4>
          <div 
            className="grid" 
            style={{ 
              gridTemplateColumns: `repeat(auto-fill, minmax(${config.thumbnails.size}px, 1fr))`,
              gap: config.thumbnails.gap
            }}
          >
            {[1, 2, 3].map((i) => (
              <div 
                key={i}
                className="bg-slate-300 dark:bg-slate-700 flex items-center justify-center relative overflow-hidden"
                style={{ 
                  borderRadius: config.thumbnails.borderRadius,
                  aspectRatio: config.thumbnails.aspectRatio === 'video' ? '16/9' : config.thumbnails.aspectRatio === 'square' ? '1/1' : '3/4'
                }}
              >
                <ImageIcon className="text-slate-400 dark:text-slate-500" size={24} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
