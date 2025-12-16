import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Ruler, Palette, Scissors, ShoppingCart, Check } from 'lucide-react';
import { Product, MeasurementProfile } from '../types';
import { getProductById } from '../services/mockService';
import { useApp } from '../context/AppContext';
import { firebaseService } from '../services/firebase';

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
}

export const Customization = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, addToCart } = useApp();
  const [product, setProduct] = useState<Product | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [savedMeasurements, setSavedMeasurements] = useState<MeasurementProfile[]>([]);
  const [showMeasurementsModal, setShowMeasurementsModal] = useState(false);
  const [measurements, setMeasurements] = useState<Measurements>({
    neck: '',
    chest: '',
    shoulder: '',
    sleeve: '',
    length: '',
    waist: ''
  });
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

  const loadSavedMeasurements = async () => {
    if (!user) return;
    
    try {
      // Try to load from Firebase first
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
    
    // Fallback to localStorage
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const productImage = product.images && product.images.length > 0 ? product.images[0] : product.image;

  const steps = [
    { number: 1, title: 'خيارات التفصيل', icon: Palette },
    { number: 2, title: 'المقاسات', icon: Ruler },
    { number: 3, title: 'المراجعة والتأكيد', icon: Check }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
          <div className="px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowRight size={20} />
              <span>رجوع</span>
            </button>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">تخصيص المنتج</h1>
            <div className="w-16"></div>
          </div>

          {/* Progress Steps */}
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              {steps.map((step, index) => (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        currentStep === step.number
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg scale-110'
                          : currentStep > step.number
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                      }`}
                    >
                      {currentStep > step.number ? (
                        <Check size={20} />
                      ) : (
                        <step.icon size={20} />
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium text-center ${
                        currentStep === step.number
                          ? 'text-blue-600 dark:text-blue-400'
                          : currentStep > step.number
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 rounded transition-all ${
                        currentStep > step.number
                          ? 'bg-green-500'
                          : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 p-4 lg:p-8">
          {/* Right Side - Product Preview */}
          <div className="order-1 lg:order-2">
            <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg sticky top-24">
              <div className="aspect-square bg-slate-100 dark:bg-slate-700">
                <img
                  src={productImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{product.name}</h2>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-blue-600">{product.price.toFixed(0)} ريال</div>
                  {product.duration && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <Scissors size={16} />
                      <span>{product.duration}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Left Side - Step Content */}
          <div className="order-2 lg:order-1 space-y-6">
            {/* Step 1: Customization Options */}
            {currentStep === 1 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Palette size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">خيارات التفصيل</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">اختر المواصفات المناسبة لك</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {customizations.map((option) => (
                    <div key={option.id}>
                      <label className="block text-sm font-bold text-slate-900 dark:text-white mb-3">
                        {option.label}
                      </label>
                      
                      {option.type === 'text' ? (
                        <textarea
                          value={option.value}
                          onChange={(e) => handleOptionChange(option.id, e.target.value)}
                          placeholder="أضف ملاحظاتك هنا..."
                          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                          rows={4}
                        />
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {option.options?.map((opt) => (
                            <button
                              key={opt}
                              onClick={() => handleOptionChange(option.id, opt)}
                              className={`px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                                option.value === opt
                                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                  : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Measurements */}
            {currentStep === 2 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <Ruler size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">المقاسات</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">أدخل مقاساتك أو استخدم مقاساتك المحفوظة</p>
                </div>
              </div>

              {/* Video Tutorial */}
              <div className="mb-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"></path>
                    </svg>
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-300">كيف تأخذ مقاساتك؟</span>
                  </div>
                  <span className="text-xs text-blue-600 dark:text-blue-400">شاهد الفيديو القصير لتفضيل دقة المقاسات</span>
                </div>
                
                <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden group cursor-pointer">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-slate-900 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <p className="text-white text-sm font-medium text-center">فيديو توضيحي لأخذ المقاسات</p>
                  </div>
                </div>
              </div>

              {/* Measurements Input Form */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 dark:text-white">أدخل المقاسات (سم)</h3>
                  {savedMeasurements.length > 0 && (
                    <button 
                      onClick={() => setShowMeasurementsModal(true)}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      استخدام مقاساتي المحفوظة ({savedMeasurements.length})
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Neck
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      value={measurements.neck}
                      onChange={(e) => handleMeasurementChange('neck', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Chest
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      value={measurements.chest}
                      onChange={(e) => handleMeasurementChange('chest', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Shoulder
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      value={measurements.shoulder}
                      onChange={(e) => handleMeasurementChange('shoulder', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Sleeve
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      value={measurements.sleeve}
                      onChange={(e) => handleMeasurementChange('sleeve', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Length
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      value={measurements.length}
                      onChange={(e) => handleMeasurementChange('length', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Waist
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      value={measurements.waist}
                      onChange={(e) => handleMeasurementChange('waist', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

            {/* Step 3: Review and Confirm */}
            {currentStep === 3 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <Check size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">مراجعة الطلب</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">تأكد من جميع التفاصيل قبل الإضافة</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Customizations Summary */}
                  <div className="border border-slate-200 dark:border-slate-600 rounded-xl p-4">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3">خيارات التفصيل</h3>
                    <div className="space-y-2">
                      {customizations.filter(opt => opt.value).map((opt) => (
                        <div key={opt.id} className="flex justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400">{opt.label}:</span>
                          <span className="font-medium text-slate-900 dark:text-white">{opt.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Measurements Summary */}
                  {Object.values(measurements).some(val => val) && (
                    <div className="border border-slate-200 dark:border-slate-600 rounded-xl p-4">
                      <h3 className="font-bold text-slate-900 dark:text-white mb-3">المقاسات (سم)</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(measurements).filter(([_, val]) => val).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm bg-slate-50 dark:bg-slate-700 rounded-lg p-2">
                            <span className="text-slate-600 dark:text-slate-400 capitalize">{key}:</span>
                            <span className="font-medium text-slate-900 dark:text-white">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Product Info */}
                  <div className="border border-slate-200 dark:border-slate-600 rounded-xl p-4">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-3">معلومات المنتج</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400">السعر:</span>
                      <span className="text-2xl font-bold text-blue-600">{product.price.toFixed(0)} ريال</span>
                    </div>
                    {product.duration && (
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-slate-600 dark:text-slate-400">مدة التفصيل:</span>
                        <span className="font-medium text-slate-900 dark:text-white">{product.duration}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3">
              {currentStep > 1 && (
                <button
                  onClick={handlePrevStep}
                  className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white py-4 rounded-xl font-bold transition-colors"
                >
                  السابق
                </button>
              )}
              
              {currentStep < 3 ? (
                <button
                  onClick={handleNextStep}
                  disabled={!isStepValid()}
                  className="flex-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 disabled:from-slate-400 disabled:via-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
                >
                  التالي
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all"
                >
                  <ShoppingCart size={22} />
                  <span>إضافة إلى السلة</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Saved Measurements Modal */}
        {showMeasurementsModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">مقاساتي المحفوظة</h3>
                <button
                  onClick={() => setShowMeasurementsModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-4">
                {savedMeasurements.length === 0 ? (
                  <div className="text-center py-8">
                    <Ruler className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">لا توجد مقاسات محفوظة</p>
                    <button
                      onClick={() => {
                        setShowMeasurementsModal(false);
                        navigate('/measurements');
                      }}
                      className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      إضافة مقاسات جديدة
                    </button>
                  </div>
                ) : (
                  savedMeasurements.map((profile) => (
                    <div
                      key={profile.id}
                      className="border border-slate-200 dark:border-slate-600 rounded-xl p-4 hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer"
                      onClick={() => handleUseSavedMeasurements(profile)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white">{profile.name}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{profile.type}</p>
                        </div>
                        <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full">
                          اختر
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        {Object.entries(profile.metrics).slice(0, 6).map(([key, value]) => (
                          <div key={key} className="flex justify-between bg-slate-50 dark:bg-slate-700 rounded px-2 py-1">
                            <span className="text-slate-600 dark:text-slate-400 capitalize">{key}:</span>
                            <span className="font-medium text-slate-900 dark:text-white">{value}</span>
                          </div>
                        ))}
                      </div>

                      {profile.notes && (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic">
                          {profile.notes}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
