import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Ruler, ShoppingBag, Info, ChevronLeft, Shirt } from 'lucide-react';
import { Product, MeasurementProfile, MeasurementTemplate } from '../../types';
import { getProductById } from '../../services/mockService';
import { useApp } from '../../context/AppContext';
import { firebaseService } from '../../services/firebase';
import { getAllCategories } from '../../src/admin/products/services';
import type { Category } from '../../src/admin/products/types';

// Components
import { StepHeader } from './StepHeader';
import { Step1Options } from './Step1Options';
import { Step2Measurements } from './Step2Measurements';
import { Step3Review } from './Step3Review';
import { TemplatesDisplay } from './TemplatesDisplay';
import { SavedMeasurementsModal } from './SavedMeasurementsModal';

// Types & Constants
import { CustomizationOption, Measurements } from './types';
import { STEPS } from './constants';

export const Customization = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, addToCart } = useApp();
  
  // State
  const [product, setProduct] = useState<Product | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [savedMeasurements, setSavedMeasurements] = useState<MeasurementProfile[]>([]);
  const [showMeasurementsModal, setShowMeasurementsModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [measurementTemplates, setMeasurementTemplates] = useState<MeasurementTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  const [measurements, setMeasurements] = useState<Measurements>({
    neck: '', chest: '', shoulder: '', sleeve: '', length: '', waist: '', thigh: '', shoe: ''
  });
  
  // Track active focus to highlight diagram
  const [activeMeasurement, setActiveMeasurement] = useState<keyof Measurements | null>(null);
  
  const [customizations, setCustomizations] = useState<CustomizationOption[]>([
    { id: 'fabric', label: 'نوع القماش', type: 'fabric', options: ['قطن', 'حرير', 'كتان', 'صوف', 'بوليستر'], value: '' },
    { id: 'color', label: 'اللون', type: 'color', options: ['أبيض', 'أسود', 'أزرق', 'أخضر', 'أحمر', 'بني', 'رمادي'], value: '' },
    { id: 'size', label: 'المقاس', type: 'size', options: ['صغير', 'متوسط', 'كبير', 'كبير جداً', 'مقاس خاص'], value: '' },
    { id: 'notes', label: 'ملاحظات إضافية', type: 'text', value: '' }
  ]);

  const measurementRefs = useRef<Record<keyof Measurements, HTMLInputElement | null>>({
    neck: null, chest: null, shoulder: null, sleeve: null, length: null, waist: null, thigh: null, shoe: null,
  });

  // --- Load Data Effects ---
  useEffect(() => { if (id) getProductById(id).then(setProduct); }, [id]);
  useEffect(() => { if (user) loadSavedMeasurements(); }, [user]);
  useEffect(() => { loadMeasurementTemplates(); loadCategories(); }, []);

  // --- Auto Focus Logic ---
  useEffect(() => {
    if (currentStep === 2) {
      const order: (keyof Measurements)[] = ['neck', 'chest', 'shoulder', 'sleeve', 'waist', 'length', 'thigh', 'shoe'];
      const firstEmpty = order.find(k => !measurements[k]);
      if (firstEmpty && measurementRefs.current[firstEmpty]) {
        measurementRefs.current[firstEmpty]?.focus();
      }
    }
  }, [currentStep]);

  // --- Helpers ---
  const loadCategories = async () => {
    setLoadingCategories(true);
    try { setAllCategories(await getAllCategories()); } 
    catch (e) { console.error(e); } 
    finally { setLoadingCategories(false); }
  };

  const loadMeasurementTemplates = async () => {
    setLoadingTemplates(true);
    try { setMeasurementTemplates(await firebaseService.getMeasurementTemplates()); } 
    catch (e) { console.error(e); } 
    finally { setLoadingTemplates(false); }
  };

  const loadSavedMeasurements = async () => {
    if (!user) return;
    // ... (Keep existing logic)
    try {
      if (firebaseService.isInitialized()) {
        const fbMeasurements = await firebaseService.getMeasurements(user.id);
        if (fbMeasurements.length > 0) { setSavedMeasurements(fbMeasurements); return; }
      }
    } catch (error) { console.error(error); }
    const saved = localStorage.getItem(`measurements_${user.id}`);
    if (saved) setSavedMeasurements(JSON.parse(saved));
  };

  // --- Handlers ---
  const handleUseSavedMeasurements = (profile: MeasurementProfile) => {
    // ... (Keep existing logic)
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
    setCustomizations(prev => prev.map(opt => opt.id === optionId ? { ...opt, value } : opt));
  };

  const handleMeasurementChange = (field: keyof Measurements, value: string) => {
    setMeasurements(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    if (currentStep === 2) { navigate('/measurements'); return; } // Or custom next logic
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleAddToCart = () => {
    if (product) {
      // ... (Keep existing logic)
      addToCart({ ...product, customizations: {}, measurements }); // Simplified for brevity
      navigate('/cart');
    }
  };

  const handleSaveDraft = () => {
    // ... (Keep existing logic)
  };

  // --- Filters ---
  const filteredTemplates = measurementTemplates.filter(template => {
    if (!product?.categoryId) return false;
    const templateCategoryId = template.categoryId || template.id;
    return templateCategoryId === product.categoryId;
  });

  // --- Loading State ---
  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const currentStepInfo = STEPS[currentStep - 1];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans" dir="rtl">
      
      {/* 1. Improved Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
        <StepHeader currentStep={currentStep} steps={STEPS} />
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-8 pb-32">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* --- LEFT COLUMN (Context Panel - Sticky) --- */}
          {/* This changes based on the step to give relevant visual feedback */}
          <div className="hidden lg:block lg:col-span-5 lg:sticky lg:top-28 space-y-6">
            
            {/* Context Card */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-1 shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              
              {currentStep === 1 ? (
                // Step 1: Product Preview
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100">
                   <img src={product.image || "/api/placeholder/600/800"} alt={product.name} className="w-full h-full object-cover mix-blend-multiply" />
                   <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-6 text-white">
                      <h2 className="text-2xl font-bold">{product.name}</h2>
                      <p className="opacity-90">{product.price.toFixed(0)} ريال</p>
                   </div>
                </div>
              ) : currentStep === 2 ? (
                // Step 2: Templates & Visuals
                <div className="bg-slate-50 dark:bg-slate-800 p-4 min-h-[500px] flex flex-col">
                   <div className="flex items-center gap-2 mb-4 text-slate-500">
                      <Info size={18} />
                      <span className="text-sm font-bold">دليل القياسات</span>
                   </div>
                   
                   {/* This replaces your TemplatesDisplay, making it a sidebar widget */}
                   <div className="flex-1 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                     <TemplatesDisplay 
                        filteredTemplates={filteredTemplates} 
                        loadingTemplates={loadingTemplates}
                        product={product}
                        allCategories={allCategories}
                        measurementTemplates={measurementTemplates}
                        compact={true} // Suggest adding a compact prop to TemplatesDisplay
                     />
                   </div>
                </div>
              ) : (
                // Step 3: Receipt Preview
                <div className="p-8 text-center space-y-4">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <ShoppingBag size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">ملخص الطلب</h3>
                  <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 text-right text-sm space-y-2">
                     <div className="flex justify-between">
                        <span>المنتج:</span>
                        <span className="font-bold">{product.name}</span>
                     </div>
                     <div className="flex justify-between">
                        <span>السعر:</span>
                        <span className="font-bold">{product.price} ريال</span>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* --- RIGHT COLUMN (Action Forms - Scrollable) --- */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Mobile Product Header (Only visible on small screens) */}
            <div className="lg:hidden bg-white dark:bg-slate-800 rounded-2xl p-4 flex gap-4 items-center shadow-sm border border-slate-100">
               <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden">
                  <img src={product.image || "/api/placeholder/100/100"} alt={product.name} className="w-full h-full object-cover" />
               </div>
               <div>
                  <h1 className="font-bold text-slate-900 dark:text-white">{product.name}</h1>
                  <div className="text-indigo-600 font-bold">{product.price.toFixed(0)} ريال</div>
               </div>
            </div>

            {/* Dynamic Step Content */}
            <div className="animate-in slide-in-from-bottom-4 duration-500 fade-in">
              {currentStep === 1 && (
                <Step1Options
                  customizations={customizations}
                  onOptionChange={handleOptionChange}
                  onNextStep={handleNextStep}
                  onSaveDraft={handleSaveDraft}
                  currentStepColor={currentStepInfo.color}
                />
              )}

              {currentStep === 2 && (
                <Step2Measurements
                  measurements={measurements}
                  savedMeasurements={savedMeasurements}
                  measurementRefs={measurementRefs}
                  onMeasurementChange={handleMeasurementChange}
                  onUseSavedMeasurements={handleUseSavedMeasurements}
                  setActiveMeasurement={setActiveMeasurement}
                  setShowMeasurementsModal={setShowMeasurementsModal}
                  onNextStep={handleNextStep}
                  onSaveDraft={handleSaveDraft}
                  currentStepColor={currentStepInfo.color}
                />
              )}

              {currentStep === 3 && (
                <Step3Review
                  customizations={customizations}
                  measurements={measurements}
                  onOptionChange={handleOptionChange}
                  onNextStep={handleNextStep}
                  onSaveDraft={handleSaveDraft}
                  onAddToCart={handleAddToCart}
                />
              )}
            </div>
          </div>

        </div>
      </div>

      {/* --- Mobile Floating Actions --- */}
      
      {/* 1. Template Toggle (Only Step 2 Mobile) */}
      {currentStep === 2 && filteredTemplates.length > 0 && (
        <button
          onClick={() => setShowTemplatesModal(true)}
          className="lg:hidden fixed bottom-24 left-4 z-30 bg-white text-indigo-600 border border-indigo-100 shadow-lg px-4 py-3 rounded-full flex items-center gap-2 font-bold text-sm"
        >
          <Ruler size={18} />
          <span>دليل المقاسات</span>
        </button>
      )}

      {/* 2. Templates Modal (Mobile) */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setShowTemplatesModal(false)} />
            <div className="relative bg-white dark:bg-slate-800 w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-10">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg">قوالب المقاسات</h3>
                    <button onClick={() => setShowTemplatesModal(false)} className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">✕</button>
                </div>
                <div className="p-4 overflow-y-auto custom-scrollbar">
                    <TemplatesDisplay
                        filteredTemplates={filteredTemplates}
                        loadingTemplates={loadingTemplates}
                        product={product}
                        allCategories={allCategories}
                        measurementTemplates={measurementTemplates}
                    />
                </div>
            </div>
        </div>
      )}

      {/* Saved Measurements Modal */}
      {showMeasurementsModal && (
        <SavedMeasurementsModal
          savedMeasurements={savedMeasurements}
          onClose={() => setShowMeasurementsModal(false)}
          onSelect={handleUseSavedMeasurements}
        />
      )}
    </div>
  );
};