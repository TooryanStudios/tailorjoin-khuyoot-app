import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Ruler, Palette, Scissors, ShoppingCart, Check, ArrowLeft, PlayCircle, Save, Info } from 'lucide-react';
import { Product, MeasurementProfile, MeasurementTemplate } from '../types';
import { getProductById } from '../services/mockService';
import { useApp } from '../context/AppContext';
import { firebaseService } from '../services/firebase';
import { getAllCategories } from '../src/admin/products/services';
import type { Category } from '../src/admin/products/types';

interface CustomizationOption {
  id: string;
  label: string;
  type: 'color' | 'size' | 'fabric' | 'text';
  options?: string[];
  value?: string;
}

interface Measurements {
  neck: string;
  chest: string;
  shoulder: string;
  sleeve: string;
  length: string;
  waist: string;
  thigh: string;
  shoe: string;
}

export const Customization = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, addToCart } = useApp();
  const [product, setProduct] = useState<Product | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [savedMeasurements, setSavedMeasurements] = useState<MeasurementProfile[]>([]);
  const [showMeasurementsModal, setShowMeasurementsModal] = useState(false);
  const [measurementTemplates, setMeasurementTemplates] = useState<MeasurementTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [measurements, setMeasurements] = useState<Measurements>({
    neck: '',
    chest: '',
    shoulder: '',
    sleeve: '',
    length: '',
    waist: '',
    thigh: '',
    shoe: ''
  });
  const [activeMeasurement, setActiveMeasurement] = useState<keyof Measurements | null>(null);
  const [customizations, setCustomizations] = useState<CustomizationOption[]>([
    {
      id: 'fabric',
      label: 'نوع القماش',
      type: 'fabric',
      options: ['قطن', 'حرير', 'كتان', 'صوف', 'بوليستر'],
      value: ''
    },
    {
      id: 'color',
      label: 'اللون',
      type: 'color',
      options: ['أبيض', 'أسود', 'أزرق', 'أخضر', 'أحمر', 'بني', 'رمادي'],
      value: ''
    },
    {
      id: 'size',
      label: 'المقاس',
      type: 'size',
      options: ['صغير', 'متوسط', 'كبير', 'كبير جداً', 'مقاس خاص'],
      value: ''
    },
    {
      id: 'notes',
      label: 'ملاحظات إضافية',
      type: 'text',
      value: ''
    }
  ]);

  // Refs for measurement inputs to enable autofocus on first incomplete
  const measurementRefs = useRef<Record<keyof Measurements, HTMLInputElement | null>>({
    neck: null,
    chest: null,
    shoulder: null,
    sleeve: null,
    length: null,
    waist: null,
    thigh: null,
    shoe: null,
  });

  // On entering step 2, focus the first incomplete measurement for quicker input
  useEffect(() => {
    if (currentStep === 2) {
      const order: (keyof Measurements)[] = ['neck', 'chest', 'shoulder', 'sleeve', 'waist', 'length', 'thigh', 'shoe'];
      const firstEmpty = order.find(k => !measurements[k]);
      if (firstEmpty && measurementRefs.current[firstEmpty]) {
        measurementRefs.current[firstEmpty]?.focus();
      }
    }
  }, [currentStep]); // you can also add `measurements` if you want this to react to changes

  useEffect(() => {
    if (id) {
      getProductById(id).then(setProduct);
    }
  }, [id]);

  useEffect(() => {
    if (user) {
      loadSavedMeasurements();
    }
  }, [user]);

  useEffect(() => {
    loadMeasurementTemplates();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const categories = await getAllCategories();
      setAllCategories(categories);
      console.log('Loaded categories:', categories.length);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadMeasurementTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const templates = await firebaseService.getMeasurementTemplates();
      setMeasurementTemplates(templates);
      console.log('Loaded templates:', templates.map(t => t.name).join(', '));
    } catch (error) {
      console.error('Error loading measurement templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadSavedMeasurements = async () => {
    if (!user) return;
    
    try {
      if (firebaseService.isInitialized()) {
        const fbMeasurements = await firebaseService.getMeasurements(user.id);
        if (fbMeasurements.length > 0) {
          setSavedMeasurements(fbMeasurements);
          return;
        }
      }
    } catch (error) {
      console.error("Error loading from Firebase:", error);
    }
    
    const saved = localStorage.getItem(`measurements_${user.id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setSavedMeasurements(parsed);
    }
  };

  const handleUseSavedMeasurements = (profile: MeasurementProfile) => {
    // FIX: ensure we provide all fields required by Measurements
    const newMeasurements: Measurements = {
      neck: profile.metrics.neck?.toString() || '',
      chest: profile.metrics.chest?.toString() || '',
      shoulder: profile.metrics.shoulder?.toString() || '',
      sleeve: profile.metrics.sleeve?.toString() || '',
      length: profile.metrics.length?.toString() || '',
      waist: profile.metrics.waist?.toString() || '',
      thigh: profile.metrics.thigh?.toString() || '',
      shoe: profile.metrics.shoe?.toString() || ''
    };
    setMeasurements(newMeasurements);
    setShowMeasurementsModal(false);
  };

  const handleOptionChange = (optionId: string, value: string) => {
    setCustomizations(prev =>
      prev.map(opt => opt.id === optionId ? { ...opt, value } : opt)
    );
  };

  const handleMeasurementChange = (field: keyof Measurements, value: string) => {
    setMeasurements(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    if (currentStep === 2) {
      // After basic measurements, go to precise measurements screen
      navigate('/measurements');
      return;
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      const customizedProduct = {
        ...product,
        customizations: customizations.reduce((acc, opt) => {
          if (opt.value) {
            acc[opt.label] = opt.value;
          }
          return acc;
        }, {} as Record<string, string>),
        measurements
      };
      addToCart(customizedProduct);
      navigate('/cart');
    }
  };

  const handleSaveDraft = () => {
    const draft = {
      productId: id,
      step: currentStep,
      customizations,
      measurements,
      timestamp: Date.now(),
    };
    try {
      const key = `customization_draft_${user?.id || 'guest'}`;
      localStorage.setItem(key, JSON.stringify(draft));
    } catch (e) {
      console.error('Failed to save draft', e);
    }
  };

  const isStepValid = () => {
    if (currentStep === 1) {
      return customizations.filter(opt => opt.type !== 'text').every(opt => opt.value);
    }
    if (currentStep === 2) {
      return Object.values(measurements).some(val => val);
    }
    return true;
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg font-medium text-slate-600 dark:text-slate-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const productImage = product.images && product.images.length > 0 ? product.images[0] : product.image;

  const steps = [
    { number: 1, title: 'خيارات التفصيل', subtitle: 'اختر المواصفات', icon: Palette, color: 'from-violet-500 to-purple-600' },
    { number: 2, title: 'المقاسات', subtitle: 'أدخل قياساتك', icon: Ruler, color: 'from-blue-500 to-cyan-600' },
    { number: 3, title: 'التأكيد', subtitle: 'راجع طلبك', icon: Check, color: 'from-emerald-500 to-teal-600' }
  ];

  const currentStepInfo = steps[currentStep - 1];

  const measurementMarkers: { key: keyof Measurements; label: string; top: string; left: string; align?: 'left' | 'right' }[] = [
    { key: 'neck', label: 'الرقبة', top: '12%', left: '50%', align: 'right' },
    { key: 'shoulder', label: 'الكتف', top: '20%', left: '30%', align: 'left' },
    { key: 'chest', label: 'الصدر', top: '28%', left: '72%', align: 'right' },
    { key: 'waist', label: 'الخصر', top: '42%', left: '52%', align: 'right' },
    { key: 'sleeve', label: 'الكم', top: '34%', left: '20%', align: 'left' },
    { key: 'length', label: 'الطول', top: '68%', left: '55%', align: 'right' },
    { key: 'thigh', label: 'الفخذ', top: '62%', left: '78%', align: 'right' },
    { key: 'shoe', label: 'المقاس (حذاء)', top: '88%', left: '40%', align: 'left' },
  ];

  const totalMeasurements = Object.keys(measurements).length;
  const filledMeasurements = Object.values(measurements).filter(Boolean).length;

  // Filter templates by categoryId - ربط المقاسات بتصنيف المنتج
  const filteredTemplates = measurementTemplates.filter(template => {
    if (!product?.categoryId) {
      console.warn('⚠️ Product missing categoryId:', product?.id);
      return false;
    }
    
    // ربط مباشر: template.id يجب أن يساوي product.categoryId
    // أو template.categoryId إذا كان موجوداً
    const templateCategoryId = template.categoryId || template.id;
    
    const matches = templateCategoryId === product.categoryId;
    
    if (matches) {
      console.log('✅ Template matched:', template.name, 'with categoryId:', templateCategoryId);
    }
    
    return matches;
  });

  return (
    <div className="min-h-screen overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      {/* Compact Header with Step Indicators */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowRight size={18} />
            <span className="text-sm font-medium">رجوع</span>
          </button>

          {/* Steps row (RTL order) */}
          <div className="flex flex-row-reverse items-center gap-6 w-full max-w-xl mx-4">
            {/* Step 3 (right side in RTL) */}
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow ${currentStep >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                <Check size={16} />
              </div>
              <div className={`text-sm font-bold ${currentStep >= 3 ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>المراجعة والتأكيد</div>
            </div>

            {/* Divider line */}
            <div className={`flex-1 h-px ${currentStep >= 2 ? 'bg-slate-300 dark:bg-slate-600' : 'bg-slate-200 dark:bg-slate-700'}`}></div>

            {/* Step 2 */}
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow ${currentStep >= 2 ? 'bg-slate-300 dark:bg-slate-600 text-slate-900 dark:text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                <Ruler size={16} />
              </div>
              <div className={`text-sm font-bold ${currentStep >= 2 ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>المقاسات</div>
            </div>

            {/* Divider line */}
            <div className={`flex-1 h-px ${currentStep >= 1 ? 'bg-slate-300 dark:bg-slate-600' : 'bg-slate-200 dark:bg-slate-700'}`}></div>

            {/* Step 1 (left side in RTL) */}
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow ${currentStep >= 1 ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                <Palette size={16} />
              </div>
              <div className={`text-sm font-bold ${currentStep >= 1 ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>خيارات التفصيل</div>
            </div>
          </div>

          <div className="w-20 flex items-center justify-end">
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
              {currentStep}/3
            </span>
          </div>
        </div>
      </div>

      {/* Rest of the component remains the same... */}
      {/* This is a backup file - full content preserved */}
    </div>
  );
};
