import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Trash2, GripVertical, Edit2, Save, X } from 'lucide-react';
import { Button } from '../../../components/Button';
import { PopularRegion } from '../../../types';
import { firebaseService } from '../../../services/firebase';

export const RegionsManagement = () => {
  const [regions, setRegions] = useState<PopularRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRegion, setNewRegion] = useState({ name: '', nameEn: '', icon: '📍' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadRegions();
  }, []);

  const loadRegions = async () => {
    try {
      const data = await firebaseService.getPopularRegions();
      setRegions(data.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error('Error loading regions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRegion = async () => {
    if (!newRegion.name.trim()) {
      setMessage('❌ يرجى إدخال اسم المنطقة');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setSaving(true);
    try {
      const region: Omit<PopularRegion, 'id'> = {
        name: newRegion.name.trim(),
        nameEn: newRegion.nameEn.trim() || undefined,
        icon: newRegion.icon || '📍',
        order: regions.length,
        enabled: true,
        createdAt: new Date().toISOString(),
      };

      await firebaseService.addPopularRegion(region);
      await loadRegions();
      setNewRegion({ name: '', nameEn: '', icon: '📍' });
      setMessage('✅ تمت إضافة المنطقة بنجاح');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error adding region:', error);
      setMessage('❌ حدث خطأ أثناء الإضافة');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRegion = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المنطقة؟')) return;

    try {
      await firebaseService.deletePopularRegion(id);
      await loadRegions();
      setMessage('✅ تم حذف المنطقة بنجاح');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting region:', error);
      setMessage('❌ حدث خطأ أثناء الحذف');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleToggleEnabled = async (id: string, currentStatus: boolean) => {
    try {
      await firebaseService.updatePopularRegion(id, { enabled: !currentStatus });
      await loadRegions();
    } catch (error) {
      console.error('Error updating region:', error);
    }
  };

  const handleUpdateRegion = async (id: string, updates: Partial<PopularRegion>) => {
    try {
      await firebaseService.updatePopularRegion(id, updates);
      await loadRegions();
      setEditingId(null);
      setMessage('✅ تم تحديث المنطقة بنجاح');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating region:', error);
      setMessage('❌ حدث خطأ أثناء التحديث');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    
    const newRegions = [...regions];
    const temp = newRegions[index];
    newRegions[index] = newRegions[index - 1];
    newRegions[index - 1] = temp;
    
    // Update order
    for (let i = 0; i < newRegions.length; i++) {
      newRegions[i].order = i;
    }
    
    setRegions(newRegions);
    
    // Save to Firebase
    try {
      await Promise.all(newRegions.map(region => 
        firebaseService.updatePopularRegion(region.id, { order: region.order })
      ));
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === regions.length - 1) return;
    
    const newRegions = [...regions];
    const temp = newRegions[index];
    newRegions[index] = newRegions[index + 1];
    newRegions[index + 1] = temp;
    
    // Update order
    for (let i = 0; i < newRegions.length; i++) {
      newRegions[i].order = i;
    }
    
    setRegions(newRegions);
    
    // Save to Firebase
    try {
      await Promise.all(newRegions.map(region => 
        firebaseService.updatePopularRegion(region.id, { order: region.order })
      ));
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
          <MapPin className="text-green-600 dark:text-green-400" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">إدارة المناطق الشهيرة</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            إضافة وترتيب المناطق التي تظهر في الصفحة الرئيسية
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.startsWith('✅') ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
          {message}
        </div>
      )}

      {/* Add New Region */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">إضافة منطقة جديدة</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              اسم المنطقة (عربي) *
            </label>
            <input
              type="text"
              value={newRegion.name}
              onChange={(e) => setNewRegion({ ...newRegion, name: e.target.value })}
              placeholder="مثال: البريمي"
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              اسم المنطقة (EN)
            </label>
            <input
              type="text"
              value={newRegion.nameEn}
              onChange={(e) => setNewRegion({ ...newRegion, nameEn: e.target.value })}
              placeholder="Al Buraimi"
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              أيقونة
            </label>
            <input
              type="text"
              value={newRegion.icon}
              onChange={(e) => setNewRegion({ ...newRegion, icon: e.target.value })}
              placeholder="📍"
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white text-center text-2xl"
            />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={handleAddRegion} disabled={saving} className="flex items-center gap-2">
            <Plus size={18} />
            {saving ? 'جاري الإضافة...' : 'إضافة منطقة'}
          </Button>
        </div>
      </div>

      {/* Regions List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            المناطق المضافة ({regions.length})
          </h2>
        </div>

        {regions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <MapPin size={48} className="mx-auto mb-4 opacity-30" />
            <p>لا توجد مناطق مضافة بعد</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {regions.map((region, index) => (
              <div
                key={region.id}
                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                {editingId === region.id ? (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <input
                      type="text"
                      defaultValue={region.name}
                      onBlur={(e) => handleUpdateRegion(region.id, { name: e.target.value })}
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      defaultValue={region.nameEn || ''}
                      onBlur={(e) => handleUpdateRegion(region.id, { nameEn: e.target.value })}
                      placeholder="English name"
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      defaultValue={region.icon || '📍'}
                      onBlur={(e) => handleUpdateRegion(region.id, { icon: e.target.value })}
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-center text-xl"
                    />
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Save size={16} />
                      حفظ
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === regions.length - 1}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ▼
                        </button>
                      </div>
                      
                      <GripVertical className="text-slate-400" size={20} />
                      
                      <div className="text-3xl">{region.icon || '📍'}</div>
                      
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{region.name}</div>
                        {region.nameEn && (
                          <div className="text-xs text-slate-500 dark:text-slate-400">{region.nameEn}</div>
                        )}
                      </div>
                      
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        region.enabled
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}>
                        {region.enabled ? 'مفعّل' : 'معطّل'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleEnabled(region.id, region.enabled)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          region.enabled
                            ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                        }`}
                      >
                        {region.enabled ? 'تعطيل' : 'تفعيل'}
                      </button>
                      
                      <button
                        onClick={() => setEditingId(region.id)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteRegion(region.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold mt-0.5">
            ℹ
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-1">ملاحظات</h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• المناطق المفعّلة فقط ستظهر في الصفحة الرئيسية</li>
              <li>• يمكنك تغيير ترتيب المناطق باستخدام الأسهم ↑↓</li>
              <li>• الأيقونة يمكن أن تكون emoji أو نص</li>
              <li>• بعد التعديل، سيتم تحديث الصفحة الرئيسية تلقائياً</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
