// Designer V2.1 Themed Measurements Page - Updated Jan 7, 2026
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MeasurementProfile, GarmentType, MeasurementTemplate } from '../types';
import { firebaseService } from '../services/firebase';
import { 
  Plus, Ruler, Edit2, Trash2, ChevronLeft, Save, X, 
  Shirt, User, Crown, AlertCircle, Loader2, Home, Settings, 
  FileText, Bookmark, Info
} from 'lucide-react';
import { Button } from '../components/Button';
import DebugPanel from '../components/DebugPanel';

// ==================== MEASUREMENT TEMPLATES ====================
// قوالب المقاسات الثابتة حسب نوع اللباس
// تحتوي على الحقول المطلوبة لكل نوع (الطول، الكتف، الصدر، إلخ)
const measurementTemplates: Record<GarmentType, { label: string; fields: { key: string; label: string; unit: string }[] }> = {
  dishdasha: {
    label: 'دشداشة / ثوب',
    fields: [
      { key: 'length', label: 'الطول', unit: 'سم' },
      { key: 'shoulder', label: 'الكتف', unit: 'سم' },
      { key: 'chest', label: 'الصدر', unit: 'سم' },
      { key: 'waist', label: 'الوسط', unit: 'سم' },
      { key: 'sleeve', label: 'كم اليد', unit: 'سم' },
      { key: 'neck', label: 'الرقبة', unit: 'سم' },
      { key: 'armhole', label: 'حجر الإبط', unit: 'سم' },
    ]
  },
  thobe: {
    label: 'ثوب',
    fields: [
      { key: 'length', label: 'الطول', unit: 'سم' },
      { key: 'shoulder', label: 'الكتف', unit: 'سم' },
      { key: 'chest', label: 'الصدر', unit: 'سم' },
      { key: 'waist', label: 'الوسط', unit: 'سم' },
      { key: 'sleeve', label: 'كم اليد', unit: 'سم' },
      { key: 'neck', label: 'الرقبة', unit: 'سم' },
    ]
  },
  abaya: {
    label: 'عباية',
    fields: [
      { key: 'length', label: 'الطول الكلي', unit: 'سم' },
      { key: 'shoulder', label: 'الكتف', unit: 'سم' },
      { key: 'bust', label: 'الصدر', unit: 'سم' },
      { key: 'waist', label: 'الوسط', unit: 'سم' },
      { key: 'hips', label: 'الأرداف', unit: 'سم' },
      { key: 'sleeve', label: 'طول الكم', unit: 'سم' },
      { key: 'armhole', label: 'حجر الإبط', unit: 'سم' },
    ]
  },
  dress: {
    label: 'فستان',
    fields: [
      { key: 'length', label: 'الطول', unit: 'سم' },
      { key: 'bust', label: 'الصدر', unit: 'سم' },
      { key: 'waist', label: 'الوسط', unit: 'سم' },
      { key: 'hips', label: 'الأرداف', unit: 'سم' },
      { key: 'shoulder', label: 'الكتف', unit: 'سم' },
      { key: 'sleeve', label: 'طول الكم', unit: 'سم' },
    ]
  },
  omani: {
    label: 'لباس عماني',
    fields: [
      { key: 'length', label: 'الطول', unit: 'سم' },
      { key: 'shoulder', label: 'الكتف', unit: 'سم' },
      { key: 'chest', label: 'الصدر', unit: 'سم' },
      { key: 'waist', label: 'الوسط', unit: 'سم' },
      { key: 'sleeve', label: 'كم اليد', unit: 'سم' },
      { key: 'neck', label: 'الرقبة', unit: 'سم' },
    ]
  },
  dhofari: {
    label: 'لباس ظفاري',
    fields: [
      { key: 'length', label: 'الطول', unit: 'سم' },
      { key: 'shoulder', label: 'الكتف', unit: 'سم' },
      { key: 'chest', label: 'الصدر', unit: 'سم' },
      { key: 'waist', label: 'الوسط', unit: 'سم' },
      { key: 'sleeve', label: 'كم اليد', unit: 'سم' },
    ]
  },
  suri: {
    label: 'لباس صوري',
    fields: [
      { key: 'length', label: 'الطول', unit: 'سم' },
      { key: 'shoulder', label: 'الكتف', unit: 'سم' },
      { key: 'chest', label: 'الصدر', unit: 'سم' },
      { key: 'waist', label: 'الوسط', unit: 'سم' },
      { key: 'sleeve', label: 'كم اليد', unit: 'سم' },
    ]
  },
  shirt: {
    label: 'قميص',
    fields: [
      { key: 'neck', label: 'الرقبة', unit: 'سم' },
      { key: 'chest', label: 'الصدر', unit: 'سم' },
      { key: 'waist', label: 'الوسط', unit: 'سم' },
      { key: 'sleeve', label: 'طول الكم', unit: 'سم' },
      { key: 'shoulder', label: 'الكتف', unit: 'سم' },
      { key: 'length', label: 'الطول', unit: 'سم' },
    ]
  },
  suit: {
    label: 'بدلة',
    fields: [
      { key: 'chest', label: 'الصدر', unit: 'سم' },
      { key: 'waist', label: 'الوسط', unit: 'سم' },
      { key: 'shoulder', label: 'الكتف', unit: 'سم' },
      { key: 'sleeve', label: 'طول الكم', unit: 'سم' },
      { key: 'jacketLength', label: 'طول الجاكيت', unit: 'سم' },
      { key: 'pantsLength', label: 'طول البنطلون', unit: 'سم' },
      { key: 'inseam', label: 'الداخلية', unit: 'سم' },
    ]
  },
  other: {
    label: 'أخرى',
    fields: [
      { key: 'measurement1', label: 'مقاس 1', unit: 'سم' },
      { key: 'measurement2', label: 'مقاس 2', unit: 'سم' },
      { key: 'measurement3', label: 'مقاس 3', unit: 'سم' },
      { key: 'measurement4', label: 'مقاس 4', unit: 'سم' },
    ]
  },
};

// ==================== MAIN COMPONENT ====================
export const Measurements = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as any;
  
  // -------------------- STATE MANAGEMENT --------------------
  // حالة المقاسات المحفوظة
  const [measurements, setMeasurements] = useState<MeasurementProfile[]>([]);
  // حالة نموذج الإضافة/التعديل
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  // حالة القوالب المرجعية من قاعدة البيانات
  const [templates, setTemplates] = useState<MeasurementTemplate[]>([]);
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [product, setProduct] = useState<any | null>(null);
  const [matchedTemplate, setMatchedTemplate] = useState<MeasurementTemplate | null>(null);

  // بيانات النموذج
  const [formData, setFormData] = useState<{
    name: string;
    type: GarmentType;
    metrics: Record<string, number>;
    notes: string;
  }>({
    name: '',
    type: 'dishdasha',
    metrics: {},
    notes: '',
  });

  // -------------------- EFFECTS --------------------
  // تحميل المقاسات عند تسجيل الدخول
  useEffect(() => {
    console.log('[DEBUG Measurements.tsx] useEffect [user] triggered, user:', user);
    if (user) {
      console.log('[DEBUG Measurements.tsx] User found, loading measurements...');
      loadMeasurements();
    } else {
      console.log('[DEBUG Measurements.tsx] No user, skipping load');
    }
  }, [user]);

  // تحميل القوالب المرجعية من قاعدة البيانات
  useEffect(() => {
    console.log('[DEBUG Measurements.tsx] Loading measurement templates...');
    const loadTemplates = async () => {
      setIsTemplatesLoading(true);
      try {
        const data = await firebaseService.getMeasurementTemplates();
        console.log('[DEBUG Measurements.tsx] Templates loaded:', data.length, 'templates');
        setTemplates(data);
      } catch (error) {
        console.error('[DEBUG Measurements.tsx] Error loading templates:', error);
      } finally {
        setIsTemplatesLoading(false);
      }
    };
    loadTemplates();
  }, []);

  // Load product (if productId was passed in route state)
  useEffect(() => {
    const pid = (state as any)?.productId;
    if (!pid) return;
    const run = async () => {
      try {
        const p = await firebaseService.getProduct(pid);
        setProduct(p);
        console.log('[DEBUG Measurements.tsx] Loaded product for matching:', p?.id, p?.categoryId || p?.category);
      } catch (e) {
        console.warn('[DEBUG Measurements.tsx] Failed to load product for matching:', e);
      }
    };
    run();
  }, [state]);

  // Handle edit mode from Account page navigation
  useEffect(() => {
    const editId = state?.editId;
    if (!editId || measurements.length === 0) return;
    
    const measurementToEdit = measurements.find(m => m.id === editId);
    if (measurementToEdit) {
      handleEdit(measurementToEdit);
      console.log('[DEBUG Measurements.tsx] Auto-editing measurement:', editId);
    }
  }, [state?.editId, measurements]);

  // Match template by strict rule: Template.id === Product.categoryId
  useEffect(() => {
    const categoryId = product?.categoryId;
    if (!categoryId || templates.length === 0) {
      setMatchedTemplate(null);
      return;
    }
    const match = templates.find(t => t.id === categoryId) || null;
    setMatchedTemplate(match);
    if (match) console.log('[DEBUG Measurements.tsx] Matched template for categoryId', categoryId, '=>', match.id);
  }, [product?.categoryId, templates]);

  // -------------------- DATA LOADING FUNCTIONS --------------------
  // تحميل المقاسات من Firebase أو localStorage
  const loadMeasurements = async () => {
    console.log('[DEBUG Measurements.tsx] loadMeasurements called, user:', user);
    if (!user) {
      console.log('[DEBUG Measurements.tsx] No user, exiting loadMeasurements');
      return;
    }
    
    try {
      // Try to load from Firebase first
      console.log('[DEBUG Measurements.tsx] Attempting to load from Firebase...');
      const { firebaseService } = await import('../services/firebase');
      if (firebaseService.isInitialized()) {
        const fbMeasurements = await firebaseService.getMeasurements(user.id);
        console.log('[DEBUG Measurements.tsx] Firebase measurements loaded:', fbMeasurements.length, 'items');
        if (fbMeasurements.length > 0) {
          setMeasurements(fbMeasurements);
          console.log('[DEBUG Measurements.tsx] Using Firebase measurements');
          return;
        }
      } else {
        console.log('[DEBUG Measurements.tsx] Firebase not initialized');
      }
    } catch (error) {
      console.error("[DEBUG Measurements.tsx] Error loading from Firebase:", error);
    }
    
    // Fallback to localStorage
    console.log('[DEBUG Measurements.tsx] Falling back to localStorage...');
    const saved = localStorage.getItem(`measurements_${user.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log('[DEBUG Measurements.tsx] localStorage found:', parsed.length, 'items');
      // إزالة التكرارات عند القراءة
      const uniqueMeasurements = Array.from(
        new Map(parsed.map((item: MeasurementProfile) => [item.id, item])).values()
      );
      console.log('[DEBUG Measurements.tsx] After deduplication:', uniqueMeasurements.length, 'items');
      setMeasurements(uniqueMeasurements);
      // حفظ النسخة المنظفة
      if (parsed.length !== uniqueMeasurements.length) {
        console.log('[DEBUG Measurements.tsx] Cleaned duplicates, saving...');
        localStorage.setItem(`measurements_${user.id}`, JSON.stringify(uniqueMeasurements));
      }
    } else {
      console.log('[DEBUG Measurements.tsx] No localStorage data found');
    }
  };

  // حفظ المقاسات إلى localStorage و Firebase
  const saveMeasurements = async (newMeasurements: MeasurementProfile[]) => {
    // إزالة التكرارات بناءً على ID قبل الحفظ
    const uniqueMeasurements = Array.from(
      new Map(newMeasurements.map(item => [item.id, item])).values()
    );
    
    // Save to localStorage as backup
    localStorage.setItem(`measurements_${user?.id}`, JSON.stringify(uniqueMeasurements));
    setMeasurements(uniqueMeasurements);
    
    // Try to sync with Firebase
    try {
      const { firebaseService } = await import('../services/firebase');
      if (firebaseService.isInitialized()) {
        for (const measurement of uniqueMeasurements) {
          await firebaseService.saveMeasurement(measurement);
        }
      }
    } catch (error) {
      console.error("Error syncing to Firebase:", error);
    }
  };

  // -------------------- FORM HANDLERS --------------------
  // فتح نموذج إضافة مقاس جديد
  const handleAddNew = () => {
    console.log('[DEBUG Measurements.tsx] handleAddNew called');
    setIsAddingNew(true);
    setFormData({
      name: '',
      type: 'dishdasha',
      metrics: {},
      notes: '',
    });
    console.log('[DEBUG Measurements.tsx] Form opened with type: dishdasha');
  };

  // فتح نموذج تعديل مقاس موجود
  const handleEdit = (measurement: MeasurementProfile) => {
    setEditingId(measurement.id);
    setFormData({
      name: measurement.name,
      type: measurement.type,
      metrics: measurement.metrics,
      notes: measurement.notes || '',
    });
  };

  // إلغاء نموذج الإضافة/التعديل
  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setFormData({
      name: '',
      type: 'dishdasha',
      metrics: {},
      notes: '',
    });
  };

  // حفظ المقاس (إضافة أو تعديل)
  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('الرجاء إدخال اسم للمقاس');
      return;
    }

    const now = new Date().toISOString();

    if (editingId) {
      // تحديث مقاس موجود
      const updated = measurements.map(m =>
        m.id === editingId
          ? { ...m, ...formData, updatedAt: now }
          : m
      );
      saveMeasurements(updated);
    } else {
      // إضافة مقاس جديد
      const newMeasurement: MeasurementProfile = {
        id: `measurement_${Date.now()}`,
        userId: user?.id || '',
        ...formData,
        createdAt: now,
        updatedAt: now,
      };
      saveMeasurements([...measurements, newMeasurement]);
    }

    handleCancel();
  };

  // حذف مقاس
  const handleDelete = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المقاس؟')) {
      // Delete from Firebase
      try {
        const { firebaseService } = await import('../services/firebase');
        if (firebaseService.isInitialized() && user) {
          await firebaseService.deleteMeasurement(id, user.id);
        }
      } catch (error) {
        console.error("Error deleting from Firebase:", error);
      }
      
      // Update local state
      saveMeasurements(measurements.filter(m => m.id !== id));
    }
  };

  // تحديث قيمة حقل مقاس معين
  const handleMetricChange = (key: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setFormData(prev => ({
        ...prev,
        metrics: { ...prev.metrics, [key]: numValue }
      }));
    } else if (value === '') {
      const newMetrics = { ...formData.metrics };
      delete newMetrics[key];
      setFormData(prev => ({ ...prev, metrics: newMetrics }));
    }
  };

  // -------------------- HELPER FUNCTIONS --------------------
  // الحصول على أيقونة حسب نوع اللباس
  const getGarmentIcon = (type: GarmentType) => {
    switch (type) {
      case 'dishdasha':
      case 'thobe':
      case 'omani':
      case 'dhofari':
      case 'suri':
        return <Shirt size={20} />;
      case 'abaya':
      case 'dress':
        return <User size={20} />;
      case 'suit':
        return <Crown size={20} />;
      default:
        return <Ruler size={20} />;
    }
  };

  // فلترة القوالب المناسبة حسب النوع المختار
  // إذا لم يوجد قالب مطابق، يعرض أي قالب متاح كمرجع
  const visibleTemplates = (() => {
    const matching = templates.filter((t) => t.productType === formData.type);
    if (matching.length > 0) return matching;
    return templates.length > 0 ? templates : [];
  })();

  // تحديث القالب المختار عند تغيير النوع
  useEffect(() => {
    if (visibleTemplates.length > 0) {
      // اختر أول قالب افتراضي للعرض عند تغير النوع أو عند غياب تطابقات نرجع لأول قالب متاح
      setSelectedTemplateId((prev) => {
        const stillExists = visibleTemplates.some((t) => t.id === prev);
        return stillExists ? prev : visibleTemplates[0].id;
      });
    } else {
      setSelectedTemplateId(null);
    }
  }, [formData.type, visibleTemplates]);

  // -------------------- AUTHENTICATION CHECK --------------------
  // التحقق من تسجيل الدخول
  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center">
            <AlertCircle size={40} className="text-zinc-600" />
          </div>
          <p className="text-zinc-400 mb-6">يجب تسجيل الدخول لعرض المقاسات</p>
          <button 
            onClick={() => navigate('/account')} 
            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all active:scale-95"
          >
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  // -------------------- RENDER --------------------
  return (
    <div className="h-screen flex flex-col bg-zinc-950 overflow-hidden">
      {/* ========== TOP HEADER BAR ========== */}
      <header className="flex-shrink-0 h-14 px-4 flex items-center justify-between border-b border-zinc-800 bg-zinc-950">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-zinc-900 rounded-lg transition-colors"
            title="الرئيسية"
          >
            <Home size={20} className="text-zinc-400" />
          </button>
          <div className="h-6 w-px bg-zinc-800" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Ruler size={16} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white">المقاسات</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/account')}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-lg border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="text-xs text-zinc-300">{user?.name || 'المستخدم'}</span>
          </button>
        </div>
      </header>

      {/* ========== MAIN LAYOUT: SIDEBAR + CONTENT ========== */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* ========== LEFT SIDEBAR ========== */}
        <aside className="w-[320px] flex-shrink-0 bg-zinc-950 border-l border-zinc-800 flex flex-col overflow-hidden">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-zinc-800">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">المقاسات المحفوظة</h2>
            <button
              onClick={handleAddNew}
              disabled={isAddingNew || !!editingId}
              className={`w-full px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border ${
                isAddingNew || editingId
                  ? 'bg-purple-600/30 text-purple-300 cursor-not-allowed border-purple-500/20'
                  : 'bg-purple-600 hover:bg-purple-500 text-white active:scale-95 border-purple-500/40'
              }`}
            >
              <Plus size={18} />
              إضافة مقاس جديد
            </button>
          </div>

          {/* Measurements List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {measurements.length === 0 && !isAddingNew && !editingId ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-900 border-2 border-dashed border-zinc-700 flex items-center justify-center">
                  <Ruler size={24} className="text-zinc-600" />
                </div>
                <p className="text-sm text-zinc-500">لا توجد مقاسات محفوظة</p>
                <p className="text-xs text-zinc-600 mt-1">أضف مقاسك الأول للبدء</p>
              </div>
            ) : (
              measurements.map((measurement) => (
                <div
                  key={measurement.id}
                  className={`group p-3 rounded-xl border transition-all cursor-pointer ${
                    editingId === measurement.id
                      ? 'bg-purple-500/10 border-purple-500/40'
                      : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                  }`}
                  onClick={() => !editingId && handleEdit(measurement)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      {getGarmentIcon(measurement.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">{measurement.name}</h4>
                      <p className="text-xs text-zinc-500">{measurementTemplates[measurement.type].label}</p>
                      <p className="text-[10px] text-zinc-600 mt-1">
                        {new Date(measurement.updatedAt).toLocaleDateString('ar-OM')}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEdit(measurement); }}
                        title="تعديل"
                        className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-purple-400 rounded-lg transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(measurement.id); }}
                        title="حذف"
                        className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sidebar Footer: Templates Section */}
          {templates.length > 0 && (
            <div className="border-t border-zinc-800 p-3">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer select-none text-xs font-semibold text-zinc-400 uppercase tracking-wider py-2">
                  <span className="flex items-center gap-2">
                    <FileText size={14} />
                    القوالب المرجعية ({templates.length})
                  </span>
                  {isTemplatesLoading && <Loader2 size={12} className="animate-spin" />}
                </summary>
                <div className="mt-2 space-y-1">
                  {templates.slice(0, 3).map((template) => (
                    <div
                      key={template.id}
                      className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800 text-xs"
                    >
                      <span className="text-zinc-300">{template.name}</span>
                    </div>
                  ))}
                  {templates.length > 3 && (
                    <p className="text-[10px] text-zinc-500 text-center py-1">
                      +{templates.length - 3} قوالب أخرى
                    </p>
                  )}
                </div>
              </details>
            </div>
          )}
        </aside>

        {/* ========== MAIN CONTENT AREA ========== */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden bg-zinc-950">
          {/* Content Scrollable Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-6 max-w-4xl mx-auto">
              
              {/* DEBUG PANEL */}
              <DebugPanel title="Debug Info - Measurements.tsx">
                <div className="grid gap-2 text-sm font-mono">
                  <div className="flex gap-2">
                    <span className="text-purple-400 font-bold">User:</span>
                    <span className="text-zinc-300">
                      {user ? `${user.name} (${user.id})` : 'No user'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-purple-400 font-bold">Measurements:</span>
                    <span className="text-zinc-300">{measurements.length}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-purple-400 font-bold">Templates:</span>
                    <span className="text-zinc-300">
                      {templates.length} {isTemplatesLoading && '(loading...)'}
                    </span>
                  </div>
                </div>
              </DebugPanel>

              {/* Product Info Card */}
              {state?.customizationData && (
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-4 border border-purple-500/30">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">👔</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-purple-400 uppercase tracking-wider mb-1">المنتج المراد قياسه</p>
                        <h2 className="text-lg font-bold text-white">
                          {state.customizationData.modelName || 'تصميم مخصص'}
                        </h2>
                      </div>
                      {state.customizationData.fabricUrl && (
                        <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-purple-500/30 flex-shrink-0">
                          <img 
                            src={state.customizationData.fabricUrl} 
                            alt="القماش المختار" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ========== EMPTY STATE (No Form Open) ========== */}
              {!isAddingNew && !editingId && measurements.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-24 h-24 rounded-full bg-zinc-900 border-2 border-dashed border-zinc-700 flex items-center justify-center mb-6">
                    <Ruler size={40} className="text-zinc-600" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">ابدأ بإضافة مقاساتك</h3>
                  <p className="text-zinc-500 text-center max-w-md mb-6">
                    احفظ مقاساتك لتسهيل عملية الطلب. يمكنك إضافة مقاسات لأنواع مختلفة من الملابس.
                  </p>
                  <button
                    onClick={handleAddNew}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Plus size={20} />
                    إضافة مقاس جديد
                  </button>
                </div>
              )}

              {/* ========== ADD/EDIT FORM ========== */}
              {(isAddingNew || editingId) && (
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                  {/* Form Header */}
                  <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      {editingId ? (
                        <>
                          <Edit2 size={20} className="text-purple-400" />
                          تعديل المقاس
                        </>
                      ) : (
                        <>
                          <Plus size={20} className="text-purple-400" />
                          مقاس جديد
                        </>
                      )}
                    </h2>
                    <button
                      onClick={handleCancel}
                      title="إلغاء"
                      className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Measurement Name */}
                    <div>
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
                        اسم المقاس <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="مثال: مقاسي الشخصي، مقاس أحمد"
                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40"
                      />
                    </div>

                    {/* Garment Type Selector */}
                    <div>
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 block">
                        نوع اللباس <span className="text-red-400">*</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {(Object.keys(measurementTemplates) as GarmentType[]).map((type) => (
                          <button
                            key={type}
                            onClick={() => setFormData({ ...formData, type, metrics: {} })}
                            className={`p-3 rounded-xl border transition-all ${
                              formData.type === type
                                ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-purple-500/50 hover:text-zinc-300'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-2">
                              {getGarmentIcon(type)}
                              <span className="text-xs font-medium">{measurementTemplates[type].label}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Template Reference */}
                    {visibleTemplates.length > 0 && selectedTemplateId && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <Info size={14} />
                            قالب مرجعي
                          </label>
                          {visibleTemplates.length > 1 && (
                            <select
                              value={selectedTemplateId}
                              onChange={(e) => setSelectedTemplateId(e.target.value)}
                              title="اختر قالباً مرجعياً"
                              className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                            >
                              {visibleTemplates.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <div className="rounded-xl border border-zinc-800 overflow-hidden">
                          <TemplatePreview template={visibleTemplates.find((t) => t.id === selectedTemplateId)!} />
                        </div>
                      </div>
                    )}

                    {/* Measurement Fields */}
                    <div>
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 block">
                        المقاسات (بالسنتيمتر)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {measurementTemplates[formData.type].fields.map((field) => (
                          <div key={field.key} className="flex items-center gap-3 p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                            <label className="text-sm text-zinc-400 min-w-[80px]">
                              {field.label}
                            </label>
                            <div className="flex-1 flex items-center gap-2">
                              <input
                                type="number"
                                step="0.5"
                                value={formData.metrics[field.key] || ''}
                                onChange={(e) => handleMetricChange(field.key, e.target.value)}
                                placeholder="0"
                                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                              />
                              <span className="text-xs text-zinc-500 min-w-[30px]">
                                {field.unit}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
                        ملاحظات إضافية (اختياري)
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="أي ملاحظات خاصة بهذا المقاس..."
                        rows={3}
                        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/40 resize-none"
                      />
                    </div>
                  </div>

                  {/* Form Footer: Action Buttons */}
                  <div className="p-4 border-t border-zinc-800 flex gap-3">
                    <button
                      onClick={handleSave}
                      className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Save size={18} />
                      حفظ المقاس
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <X size={18} />
                      إلغاء
                    </button>
                  </div>
                </div>
              )}

              {/* ========== SAVED MEASUREMENTS GRID (When no form is open) ========== */}
              {!isAddingNew && !editingId && measurements.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      المقاسات المحفوظة ({measurements.length})
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {measurements.map((measurement) => (
                      <div
                        key={measurement.id}
                        className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-colors"
                      >
                        {/* Card Header */}
                        <div className="p-4 border-b border-zinc-800 flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                              {getGarmentIcon(measurement.type)}
                            </div>
                            <div>
                              <h3 className="font-bold text-white text-lg">{measurement.name}</h3>
                              <p className="text-sm text-zinc-500">{measurementTemplates[measurement.type].label}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEdit(measurement)}
                              title="تعديل"
                              className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-purple-400 rounded-lg transition-colors"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(measurement.id)}
                              title="حذف"
                              className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="p-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {Object.entries(measurement.metrics).map(([key, value]) => {
                              const field = measurementTemplates[measurement.type].fields.find(f => f.key === key);
                              if (!field) return null;
                              return (
                                <div key={key} className="bg-zinc-950 rounded-lg p-3 border border-zinc-800">
                                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
                                    {field.label}
                                  </p>
                                  <p className="text-lg font-bold text-white">
                                    {value} <span className="text-xs font-normal text-zinc-500">{field.unit}</span>
                                  </p>
                                </div>
                              );
                            })}
                          </div>

                          {/* Notes */}
                          {measurement.notes && (
                            <div className="mt-3 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                              <p className="text-xs text-zinc-400">
                                <span className="text-zinc-500">ملاحظات:</span> {measurement.notes}
                              </p>
                            </div>
                          )}

                          {/* Last Update */}
                          <div className="mt-3 pt-3 border-t border-zinc-800 flex justify-between items-center">
                            <p className="text-[10px] text-zinc-500">
                              آخر تحديث: {new Date(measurement.updatedAt).toLocaleDateString('ar-OM')}
                            </p>
                            <button
                              onClick={() => handleEdit(measurement)}
                              className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
                            >
                              تعديل
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ========== ADMIN TEMPLATES DISPLAY ========== */}
              {!isAddingNew && !editingId && templates.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                      <Bookmark size={14} />
                      قوالب القياسات المتاحة
                    </h2>
                    {isTemplatesLoading && <Loader2 size={14} className="animate-spin text-purple-400" />}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {templates.map((template) => (
                      <div key={template.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                        <div className="p-4 border-b border-zinc-800">
                          <p className="font-semibold text-white">{template.name}</p>
                          <p className="text-xs text-zinc-500 mt-1">
                            {template.description || 'قالب قياس مرجعي'}
                          </p>
                        </div>
                        <TemplatePreview template={template} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </main>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #3f3f46 transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3f3f46;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

// ==================== TEMPLATE PREVIEW COMPONENT ====================
// مكون عرض القالب المرجعي مع النقاط والخطوط
const TemplatePreview: React.FC<{ template: MeasurementTemplate }> = ({ template }) => {
  const ordered = [...template.points].sort((a, b) => (a.order || 0) - (b.order || 0));
  const showFallbackBg = !template.baseImageUrl;

  return (
    <div className="relative h-[320px] overflow-hidden bg-zinc-950">
      {template.baseImageUrl ? (
        <img src={template.baseImageUrl} alt={template.name} className="absolute inset-0 w-full h-full object-contain" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-600">
          لا توجد صورة للقالب
        </div>
      )}

      {ordered.length > 1 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
          {ordered.map((point, idx) => {
            const next = ordered[idx + 1];
            if (!next) return null;
            return (
              <line
                key={`${point.id}-${next.id}`}
                x1={point.x * 100}
                y1={point.y * 100}
                x2={next.x * 100}
                y2={next.y * 100}
                stroke="#a855f7"
                strokeWidth={1.5}
                markerEnd="url(#arrowhead-guide-display)"
                opacity={showFallbackBg ? 0.25 : 0.9}
              />
            );
          })}
          <defs>
            <marker id="arrowhead-guide-display" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L6,3 z" fill="#a855f7" />
            </marker>
          </defs>
        </svg>
      )}

      {template.points.map((point, idx) => {
        const isEven = idx % 2 === 0;
        const align = isEven ? 'flex-row' : 'flex-row-reverse';
        return (
          <div
            key={point.id}
            className="absolute"
            style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%`, transform: 'translate(-50%, -50%)' }}
          >
            <div className={`flex items-center gap-2 ${align}`}>
              <div className="relative w-8 h-8 rounded-full border-2 border-purple-500 bg-zinc-900/90 text-purple-300 flex items-center justify-center text-xs font-bold shadow-lg">
                {point.order || idx + 1}
              </div>
              <div className="h-px w-8 bg-purple-500/60" />
              <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-bold border-purple-500/30 text-purple-200 bg-zinc-900/90 shadow-lg">
                <span>{point.label || 'نقطة'}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
