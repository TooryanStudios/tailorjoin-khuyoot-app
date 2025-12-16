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
  }, [currentStep]);

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
    const newMeasurements: Measurements = {
      neck: profile.metrics.neck?.toString() || '',
      chest: profile.metrics.chest?.toString() || '',
      shoulder: profile.metrics.shoulder?.toString() || '',
      sleeve: profile.metrics.sleeve?.toString() || '',
      length: profile.metrics.length?.toString() || '',
      waist: profile.metrics.waist?.toString() || ''
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

      <div className="max-w-7xl mx-auto p-4 lg:p-6 pb-64 lg:pb-24">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Main Content - Reduced width */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-6">
            {/* Section: Product Title */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white">{product.name}</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{product.category}</p>
                </div>
                <div className="text-xl lg:text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{product.price.toFixed(0)} ريال</div>
              </div>
            </div>
            {/* Step 1: Customization */}
            {currentStep === 1 && (
              <div className="space-y-4">
                {customizations.filter(opt => opt.type !== 'text').map((option) => (
                  <div key={option.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs flex items-center justify-center font-bold">
                        {customizations.indexOf(option) + 1}
                      </span>
                      {option.label}
                      <span className="text-red-500">*</span>
                    </label>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {option.options?.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleOptionChange(option.id, opt)}
                          className={`group relative px-4 py-4 rounded-xl border-2 font-medium transition-all ${
                            option.value === opt
                              ? 'border-violet-600 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 text-violet-700 dark:text-violet-300 shadow-md scale-105'
                              : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-sm'
                          }`}
                        >
                          {option.value === opt && (
                            <div className="absolute top-2 left-2">
                              <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center">
                                <Check size={12} className="text-white" />
                              </div>
                            </div>
                          )}
                          <span className="block text-center">{opt}</span>
                        </button>
                      ))}
                    </div>

                    {/* Validation hint: show when no selection yet */}
                    {!option.value && (
                      <p className="mt-3 text-xs text-red-600 dark:text-red-400">الرجاء اختيار {option.label} قبل المتابعة</p>
                    )}
                  </div>
                ))}

                {/* Notes moved to final step */}

                {/* Inline CTA under size/options section */}
                <div className="mt-2 flex flex-row-reverse items-center gap-3">
                  <button
                    onClick={handleNextStep}
                    className={`flex-[2] px-6 py-3 rounded-xl font-bold shadow bg-gradient-to-r ${currentStepInfo.color} text-white`}
                  >
                    التالي
                  </button>
                  <button
                    onClick={handleSaveDraft}
                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-xl font-bold"
                  >
                    حفظ العملية لاحقًا
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Measurements */}
            {currentStep === 2 && (
              <div className="space-y-4">
                {/* Compact Video Tutorial Tip */}
                <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl p-3 shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                      <PlayCircle size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white mb-0.5">💡 نصيحة: شاهد دليل القياس</p>
                      <p className="text-xs text-white/80">للحصول على مقاسات دقيقة</p>
                    </div>
                    <button className="px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur text-white text-xs font-bold rounded-lg transition-all">
                      شاهد
                    </button>
                  </div>
                </div>

                {/* Saved Measurements */}
                {savedMeasurements.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Save size={18} className="text-emerald-600" />
                        <h3 className="font-bold text-slate-900 dark:text-white">مقاساتي المحفوظة</h3>
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-full">
                          {savedMeasurements.length}
                        </span>
                      </div>
                      <button 
                        onClick={() => setShowMeasurementsModal(true)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        عرض الكل
                      </button>
                    </div>
                    <div className="grid gap-2">
                      {savedMeasurements.slice(0, 2).map((profile) => (
                        <button
                          key={profile.id}
                          onClick={() => handleUseSavedMeasurements(profile)}
                          className="flex items-center justify-between p-3 border-2 border-slate-200 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl transition-all group"
                        >
                          <div className="text-right">
                            <p className="font-medium text-slate-900 dark:text-white">{profile.name}</p>
                            <p className="text-xs text-slate-500">{profile.type}</p>
                          </div>
                          <ArrowLeft size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Measurements Input */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4">أدخل المقاسات (سم)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'neck', label: 'الرقبة', icon: '🔹' },
                      { key: 'shoulder', label: 'الكتف', icon: '🔹' },
                      { key: 'chest', label: 'الصدر', icon: '🔹' },
                      { key: 'waist', label: 'الخصر', icon: '🔹' },
                      { key: 'sleeve', label: 'الكم', icon: '🔹' },
                      { key: 'length', label: 'الطول', icon: '🔹' },
                      { key: 'thigh', label: 'الفخذ', icon: '🔹' },
                      { key: 'shoe', label: 'المقاس (الحذاء)', icon: '🔹' }
                    ].map(({ key, label, icon }) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
                          <span>{icon}</span>
                          {label}
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="0.0"
                          value={measurements[key as keyof Measurements]}
                          onChange={(e) => handleMeasurementChange(key as keyof Measurements, e.target.value)}
                          onFocus={() => setActiveMeasurement(key as keyof Measurements)}
                          onBlur={() => setActiveMeasurement(null)}
                          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white text-center font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          ref={(el) => { measurementRefs.current[key as keyof Measurements] = el; }}
                        />
                        {!measurements[key as keyof Measurements] && (
                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">أدخل قياس {label} لمتابعة خطوة التأكيد</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inline CTA under options */}
                <div className="mt-4 flex flex-row-reverse items-center gap-3">
                  <button
                    onClick={handleNextStep}
                    className={`flex-[2] px-6 py-3 rounded-xl font-bold shadow bg-gradient-to-r ${currentStepInfo.color} text-white`}
                  >
                    التالي
                  </button>
                  <button
                    onClick={handleSaveDraft}
                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-xl font-bold"
                  >
                    حفظ العملية لاحقًا
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="space-y-4">
                {/* Notes Section on final step */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                  <label className="block text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Info size={18} className="text-slate-400" />
                    {customizations.find(o => o.type === 'text')?.label}
                    <span className="text-xs text-slate-400 font-normal">(اختياري)</span>
                  </label>
                  <textarea
                    value={customizations.find(o => o.type === 'text')?.value}
                    onChange={(e) => handleOptionChange('notes', e.target.value)}
                    placeholder="مثال: أريد تطريز اسمي على الجيب..."
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none"
                    rows={3}
                  />
                </div>

                {/* Customizations */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Palette size={18} className="text-violet-600" />
                    خيارات التفصيل
                  </h3>
                  <div className="space-y-3">
                    {customizations.filter(opt => opt.value).map((opt) => (
                      <div key={opt.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                        <span className="text-sm text-slate-600 dark:text-slate-400">{opt.label}</span>
                        <span className="font-medium text-slate-900 dark:text-white">{opt.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Measurements */}
                {Object.values(measurements).some(val => val) && (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <Ruler size={18} className="text-blue-600" />
                      المقاسات (سم)
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(measurements).filter(([_, val]) => val).map(([key, value]) => (
                        <div key={key} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 capitalize">{key}</p>
                          <p className="text-lg font-bold text-slate-900 dark:text-white">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Success Message */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg">
                  <div className="flex items-start gap-3">
                    <Check size={24} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-lg mb-1">جاهز للطلب!</h3>
                      <p className="text-sm text-white/90">تم إكمال جميع التفاصيل بنجاح. اضغط على "إضافة إلى السلة" للمتابعة</p>
                    </div>
                  </div>
                </div>

                {/* Inline CTA under measurements */}
                <div className="mt-4 flex flex-row-reverse items-center gap-3">
                  <button
                    onClick={handleNextStep}
                    className="flex-[2] px-6 py-3 rounded-xl font-bold shadow bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  >
                    التالي
                  </button>
                  <button
                    onClick={handleSaveDraft}
                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-xl font-bold"
                  >
                    حفظ العملية لاحقًا
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Body Map - Sticky Sidebar - Expanded */}
          <div className="lg:col-span-7 xl:col-span-7">
            <div className="sticky top-24 space-y-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white">
                  <h3 className="text-lg font-bold mb-1">مخطط تفاعلي للمقاسات</h3>
                  <p className="text-sm text-white/80">تظهر الحلقات عند إدخال كل قياس</p>
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-bold">
                    <span>اكتمال</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white">{filledMeasurements}/{totalMeasurements}</span>
                  </div>
                </div>
                <div className="p-5">
                  {/* Debug Info */}
                  <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-300">
                      {loadingTemplates ? '⏳ جاري تحميل القوالب...' : `✓ تم العثور على ${filteredTemplates.length} قالب مرتبط بتصنيف المنتج`}
                    </p>
                    {!loadingTemplates && filteredTemplates.length > 0 && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        القوالب المتاحة: {filteredTemplates.map(t => t.name).join(' • ')}
                      </p>
                    )}
                    {!loadingTemplates && filteredTemplates.length === 0 && product?.categoryId && (
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        💡 لا توجد قوالب مرتبطة بتصنيف "{product?.category}" - يمكن إضافة قوالب من لوحة الإدارة
                      </p>
                    )}
                  </div>

                  {/* Templates Display */}
                  {loadingTemplates ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">جاري تحميل القوالب...</p>
                      </div>
                    </div>
                  ) : filteredTemplates.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center max-w-md">
                        <Info className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
                          لا يوجد قالب مقاسات مرتبط بتصنيف هذا المنتج
                        </p>
                        {product?.categoryId ? (
                          <p className="text-xs text-slate-500 dark:text-slate-500 mb-4">
                            يمكن إضافة قالب مخصص لتصنيف "{product?.category}" من لوحة الإدارة
                          </p>
                        ) : (
                          <p className="text-xs text-red-500 dark:text-red-400 mb-4">
                            ⚠️ هذا المنتج لا يحتوي على معرف تصنيف (categoryId)
                          </p>
                        )}
                        {measurementTemplates.length > 0 && (
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            💡 يوجد {measurementTemplates.length} قالب متاح لتصنيفات أخرى
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredTemplates.map((template, index) => (
                        <div
                          key={template.id}
                          className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                        >
                          <div className="p-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-b border-slate-200 dark:border-slate-700">
                            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{template.name}</h4>
                            {template.description && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{template.description}</p>
                            )}
                            <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded">
                              {template.points.length} نقطة قياس
                            </span>
                          </div>
                          
                          <div className="overflow-auto bg-white dark:bg-slate-800 flex justify-center p-4">
                            <div 
                              className="relative"
                              style={{
                                width: '460px',
                                height: '690px'
                              }}
                            >
                              {/* Template Image */}
                              {template.baseImageUrl && (
                                <img
                                  src={template.baseImageUrl}
                                  alt={template.name}
                                  className="absolute inset-0 w-full h-full pointer-events-none"
                                  style={{ imageRendering: 'crisp-edges' }}
                                />
                              )}
                              
                              {/* خطوط الربط بين النقاط */}
                              {template.points.length > 1 && (
                                <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
                                  {template.points.sort((a, b) => (a.order || 0) - (b.order || 0)).map((point, index, sortedPoints) => {
                                    const next = sortedPoints[index + 1];
                                    if (!next) return null;
                                    const x1 = point.x < 1 ? point.x * 100 : point.x;
                                    const y1 = point.y < 1 ? point.y * 100 : point.y;
                                    const x2 = next.x < 1 ? next.x * 100 : next.x;
                                    const y2 = next.y < 1 ? next.y * 100 : next.y;
                                    return (
                                      <line
                                        key={`${point.id}-${next.id}`}
                                        x1={`${x1}%`}
                                        y1={`${y1}%`}
                                        x2={`${x2}%`}
                                        y2={`${y2}%`}
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        strokeDasharray="5,5"
                                        opacity={0.5}
                                      />
                                    );
                                  })}
                                </svg>
                              )}

                              {/* Measurement Points */}
                              {template.points.map((point, idx) => {
                                // Convert coordinates: if value is < 1, it's a decimal (0-1), multiply by 100
                                // if value is >= 1, it's already a percentage
                                const xPercent = point.x < 1 ? point.x * 100 : point.x;
                                const yPercent = point.y < 1 ? point.y * 100 : point.y;
                                
                                const pointColor = point.label.includes('طول') || point.label.includes('عرض') 
                                  ? 'emerald' 
                                  : point.label.includes('محيط') || point.label.includes('دائرة')
                                  ? 'blue'
                                  : point.label.includes('كتف') || point.label.includes('ذراع')
                                  ? 'purple'
                                  : 'orange';
                                
                                return (
                                  <div
                                    key={point.id}
                                    className="absolute group"
                                    style={{
                                      left: `${xPercent}%`,
                                      top: `${yPercent}%`,
                                      transform: 'translate(-50%, -50%)'
                                    }}
                                    title={point.note || point.label}
                                  >
                                    {/* السهم */}
                                    {point.direction !== undefined && (
                                      <div
                                        className={`absolute left-1/2 top-1/2 h-1 w-10 bg-${pointColor}-400 origin-left transition-opacity`}
                                        style={{ 
                                          transform: `rotate(${point.direction}deg)`,
                                          opacity: 0.7
                                        }}
                                      >
                                        <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[6px] border-l-${pointColor}-400 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent`} />
                                      </div>
                                    )}
                                    
                                    {/* Point marker */}
                                    <div className={`relative w-8 h-8 rounded-full bg-${pointColor}-500 border-2 border-white shadow-lg flex items-center justify-center transition-transform group-hover:scale-110`}>
                                      <span className="text-xs font-bold text-white">{point.order || idx + 1}</span>
                                    </div>
                                    
                                    {/* Label */}
                                    <div className={`absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap transition-opacity group-hover:opacity-100 ${point.note ? 'opacity-100' : 'opacity-0'}`}>
                                      <div className={`px-2 py-1 bg-${pointColor}-600 text-white text-xs font-bold rounded shadow-lg`}>
                                        {point.label}
                                        {point.note && (
                                          <div className="text-[10px] opacity-90 mt-0.5">{point.note}</div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Summary */}
              <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/50">
                <div className="space-y-2">
                  {steps.map((step) => (
                    <div
                      key={step.number}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                        currentStep === step.number
                          ? 'bg-white dark:bg-slate-700 shadow-sm'
                          : currentStep > step.number
                          ? 'opacity-60'
                          : 'opacity-40'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        currentStep > step.number
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                          : currentStep === step.number
                          ? `bg-gradient-to-br ${step.color} text-white`
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                      }`}>
                        {currentStep > step.number ? <Check size={16} /> : <step.icon size={16} />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-bold ${
                          currentStep === step.number ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {step.title}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile CTA */}
      <div className="lg:hidden fixed bottom-24 left-0 right-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur border-t border-slate-200 dark:border-slate-700 p-3 z-30">
        <div className="max-w-7xl mx-auto flex flex-row-reverse gap-2">
          {currentStep > 1 && (
            <button
              onClick={handlePrevStep}
              className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white py-3 rounded-xl font-bold"
            >
              السابق
            </button>
          )}
          {currentStep < 3 ? (
            <button
              onClick={handleNextStep}
              className="flex-1 py-3 rounded-xl font-bold shadow bg-gradient-to-r from-blue-600 to-purple-600 text-white"
            >
              التالي
            </button>
          ) : (
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <ShoppingCart size={18} />
              إضافة للسلة
            </button>
          )}
        </div>
      </div>

      {/* Saved Measurements Modal */}
      {showMeasurementsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Save size={22} className="text-emerald-600" />
                مقاساتي المحفوظة
              </h3>
              <button
                onClick={() => setShowMeasurementsModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto max-h-[calc(85vh-80px)]">
              {savedMeasurements.length === 0 ? (
                <div className="text-center py-12">
                  <Ruler className="w-20 h-20 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400 mb-4">لا توجد مقاسات محفوظة</p>
                  <button
                    onClick={() => {
                      setShowMeasurementsModal(false);
                      navigate('/measurements');
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-medium rounded-xl hover:shadow-lg transition-all"
                  >
                    إضافة مقاسات جديدة
                  </button>
                </div>
              ) : (
                savedMeasurements.map((profile) => (
                  <button
                    key={profile.id}
                    className="w-full border-2 border-slate-200 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-4 transition-all text-right group"
                    onClick={() => handleUseSavedMeasurements(profile)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{profile.name}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{profile.type}</p>
                      </div>
                      <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        اختيار
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(profile.metrics).slice(0, 6).map(([key, value]) => (
                        <div key={key} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-2 py-1.5 text-center">
                          <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{key}</p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{value}</p>
                        </div>
                      ))}
                    </div>

                    {profile.notes && (
                      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 italic border-t border-slate-100 dark:border-slate-700 pt-2">
                        {profile.notes}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
