import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MeasurementProfile, GarmentType, MeasurementTemplate } from '../types';
import { firebaseService } from '../services/firebase';
import { 
  Plus, Ruler, Edit2, Trash2, ChevronLeft, Save, X, 
  Shirt, User, Crown, AlertCircle, Loader2 
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
        if (firebaseService.isInitialized()) {
          await firebaseService.deleteMeasurement(id);
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-slate-400" />
          <p className="text-slate-600 dark:text-slate-400">يجب تسجيل الدخول لعرض المقاسات</p>
          <Button onClick={() => navigate('/account')} className="mt-4">
            تسجيل الدخول
          </Button>
        </div>
      </div>
    );
  }

  // -------------------- RENDER --------------------
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050817] pb-24 pt-6 px-4">
      {/* DEBUG PANEL (hidden unless debug enabled) */}
      <DebugPanel title="Debug Info - Measurements.tsx">
        <div className="grid gap-2 text-sm font-mono">
          <div className="flex gap-2">
            <span className="text-yellow-700 dark:text-yellow-300 font-bold">User:</span>
            <span className="text-yellow-900 dark:text-yellow-100">
              {user ? `${user.name} (${user.id})` : 'No user'}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-yellow-700 dark:text-yellow-300 font-bold">Route State:</span>
            <span className="text-yellow-900 dark:text-yellow-100 text-xs overflow-auto max-h-20">
              {state ? JSON.stringify(state, null, 2) : 'No state'}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-yellow-700 dark:text-yellow-300 font-bold">Product ID:</span>
            <span className="text-yellow-900 dark:text-yellow-100">
              {state?.productId || 'None'}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-yellow-700 dark:text-yellow-300 font-bold">Customization ID:</span>
            <span className="text-yellow-900 dark:text-yellow-100">
              {state?.customizationId || 'None'}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-yellow-700 dark:text-yellow-300 font-bold">Model Name:</span>
            <span className="text-yellow-900 dark:text-yellow-100">
              {state?.customizationData?.modelName || 'None'}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-yellow-700 dark:text-yellow-300 font-bold">Measurements Count:</span>
            <span className="text-yellow-900 dark:text-yellow-100">{measurements.length}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-yellow-700 dark:text-yellow-300 font-bold">Templates Count:</span>
            <span className="text-yellow-900 dark:text-yellow-100">
              {templates.length} {isTemplatesLoading && '(loading...)'}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-yellow-700 dark:text-yellow-300 font-bold">Template IDs:</span>
            <span className="text-yellow-900 dark:text-yellow-100 text-xs overflow-auto max-h-20">
              {templates.map(t => t.id).join(', ') || 'None'}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-yellow-700 dark:text-yellow-300 font-bold">Rule:</span>
            <span className="text-yellow-900 dark:text-yellow-100">Template.id === Product.categoryId</span>
          </div>
          <div className="flex gap-2">
            <span className="text-yellow-700 dark:text-yellow-300 font-bold">Match Category:</span>
            <span className="text-yellow-900 dark:text-yellow-100">{product?.categoryId || 'None'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-yellow-700 dark:text-yellow-300 font-bold">Matched Template ID:</span>
            <span className="text-yellow-900 dark:text-yellow-100">{matchedTemplate?.id || 'None'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-yellow-700 dark:text-yellow-300 font-bold">Comparison:</span>
            <span className="text-yellow-900 dark:text-yellow-100">T.id = {matchedTemplate?.id || '—'} | P.categoryId = {product?.categoryId || '—'}{matchedTemplate ? ' ✅' : ' ❌'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-yellow-700 dark:text-yellow-300 font-bold">Form Type:</span>
            <span className="text-yellow-900 dark:text-yellow-100">{formData.type}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-yellow-700 dark:text-yellow-300 font-bold">Is Adding:</span>
            <span className="text-yellow-900 dark:text-yellow-100">{isAddingNew ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-yellow-700 dark:text-yellow-300 font-bold">Editing ID:</span>
            <span className="text-yellow-900 dark:text-yellow-100">{editingId || 'None'}</span>
          </div>
        </div>
      </DebugPanel>

      {/* Product Info Card */}
      {state?.customizationData && (
        <div className="mb-6 max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">👔</span>
              </div>
              <div className="flex-1">
                <p className="text-xs text-white/80 mb-1">المنتج المراد قياسه</p>
                <h2 className="text-lg font-bold text-white mb-1">
                  {state.customizationData.modelName || 'تصميم مخصص'}
                </h2>
                <div className="flex gap-2 flex-wrap">
                  {state.customizationData.modelId && (
                    <span className="px-2 py-0.5 bg-white/20 backdrop-blur rounded-full text-xs text-white font-medium">
                      {state.customizationData.modelId}
                    </span>
                  )}
                  {state.customizationId && (
                    <span className="px-2 py-0.5 bg-white/20 backdrop-blur rounded-full text-xs text-white font-medium">
                      ID: {state.customizationId.slice(0, 8)}...
                    </span>
                  )}
                </div>
              </div>
              {state.customizationData.fabricUrl && (
                <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-white/30 flex-shrink-0">
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

      <div className="max-w-4xl mx-auto">
        {/* ==================== SECTION 1: PAGE HEADER ==================== */}
        {/* العنوان الرئيسي + زر الرجوع */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/account')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronLeft size={24} className="text-slate-700 dark:text-slate-300" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Ruler size={28} className="text-blue-600" />
              جدول المقاسات
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              احفظ مقاساتك لسهولة الطلب مستقبلاً
            </p>
          </div>
        </div>

        {/* ==================== SECTION 2: ADMIN TEMPLATES DISPLAY ==================== */}
        {/* عرض القوالب المخزنة من لوحة التحكم (تظهر فقط عند عدم التعديل/الإضافة) */}
        {!isAddingNew && !editingId && templates.length > 0 && (
          <div className="mb-6 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Ruler size={24} className="text-blue-600" />
                  قوالب القياسات المتاحة
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  قوالب مرجعية لمساعدتك في أخذ القياسات الصحيحة
                </p>
              </div>
              {isTemplatesLoading && <Loader2 size={20} className="animate-spin text-blue-500" />}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div key={template.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900/40">
                  <div className="p-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <p className="font-semibold text-slate-800 dark:text-white">{template.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {template.description || 'قالب قياس مرجعي'}
                    </p>
                  </div>
                  <TemplatePreview template={template} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== SECTION 3: ADD NEW MEASUREMENT BUTTON ==================== */}
        {/* زر إضافة مقاس جديد (يظهر فقط عند عدم التعديل/الإضافة) */}
        {!isAddingNew && !editingId && (
          <Button
            onClick={handleAddNew}
            className="w-full mb-6 flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            إضافة مقاس جديد
          </Button>
        )}

        {/* ==================== SECTION 4: ADD/EDIT FORM ==================== */}
        {/* نموذج إضافة أو تعديل مقاس (يظهر عند الضغط على إضافة أو تعديل) */}
        {(isAddingNew || editingId) && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-6 border border-slate-200 dark:border-slate-700 shadow-lg">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              {editingId ? 'تعديل المقاس' : 'مقاس جديد'}
            </h2>

            {/* ---------- SUB-SECTION 4.1: MEASUREMENT NAME ---------- */}
            {/* حقل اسم المقاس */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                اسم المقاس <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: مقاسي الشخصي، مقاس أحمد، مقاس العيد"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white"
              />
            </div>

            {/* ---------- SUB-SECTION 4.2: GARMENT TYPE SELECTOR ---------- */}
            {/* اختيار نوع اللباس */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                نوع اللباس <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(measurementTemplates) as GarmentType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, type, metrics: {} })}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      formData.type === type
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                        : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      {getGarmentIcon(type)}
                      <span className="text-xs font-medium">{measurementTemplates[type].label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ---------- SUB-SECTION 4.3: TEMPLATE REFERENCE GUIDE ---------- */}
            {/* قالب مرجعي من لوحة التحكم (يظهر داخل النموذج كمرجع) */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-slate-800 dark:text-white">
                  <Ruler size={18} className="text-blue-600" />
                  <span className="font-semibold">القالب المضاف من لوحة التحكم</span>
                </div>
                {isTemplatesLoading && <Loader2 size={16} className="animate-spin text-blue-500" />}
              </div>

              {visibleTemplates.length > 0 && selectedTemplateId ? (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white">
                        {visibleTemplates.find((t) => t.id === selectedTemplateId)?.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {visibleTemplates.find((t) => t.id === selectedTemplateId)?.description || 'قالب قياس مرجعي لهذا النوع'}
                      </p>
                    </div>
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    >
                      {visibleTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <TemplatePreview template={visibleTemplates.find((t) => t.id === selectedTemplateId)!} />
                </div>
              ) : (
                !isTemplatesLoading && (
                  <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-sm text-slate-500 dark:text-slate-400">
                    لا يوجد قالب مرئي لهذا النوع حتى الآن. سيظهر هنا أي قالب يضيفه الأدمن.
                  </div>
                )
              )}
            </div>

            {/* ---------- SUB-SECTION 4.4: MEASUREMENT FIELDS INPUT ---------- */}
            {/* حقول إدخال المقاسات */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                المقاسات (بالسنتيمتر)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {measurementTemplates[formData.type].fields.map((field) => (
                  <div key={field.key} className="flex items-center gap-2">
                    <label className="text-sm text-slate-600 dark:text-slate-400 min-w-[100px]">
                      {field.label}
                    </label>
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="number"
                        step="0.5"
                        value={formData.metrics[field.key] || ''}
                        onChange={(e) => handleMetricChange(field.key, e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white"
                      />
                      <span className="text-xs text-slate-500 dark:text-slate-400 min-w-[30px]">
                        {field.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ---------- SUB-SECTION 4.5: NOTES FIELD ---------- */}
            {/* ملاحظات إضافية */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                ملاحظات إضافية (اختياري)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="أي ملاحظات خاصة بهذا المقاس..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white resize-none"
              />
            </div>

            {/* ---------- SUB-SECTION 4.6: SAVE/CANCEL BUTTONS ---------- */}
            {/* أزرار الحفظ والإلغاء */}
            <div className="flex gap-3">
              <Button onClick={handleSave} className="flex-1 flex items-center justify-center gap-2">
                <Save size={18} />
                حفظ المقاس
              </Button>
              <button
                onClick={handleCancel}
                className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
              >
                <X size={18} />
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* ==================== SECTION 5: SAVED MEASUREMENTS LIST ==================== */}
        {/* قائمة المقاسات المحفوظة */}
        <div className="space-y-4">
          {/* ---------- EMPTY STATE ---------- */}
          {/* رسالة عند عدم وجود مقاسات */}
          {measurements.length === 0 && !isAddingNew && !editingId && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700">
              <Ruler size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                لا توجد مقاسات محفوظة
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                ابدأ بإضافة مقاسك الأول لتسهيل عملية الطلب
              </p>
              <Button onClick={handleAddNew} className="flex items-center gap-2 mx-auto">
                <Plus size={20} />
                إضافة مقاس جديد
              </Button>
            </div>
          )}

          {/* ---------- MEASUREMENT CARDS ---------- */}
          {/* بطاقات المقاسات المحفوظة */}
          {measurements.map((measurement) => (
            <div
              key={measurement.id}
              className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
            >
              {/* ----- CARD HEADER: Name, Type, Edit/Delete Buttons ----- */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    {getGarmentIcon(measurement.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                      {measurement.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {measurementTemplates[measurement.type].label}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(measurement)}
                    className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(measurement.id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* ----- METRICS GRID: Display all measurements ----- */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                {Object.entries(measurement.metrics).map(([key, value]) => {
                  const field = measurementTemplates[measurement.type].fields.find(f => f.key === key);
                  if (!field) return null;
                  return (
                    <div key={key} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                        {field.label}
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {value} <span className="text-sm font-normal text-slate-500">{field.unit}</span>
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* ----- NOTES SECTION ----- */}
              {measurement.notes && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-medium">ملاحظات:</span> {measurement.notes}
                  </p>
                </div>
              )}

              {/* ----- LAST UPDATE DATE ----- */}
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <p className="text-xs text-slate-400">
                  آخر تحديث: {new Date(measurement.updatedAt).toLocaleDateString('ar-OM')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==================== TEMPLATE PREVIEW COMPONENT ====================
// مكون عرض القالب المرجعي مع النقاط والخطوط
const TemplatePreview: React.FC<{ template: MeasurementTemplate }> = ({ template }) => {
  const ordered = [...template.points].sort((a, b) => (a.order || 0) - (b.order || 0));
  const showFallbackBg = !template.baseImageUrl;

  return (
    <div className="relative h-[360px] rounded-b-2xl overflow-hidden bg-slate-50 dark:bg-slate-900/40">
      {template.baseImageUrl ? (
        <img src={template.baseImageUrl} alt={template.name} className="absolute inset-0 w-full h-full object-contain" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
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
                stroke="#2563eb"
                strokeWidth={1.5}
                markerEnd="url(#arrowhead-guide-display)"
                opacity={showFallbackBg ? 0.25 : 0.9}
              />
            );
          })}
          <defs>
            <marker id="arrowhead-guide-display" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L6,3 z" fill="#2563eb" />
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
              <div className="relative w-9 h-9 rounded-full border-2 border-blue-500 bg-white/90 text-blue-700 flex items-center justify-center text-xs font-bold shadow-sm">
                {point.order || idx + 1}
              </div>
              <div className="h-px w-10 bg-blue-400/60" />
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-100 bg-white/90 dark:bg-slate-900/70 shadow">
                <span>{point.label || 'نقطة'}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
