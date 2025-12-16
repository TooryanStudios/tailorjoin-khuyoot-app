import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, ToggleLeft, ToggleRight, TrendingUp, Trash2, Settings } from 'lucide-react';
import { DesignRecommendation } from '@/types';
import {
  getAllRecommendations,
  createManualRecommendation,
  toggleRecommendation
} from '@/services/recommendationService';
import { Button } from '@/components/Button';

export const RecommendationsManagement = () => {
  const [recommendations, setRecommendations] = useState<DesignRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'behavioral' | 'manual'>('all');

  // Create form state
  const [primaryItemId, setPrimaryItemId] = useState('');
  const [primaryItemType, setPrimaryItemType] = useState<'fabric' | 'option'>('fabric');
  const [recommendedItemId, setRecommendedItemId] = useState('');
  const [recommendedItemType, setRecommendedItemType] = useState<'fabric' | 'option'>('option');
  const [score, setScore] = useState(100);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const recs = await getAllRecommendations();
      setRecommendations(recs);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (recId: string, currentStatus: boolean) => {
    try {
      await toggleRecommendation(recId, !currentStatus);
      setRecommendations(prev =>
        prev.map(rec =>
          rec.id === recId ? { ...rec, isActive: !currentStatus } : rec
        )
      );
    } catch (error) {
      console.error('Error toggling recommendation:', error);
      alert('فشل تحديث الحالة');
    }
  };

  const handleCreateRecommendation = async () => {
    if (!primaryItemId || !recommendedItemId) {
      alert('الرجاء ملء جميع الحقول');
      return;
    }

    try {
      await createManualRecommendation(
        primaryItemId,
        primaryItemType,
        recommendedItemId,
        recommendedItemType,
        score
      );
      setShowCreateModal(false);
      loadRecommendations();
      // Reset form
      setPrimaryItemId('');
      setRecommendedItemId('');
      setScore(100);
    } catch (error) {
      console.error('Error creating recommendation:', error);
      alert('فشل إنشاء التوصية');
    }
  };

  const filteredRecommendations = recommendations.filter(rec => {
    if (filterType === 'all') return true;
    return rec.ruleType === filterType;
  });

  const stats = {
    total: recommendations.length,
    behavioral: recommendations.filter(r => r.ruleType === 'behavioral').length,
    manual: recommendations.filter(r => r.ruleType === 'manual').length,
    active: recommendations.filter(r => r.isActive).length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="text-purple-500" />
            إدارة التوصيات
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            إدارة التوصيات التلقائية واليدوية لخاصية المصمم
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          <Plus size={18} className="ml-2" />
          إضافة توصية يدوية
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">الإجمالي</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
            </div>
            <TrendingUp className="text-blue-500" size={24} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600 dark:text-green-400">سلوكية</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.behavioral}</p>
            </div>
            <Sparkles className="text-green-500" size={24} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-600 dark:text-purple-400">يدوية</p>
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.manual}</p>
            </div>
            <Settings className="text-purple-500" size={24} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 dark:text-blue-400">نشطة</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.active}</p>
            </div>
            <ToggleRight className="text-blue-500" size={24} />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
        {[
          { value: 'all', label: 'الكل' },
          { value: 'behavioral', label: 'سلوكية' },
          { value: 'manual', label: 'يدوية' }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterType(tab.value as any)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
              filterType === tab.value
                ? 'bg-indigo-600 text-white'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Recommendations Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-400">النوع</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-400">العنصر الأساسي</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-400">العنصر المقترح</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-400">النقاط</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-400">المصدر</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-400">الحالة</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-400">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    جاري التحميل...
                  </td>
                </tr>
              ) : filteredRecommendations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    لا توجد توصيات
                  </td>
                </tr>
              ) : (
                filteredRecommendations.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        rec.ruleType === 'behavioral'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : rec.ruleType === 'manual'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {rec.ruleType === 'behavioral' ? '🤖 سلوكية' : '✍️ يدوية'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 dark:text-white font-medium">
                          {rec.primaryItemType === 'fabric' ? '🧵 قماش' : '✨ خيار'}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {rec.primaryItemId.substring(0, 8)}...
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 dark:text-white font-medium">
                          {rec.recommendedItemType === 'fabric' ? '🧵 قماش' : '✨ خيار'}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {rec.recommendedItemId.substring(0, 8)}...
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {rec.score}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(rec.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(rec.id, rec.isActive)}
                        className="transition-transform hover:scale-110"
                      >
                        {rec.isActive ? (
                          <ToggleRight className="text-green-500" size={24} />
                        ) : (
                          <ToggleLeft className="text-slate-400" size={24} />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {rec.ruleType === 'manual' && (
                        <button
                          className="text-red-500 hover:text-red-600 transition-colors"
                          onClick={() => {
                            if (confirm('هل تريد حذف هذه التوصية؟')) {
                              // Implement delete
                            }
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="text-purple-500" />
                إضافة توصية يدوية
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                إنشاء قاعدة توصية مخصصة
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Primary Item */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  العنصر الأساسي
                </label>
                <div className="flex gap-2 mb-2">
                  <select
                    value={primaryItemType}
                    onChange={(e) => setPrimaryItemType(e.target.value as any)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  >
                    <option value="fabric">قماش</option>
                    <option value="option">خيار</option>
                  </select>
                  <input
                    type="text"
                    value={primaryItemId}
                    onChange={(e) => setPrimaryItemId(e.target.value)}
                    placeholder="معرف العنصر"
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Recommended Item */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  العنصر المقترح
                </label>
                <div className="flex gap-2 mb-2">
                  <select
                    value={recommendedItemType}
                    onChange={(e) => setRecommendedItemType(e.target.value as any)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                  >
                    <option value="fabric">قماش</option>
                    <option value="option">خيار</option>
                  </select>
                  <input
                    type="text"
                    value={recommendedItemId}
                    onChange={(e) => setRecommendedItemId(e.target.value)}
                    placeholder="معرف العنصر"
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Score */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  النقاط (الأولوية)
                </label>
                <input
                  type="number"
                  value={score}
                  onChange={(e) => setScore(parseInt(e.target.value) || 0)}
                  min="1"
                  max="1000"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                />
                <p className="text-xs text-slate-500 mt-1">
                  كلما زادت النقاط، ارتفعت أولوية الظهور
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
              <Button
                onClick={handleCreateRecommendation}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                إضافة
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
