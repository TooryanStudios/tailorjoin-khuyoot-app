import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { 
  Plus, Edit2, Trash2, ChevronLeft, Save, X, 
  Users, Home, AlertCircle, Loader2, Info
} from 'lucide-react';
import { firebaseService } from '../services/firebase';
import { FamilyMember, FamilyProfile } from '../types';
import { MontHeader } from '../src/components/MontHeader';

const FAMILY_RELATIONSHIPS = [
  { value: 'mother', label: 'الأم' },
  { value: 'father', label: 'الأب' },
  { value: 'sister', label: 'الأخت' },
  { value: 'brother', label: 'الأخ' },
  { value: 'daughter', label: 'الابنة' },
  { value: 'son', label: 'الابن' },
  { value: 'wife', label: 'الزوجة' },
  { value: 'husband', label: 'الزوج' },
  { value: 'other', label: 'أخرى' },
];

const MEASUREMENT_UNITS = [
  { value: 'cm', label: 'سنتيمتر' },
  { value: 'inch', label: 'بوصة' },
];

const BASIC_MEASUREMENTS = [
  { key: 'height', label: 'الطول' },
  { key: 'chest', label: 'الصدر' },
  { key: 'waist', label: 'الوسط' },
  { key: 'hips', label: 'الأرداف' },
  { key: 'shoulder', label: 'الكتف' },
  { key: 'sleeve', label: 'طول الكم' },
  { key: 'neck', label: 'الرقبة' },
];

export const FamilyMeasurements = () => {
  const { user, loading } = useApp();
  const navigate = useNavigate();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [measurementUnit, setMeasurementUnit] = useState('cm');

  const [formData, setFormData] = useState<Partial<FamilyMember>>({
    name: '',
    relationship: 'sister',
    measurements: {},
  });

  // Load family members
  useEffect(() => {
    if (user) {
      loadFamilyMembers();
    }
  }, [user]);

  const loadFamilyMembers = async () => {
    if (!user?.id) return;
    try {
      setIsLoading(true);
      const members = await firebaseService.getFamilyMembers(user.id);
      setFamilyMembers(members || []);
    } catch (error) {
      console.error('Error loading family members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setIsAdding(true);
    setFormData({
      name: '',
      relationship: 'sister',
      measurements: {},
    });
  };

  const handleEdit = (member: FamilyMember) => {
    setEditingId(member.id);
    setFormData({ ...member });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      name: '',
      relationship: 'sister',
      measurements: {},
    });
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      alert('الرجاء إدخال اسم العضو');
      return;
    }

    if (!user?.id) return;

    try {
      const now = new Date().toISOString();

      if (editingId) {
        // Update existing member
        const updated: FamilyMember = {
          ...(formData as FamilyMember),
          id: editingId,
          userId: user.id,
          updatedAt: now,
        };
        await firebaseService.saveFamilyMember(updated);
        setFamilyMembers(
          familyMembers.map(m => (m.id === editingId ? updated : m))
        );
      } else {
        // Add new member
        const newMember: FamilyMember = {
          id: `family_${Date.now()}`,
          userId: user.id,
          name: formData.name || '',
          relation: formData.relationship || 'sister',
          relationship: formData.relationship || 'sister',
          measurements: (formData.measurements as any) || {},
          createdAt: now,
          updatedAt: now,
        };
        await firebaseService.saveFamilyMember(newMember);
        setFamilyMembers([...familyMembers, newMember]);
      }

      handleCancel();
    } catch (error) {
      console.error('Error saving family member:', error);
      alert('فشل حفظ البيانات');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العضو؟')) return;

    if (!user?.id) return;

    try {
      await firebaseService.deleteFamilyMember(id, user.id);
      setFamilyMembers(familyMembers.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error deleting family member:', error);
      alert('فشل حذف البيانات');
    }
  };

  const handleMeasurementChange = (key: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setFormData(prev => ({
        ...prev,
        measurements: { ...prev.measurements, [key]: numValue }
      }));
    } else if (value === '') {
      const newMeasurements = { ...formData.measurements };
      delete newMeasurements[key];
      setFormData(prev => ({ ...prev, measurements: newMeasurements }));
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-[#ededed] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-[var(--theme-primary)] animate-spin" />
        <p className="text-[var(--theme-primary)] font-bold text-lg animate-pulse">جاري تحميل البيانات...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#ededed] flex flex-col">
        <MontHeader />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-[32px] overflow-hidden shadow-sm">
            <div className="bg-[var(--theme-primary)] p-8 text-center text-white">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={40} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-1">قياسات العائلة</h2>
              <p className="text-white/70 text-sm">سجل دخولك لحفظ قياسات أفراد عائلتك</p>
            </div>
            <div className="p-8">
              <button
                onClick={() => navigate('/login')}
                className="w-full h-14 bg-[var(--theme-primary)] text-white rounded-2xl font-bold hover:bg-[#523d74] transition-all"
              >
                تسجيل الدخول
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#ededed] font-['Cairo'] text-slate-900 flex flex-col">
      <div className="sticky top-0 z-50">
        <MontHeader />
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Header Banner */}
        <section className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto">
          <div className="bg-gradient-to-r from-[var(--theme-primary)] to-pink-600 rounded-2xl p-6 md:p-8 text-white">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Users size={24} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">قياسات العائلة</h1>
                <p className="text-white/70 text-sm mt-1">احفظ قياسات أفراد عائلتك لتسهيل الطلبات</p>
              </div>
            </div>
          </div>
        </section>

        <main className="px-4 md:px-8 py-4 max-w-[1400px] mx-auto pb-8">
          {/* Add Button */}
          {!isAdding && !editingId && (
            <div className="mb-6">
              <button
                onClick={handleAddNew}
                className="w-full px-6 py-3 bg-[var(--theme-primary)] text-white rounded-xl font-bold hover:bg-[#523d74] transition-all flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                إضافة عضو جديد
              </button>
            </div>
          )}

          {/* Family Members List */}
          {familyMembers.length === 0 && !isAdding && !editingId ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                <Users size={40} className="text-slate-300" />
              </div>
              <h3 className="text-xl text-slate-900 font-bold mb-2">لا توجد قياسات عائلية محفوظة</h3>
              <p className="text-slate-600 text-sm max-w-md mb-6">
                ابدأ بإضافة قياسات أفراد عائلتك لتسهيل عملية الطلب والتخصيص
              </p>
              <button
                onClick={handleAddNew}
                className="px-6 py-3 bg-[var(--theme-primary)] text-white rounded-xl font-bold hover:bg-[#523d74] transition-all flex items-center gap-2"
              >
                <Plus size={18} />
                إضافة أول عضو
              </button>
            </div>
          ) : (
            <>
              {/* Form */}
              {(isAdding || editingId) && (
                <div className="mb-6 bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900">
                      {editingId ? 'تعديل العضو' : 'إضافة عضو جديد'}
                    </h3>
                    <button
                      onClick={handleCancel}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      title="إغلاق"
                      aria-label="إغلاق النموذج"
                    >
                      <X size={20} className="text-slate-600" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        الاسم <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="مثال: فاطمة"
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
                      />
                    </div>

                    {/* Relationship */}
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        العلاقة <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.relationship || 'sister'}
                        onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
                        aria-label="اختر نوع العلاقة العائلية"
                      >
                        {FAMILY_RELATIONSHIPS.map(rel => (
                          <option key={rel.value} value={rel.value}>{rel.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Unit Selection */}
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-2 block">
                        وحدة القياس
                      </label>
                      <select
                        value={measurementUnit}
                        onChange={(e) => setMeasurementUnit(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
                        aria-label="اختر وحدة القياس"
                      >
                        {MEASUREMENT_UNITS.map(unit => (
                          <option key={unit.value} value={unit.value}>{unit.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Measurements */}
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-3 block">
                        القياسات (بـ {measurementUnit === 'cm' ? 'سنتيمتر' : 'بوصة'})
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {BASIC_MEASUREMENTS.map(field => (
                          <div key={field.key} className="flex items-center gap-2">
                            <label className="text-sm text-slate-600 min-w-[70px]">
                              {field.label}
                            </label>
                            <input
                              type="number"
                              step="0.5"
                              value={formData.measurements?.[field.key] || ''}
                              onChange={(e) => handleMeasurementChange(field.key, e.target.value)}
                              placeholder="0"
                              className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-center focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleSave}
                        className="flex-1 px-6 py-2 bg-[var(--theme-primary)] text-white rounded-lg font-bold hover:bg-[#523d74] transition-all flex items-center justify-center gap-2"
                      >
                        <Save size={18} />
                        حفظ
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex-1 px-6 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold hover:bg-slate-200 transition-all"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Members Grid */}
              {familyMembers.length > 0 && !isAdding && !editingId && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {familyMembers.map(member => (
                    <div
                      key={member.id}
                      className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-bold text-slate-900">{member.name}</h4>
                          <p className="text-xs text-slate-500 mt-1">
                            {FAMILY_RELATIONSHIPS.find(r => r.value === member.relationship)?.label || member.relationship}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(member)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-blue-600"
                            title="تعديل"
                            aria-label="تعديل هذا العضو"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(member.id)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-red-600"
                            title="حذف"
                            aria-label="حذف هذا العضو"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Measurements Display */}
                      {member.measurements && Object.keys(member.measurements).length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {BASIC_MEASUREMENTS.map(field => {
                            const value = member.measurements?.[field.key];
                            if (value === undefined || value === null) return null;
                            return (
                              <div key={field.key} className="text-xs">
                                <span className="text-slate-600">{field.label}:</span>
                                <span className="font-bold text-slate-900 ml-1">{value}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-3">لا توجد قياسات محفوظة</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
