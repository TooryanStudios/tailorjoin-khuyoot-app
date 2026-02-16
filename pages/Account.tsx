import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useModalStore } from '../src/store/useModalStore';
import { 
  LogOut, Ruler, ShoppingBag, Edit2, Crown, 
  Package, Wallet, User as UserIcon, ArrowRight, Phone, RefreshCw, AlertTriangle, X,
  Camera, Save, Mail, MapPin, Calendar, Users, Trash2, Shield, Scissors
} from 'lucide-react';
import { FamilyMember, GarmentType, Gender } from '../types';
import { firebaseService } from '../services/firebase';
import { uploadAvatar } from '../services/storageService';
import { getUserOrders } from '../services/orderService';
import { useMeasurementTemplate, MeasurementTemplateContent } from '@/src/hooks/useMeasurementTemplate';
import { PointMarker } from '@/src/components/Measurements/PointMarker';
import { measurementService, MeasurementTemplate } from '@/src/modules/measurements/services/measurementService';
import { MontHeader } from '../src/components/MontHeader';

// Measurement templates for different garment types
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

// Helper to normalize type - converts Arabic labels to English keys
const normalizeGarmentType = (type: string): GarmentType => {
  // If already a valid English key, return it
  if (measurementTemplates[type as GarmentType]) {
    return type as GarmentType;
  }
  
  // Map Arabic labels to English keys
  const arabicToEnglish: Record<string, GarmentType> = {
    'دشداشة / ثوب': 'dishdasha',
    'دشداشة': 'dishdasha',
    'ثوب': 'thobe',
    'عباية': 'abaya',
    'فستان': 'dress',
    'لباس عماني': 'omani',
    'لباس ظفاري': 'dhofari',
    'لباس صوري': 'suri',
    'قميص': 'shirt',
    'بدلة': 'suit',
    'أخرى': 'other',
  };
  
  return arabicToEnglish[type] || 'dishdasha';
};

// Helper function to get Arabic role label
const getRoleLabel = (role?: string) => {
  const roleMap: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    'admin': { label: 'مسؤول النظام', icon: <Shield size={14} />, color: 'bg-red-100 text-red-700' },
    'tailor': { label: 'خياط متخصص', icon: <Scissors size={14} />, color: 'bg-blue-100 text-blue-700' },
    'customer': { label: 'عميل', icon: <UserIcon size={14} />, color: 'bg-purple-100 text-purple-700' },
  };
  return roleMap[role || 'customer'] || roleMap['customer'];
};

type TabType = 'measurements' | 'family' | 'wallet';


const MeasurementEditorDialog = ({
  isOpen,
  onClose,
  initialData,
  onSave,
  userGender
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData?: { name?: string; type?: string; metrics?: Record<string, number>; notes?: string };
  onSave: (data: { name: string; type: string; metrics: Record<string, number>; notes: string }) => Promise<void>;
  userGender?: Gender;
}) => {
  const [templates, setTemplates] = useState<MeasurementTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isTypePickerOpen, setIsTypePickerOpen] = useState(false);
  const [typePickerTab, setTypePickerTab] = useState<'female' | 'male'>('female');
  const [name, setName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const lastAutoNameRef = useRef<string>('');
  
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const femaleTemplates = templates.filter(t => t.genderGroup === 'female');
  const maleTemplates = templates.filter(t => t.genderGroup === 'male');
  const visibleTemplates = typePickerTab === 'female' ? femaleTemplates : maleTemplates;
  const defaultTabFromUser = userGender === 'male' ? 'male' : 'female';
  const measurementHook = useMeasurementTemplate({ 
    template: selectedTemplate,
    initialMeasurements: initialData?.metrics
  });

  useEffect(() => {
    if (selectedTemplate?.genderGroup) {
      setTypePickerTab(selectedTemplate.genderGroup);
      return;
    }
    setTypePickerTab(defaultTabFromUser);
  }, [selectedTemplate?.id, selectedTemplate?.genderGroup, defaultTabFromUser]);

  useEffect(() => {
    if (isTypePickerOpen) {
      const initialTab = selectedTemplate?.genderGroup || defaultTabFromUser;
      setTypePickerTab(initialTab);
    }
  }, [isTypePickerOpen, selectedTemplate?.genderGroup, defaultTabFromUser]);

  useEffect(() => {
    if (isOpen) {
        setIsLoadingTemplates(true);
        measurementService.getTemplates().then(data => {
            setTemplates(data);
            setIsLoadingTemplates(false);
            
            // If editing existing, try to match garment type to template
            if (initialData?.type) {
                const match = data.find(t => 
                    t.productType === initialData.type || 
                    t.name === initialData.type ||
                    t.id === initialData.type 
                );
                if (match) setSelectedTemplateId(match.id);
                // Fallback: try to normalize
                else {
                    const norm = normalizeGarmentType(initialData.type);
                    const matchNorm = data.find(t => t.productType === norm);
                    if (matchNorm) setSelectedTemplateId(matchNorm.id);
                    else if (data.length > 0) setSelectedTemplateId(data[0].id);
                }
            } else if (data.length > 0 && !selectedTemplateId) {
                setSelectedTemplateId(data[0].id);
            }
        });

        if (initialData) {
            setName(initialData.name || '');
            setNotes(initialData.notes || '');
            if (initialData.metrics) {
                measurementHook.setMeasurements(initialData.metrics);
            }
        } else {
            setName('');
            setNotes('');
            measurementHook.setMeasurements({});
        }
        setNameTouched(false);
        lastAutoNameRef.current = '';
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (!selectedTemplate || initialData?.name) return;
    const nextAutoName = `مقاس ${selectedTemplate.name}`;
    if (!name.trim() || (!nameTouched && name === lastAutoNameRef.current)) {
      setName(nextAutoName);
    }
    lastAutoNameRef.current = nextAutoName;
  }, [selectedTemplate?.id, selectedTemplate?.name]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
        await onSave({
            name,
            type: selectedTemplate?.productType || selectedTemplate?.name || 'dishdasha',
            metrics: measurementHook.measurements,
            notes
        });
        onClose();
    } catch (e) {
        console.error(e);
    } finally {
        setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[10001] overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-xl p-5 max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()} dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
          <h3 className="text-base font-bold text-slate-900">
            {initialData ? 'تعديل القياسات' : 'إضافة قياس جديد'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-all"
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            <div className="space-y-4">
                 {/* Name Field */}
                {isLoadingTemplates ? (
                    <div className="py-10 text-center"><RefreshCw className="animate-spin mx-auto text-slate-400" /></div>
                ) : (
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">نوع الملبس</label>
                        <button
                          type="button"
                          onClick={() => setIsTypePickerOpen(true)}
                          className="w-full p-3 border-2 border-dashed border-slate-200 rounded-xl hover:border-[#63498b]/50 transition-all text-right"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#63498b]/10 flex items-center justify-center">
                              <Ruler size={16} className="text-[#63498b]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-500">اختيار نوع الملبس</p>
                              <p className={selectedTemplate ? 'text-sm font-semibold text-slate-900' : 'text-sm text-slate-400'}>
                                {selectedTemplate?.name || 'اضغط للاختيار'}
                              </p>
                            </div>
                            {selectedTemplate && (
                              <span className="px-2 py-1 rounded-full text-[10px] font-medium bg-[#63498b]/10 text-[#63498b]">
                                تم الاختيار
                              </span>
                            )}
                          </div>
                        </button>
                    </div>
                )}

                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">اسم القياس</label>
                    <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setNameTouched(true);
                      setName(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#63498b] focus:border-transparent transition-all text-sm mb-4"
                    placeholder="مثال: قياسي الشخصي"
                    />
                </div>
                 
                {/* Visual Editor */}
                {selectedTemplate && (
                    <MeasurementTemplateContent
                        template={selectedTemplate}
                        measurements={measurementHook.measurements}
                        onMeasurementChange={measurementHook.handleMeasurementChange}
                        onShowVideo={() => measurementHook.setShowVideoDialog(true)}
                        PointMarkerComponent={PointMarker}
                    />
                )}
            </div>

            <div className="flex flex-col h-full"> 
                 {/* Notes Field */}
                <div className="mb-4">
                    <label className="block text-xs font-medium text-slate-700 mb-1.5">ملاحظات (اختياري)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#63498b] focus:border-transparent transition-all resize-none text-sm"
                        rows={3}
                        placeholder="أي ملاحظات إضافية..."
                    />
                </div>
                
                 {/* Text Inputs Summary (Optional, if users prefer typing) */}
                 <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex-1 overflow-y-auto mb-4">
                    <h4 className="text-xs font-bold text-slate-700 mb-3">قائمة القياسات</h4>
                    {selectedTemplate ? (
                        <div className="space-y-2">
                             {selectedTemplate.points.map(p => (
                                 <div key={p.id} className="flex justify-between items-center text-xs">
                                     <span className="text-slate-600">{p.label || p.name}</span>
                                     <div className="flex items-center gap-2">
                                         <input 
                                            type="number" 
                                            value={measurementHook.measurements[p.id] || ''}
                                            onChange={(e) => measurementHook.handleMeasurementChange(p.id, e.target.value)}
                                            className="w-16 px-2 py-1 rounded border border-slate-200 text-center"
                                            placeholder="0"
                                         />
                                         <span className="text-slate-400 w-6">سم</span>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    ) :  (
                        <p className="text-xs text-slate-400 italic text-center py-4">اختر نوع الملبس لعرض القياسات</p>
                    )}
                 </div>

                 {/* Action Buttons */}
                <div className="flex gap-2 pt-3 border-t border-slate-200 mt-auto">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-all"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !name.trim()}
                        className="flex-1 h-10 bg-[#63498b] text-white rounded-lg text-sm font-medium hover:bg-[#63498b]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                        <>
                            <RefreshCw size={14} className="animate-spin" />
                            جاري الحفظ...
                        </>
                        ) : (
                        <>
                            <Save size={14} />
                            حفظ
                        </>
                        )}
                    </button>
                </div>
            </div>
        </div>
      </div>

      {isTypePickerOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[10002]" onClick={() => setIsTypePickerOpen(false)}>
          <div className="bg-white rounded-xl p-5 max-w-2xl w-full shadow-2xl" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <h4 className="text-sm font-bold text-slate-900">اختيار نوع الملبس</h4>
              <button
                onClick={() => setIsTypePickerOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-all"
                aria-label="إغلاق"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setTypePickerTab('female')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                  typePickerTab === 'female'
                    ? 'bg-[#63498b] text-white border-[#63498b]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                نسائي
              </button>
              <button
                type="button"
                onClick={() => setTypePickerTab('male')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                  typePickerTab === 'male'
                    ? 'bg-[#63498b] text-white border-[#63498b]'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                رجالي
              </button>
            </div>

            {visibleTemplates.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500 bg-slate-50 rounded-lg">
                لا توجد أنواع متاحة لهذا القسم
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {visibleTemplates.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedTemplateId(t.id);
                      setIsTypePickerOpen(false);
                    }}
                    className={`text-right p-3 rounded-xl border transition-all ${
                      selectedTemplateId === t.id
                        ? 'bg-[#63498b]/10 border-[#63498b]'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`text-sm font-semibold ${selectedTemplateId === t.id ? 'text-[#63498b]' : 'text-slate-900'}`}>
                      {t.name}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                      {t.description || 'تفاصيل المقاسات الخاصة بهذا النوع'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

       <div className='z-[10002]'>
            {measurementHook.showVideoDialog && (
                   <div 
                       className="fixed inset-0 z-[11000] bg-black/80 flex items-center justify-center"
                       onClick={(e) => {
                           e.stopPropagation();
                           measurementHook.setShowVideoDialog(false);
                       }}
                   >
                        <div 
                            className="relative w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                             <button 
                                 onClick={(e) => {
                                     e.stopPropagation();
                                     measurementHook.setShowVideoDialog(false);
                                 }} 
                                 className="absolute top-4 right-4 text-white p-2 bg-black/50 hover:bg-black/70 rounded-full z-10 transition-all"
                                 title="Close Video"
                                 aria-label="Close Video"
                             >
                                 <X size={20} />
                             </button>
                             <iframe 
                                 src={measurementHook.videoUrl} 
                                 title="Tutorial Video"
                                 className="w-full h-full" 
                                 allowFullScreen 
                                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                             ></iframe>
                        </div>
                   </div>
            )}
       </div>
    </div>
  );
};

const MONT_HEADER_ID = 'khuyoot-mont-header';
const DEFAULT_HEADER_SPACER_HEIGHT = 72;

export const Account = () => {
  const { user, logout, loading, updateLocalUser, refreshUser, ordersCount } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const setIsUpgradeModalOpen = useModalStore((s) => s.setIsUpgradeModalOpen);
  const [isEditing, setIsEditing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [deleteAccountRequested, setDeleteAccountRequested] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshingCredits, setIsRefreshingCredits] = useState(false);
  

  // Get active tab from URL
  const getTabFromPath = (): TabType => {
    const path = location.pathname;
    if (path.includes('/account/measurements')) return 'measurements';
    if (path.includes('/account/family')) return 'family';
    if (path.includes('/account/wallet')) return 'wallet';
    return 'measurements';
  };
  
  const [activeTab, setActiveTab] = useState<TabType>(getTabFromPath());
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [showFamilyDialog, setShowFamilyDialog] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(DEFAULT_HEADER_SPACER_HEIGHT);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);
  const [deletingMeasurement, setDeletingMeasurement] = useState<any | null>(null);
  const [isDeletingMeasurement, setIsDeletingMeasurement] = useState(false);
  
  // New Editor State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorInitialData, setEditorInitialData] = useState<any>(null);

  // Edit form states
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (user && isEditing) {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
      setEditEmail(user.email || '');
    }
  }, [user, isEditing]);

  // Sync activeTab with URL changes
  useEffect(() => {
    if (location.pathname === '/account' || location.pathname === '/account/') {
      navigate('/account/measurements', { replace: true });
      return;
    }
    // Redirect old orders path to new standalone orders page
    if (location.pathname === '/account/orders') {
      navigate('/orders', { replace: true });
      return;
    }
    setActiveTab(getTabFromPath());
  }, [location.pathname, navigate]);

  useLayoutEffect(() => {
    if (typeof document === 'undefined') return;

    const updateHeaderHeight = () => {
      const headerEl = document.getElementById(MONT_HEADER_ID);
      if (!headerEl) return;
      const measuredHeight = headerEl.getBoundingClientRect().height;
      if (measuredHeight > 0) {
        setHeaderHeight(measuredHeight);
      }
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  // Load orders on mount
  useEffect(() => {
    if (user) {
      console.log('[Account] ========== USER DATA RECEIVED ==========');
      console.log('[Account] user.role:', user.role);
      console.log('[Account] user.profileImage:', user.profileImage);
      console.log('[Account] user.photoURL:', user.photoURL);
      console.log('[Account] user.avatar:', user.avatar);
      console.log('[Account] Full user object:', JSON.stringify(user, null, 2));
      console.log('[Account] =======================================');
      
      if (user.role === 'customer') {
        loadFamilyMembers();
      }
      loadMeasurements();
    }
  }, [user]);

  const loadFamilyMembers = async () => {
    if (!user?.id) return;
    try {
      const members = await firebaseService.getFamilyMembers(user.id);
      setFamilyMembers(members || []);
    } catch (error) {
      console.error('Error loading family members:', error);
    }
  };

  const loadMeasurements = async () => {
    if (!user?.id) return;
    setLoadingMeasurements(true);
    try {
      const userMeasurements = await firebaseService.getMeasurements(user.id);
      setMeasurements(userMeasurements || []);
    } catch (error) {
      console.error('Error loading measurements:', error);
    } finally {
      setLoadingMeasurements(false);
    }
  };

  const handleEditMeasurement = (measurement: any) => {
    setEditorInitialData(measurement);
    setIsEditorOpen(true);
  };

  const handleSaveDialog = async (data: any) => {
    if (!user) return;
    try {
      const payload: any = {
        userId: user.id || (user as any).uid,
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      if (editorInitialData && editorInitialData.id) {
         payload.id = editorInitialData.id;
         payload.createdAt = editorInitialData.createdAt || new Date().toISOString();
      } else {
         payload.createdAt = new Date().toISOString();
      }

      await firebaseService.saveMeasurement(payload);
      await loadMeasurements();
    } catch (error) {
       console.error('Error saving measurement:', error);
       throw error;
    }
  };


  const handleDeleteMeasurement = async () => {
    if (!deletingMeasurement || !user?.id) return;
    setIsDeletingMeasurement(true);
    try {
      await firebaseService.deleteMeasurement(deletingMeasurement.id, user.id);
      await loadMeasurements();
      setDeletingMeasurement(null);
    } catch (error) {
      console.error('Error deleting measurement:', error);
      alert('فشل حذف القياس');
    } finally {
      setIsDeletingMeasurement(false);
    }
  };

  const handleRefresh = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      const updatedUser = await firebaseService.getUser(user.id);
      if (updatedUser) {
        updateLocalUser(updatedUser);
      }
      const userOrders = await getUserOrders(user.id);
      setOrders(userOrders);
      await loadFamilyMembers();
    } catch (error) {
       console.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefreshCredits = async () => {
    if (!user) return;
    setIsRefreshingCredits(true);
    try {
      // Force fetch latest user data which includes credits
      await refreshUser();
    } catch (error) {
       console.error("Credit refresh failed:", error);
    } finally {
      setIsRefreshingCredits(false);
    }
  };

  // Auto-refresh credits when entering wallet tab
  useEffect(() => {
    if (activeTab === 'wallet') {
      handleRefreshCredits();
    }
  }, [activeTab]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      await firebaseService.updateUserProfile(user.id, {
        name: editName,
        phone: editPhone,
        phoneNumber: editPhone, // Sync both fields
        email: editEmail
      });
      updateLocalUser({ name: editName, phone: editPhone, phoneNumber: editPhone, email: editEmail });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('فشل حفظ التعديلات');
    } finally {
      setSavingProfile(false);
    }
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Check pre-upload for very large files that might crash compression
    // Note: The actual upload limit is 1MB compressed, but we allow larger inputs as they will be compressed.
    if (file.size > 10 * 1024 * 1024) {
       alert('حجم الصورة كبير جداً (أكبر من 10 ميجابايت). يرجى اختيار صورة أصغر.');
       return;
    }
    
    setUploadingImage(true);
    try {
      const avatarUrl = await uploadAvatar(file, user.id);
      await firebaseService.updateUserProfile(user.id, { 
        avatar: avatarUrl,
        profileImage: avatarUrl 
      });
      updateLocalUser({ 
        avatar: avatarUrl, 
        profileImage: avatarUrl 
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      if (error.code === 'storage/unauthorized' || error.message?.includes('403')) {
        alert('حدث خطأ أثناء رفع الصورة. الصورة كبيرة جداً أو لا تملك الصلاحية. يرجى اختيار صورة أصغر حجماً (أقل من 1 ميجابايت بعد الضغط).');
      } else {
        alert('فشل رفع الصورة. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteAccount = async (disableOnly: boolean = false) => {
    if (!user) return;
    
    // Check for active orders by fetching them
    try {
      const userOrders = await getUserOrders(user.id);
      const activeOrders = userOrders.filter(o => !['delivered', 'cancelled'].includes(o.status));
      if (activeOrders.length > 0 && !disableOnly) {
        alert('لا يمكن حذف الحساب لوجود طلبات نشطة. سيتم تعطيل الحساب بدلاً من ذلك.');
        return;
      }
    } catch (error) {
      console.error('Error checking orders:', error);
      // Continue with deletion/disable even if can't check orders
    }
    
    setIsDeleting(true);
    try {
      if (disableOnly) {
        await firebaseService.updateUserProfile(user.id, { disabled: true });
        alert('تم تعطيل حسابك بنجاح');
        await logout();
        navigate('/');
      } else {
        await firebaseService.permanentlyDeleteAccount(user.id);
        await logout();
        navigate('/');
      }
    } catch (error: any) {
      console.error('Account deletion/disable failed:', error);
      alert('فشل العملية. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteReason('');
    }
  };

  const handleDeleteFamilyMember = async (memberId: string) => {
    if (!user?.id || !window.confirm('هل أنت متأكد من حذف هذا الفرد؟')) return;
    
    try {
      await firebaseService.deleteFamilyMember(memberId, user.id);
      await loadFamilyMembers();
    } catch (error) {
      console.error('Error deleting family member:', error);
      alert('فشل حذف الفرد');
    }
  };

  if (loading) {
     return (
        <div className="min-h-screen bg-[#ededed] flex flex-col items-center justify-center gap-4">
           <RefreshCw className="w-12 h-12 text-[#63498b] animate-spin" />
           <p className="text-[#63498b] font-bold text-lg animate-pulse">جاري تحميل بياناتك...</p>
        </div>
     );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#ededed] flex flex-col">
          <MontHeader />
          
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-[32px] overflow-hidden shadow-sm">
                <div className="bg-[#63498b] p-8 text-center text-white relative">
                   <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Crown size={80} />
                   </div>
                   <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                      <UserIcon size={40} className="text-white" />
                   </div>
                   <h2 className="text-2xl font-bold mb-1">مرحباً بك في خيوط</h2>
                   <p className="text-white/70 text-sm">سجل دخولك لمتابعة طلباتك وقياساتك</p>
                </div>

                <div className="p-8 space-y-4">
                   <div className="space-y-4">
                      <button
                        onClick={() => navigate('/login')}
                        className="w-full h-14 bg-[#63498b] text-white rounded-2xl font-bold text-lg hover:bg-[#523d74] transition-all flex items-center justify-center gap-3"
                      >
                         تسجيل الدخول
                         <ArrowRight size={20} />
                      </button>
                      
                      <button
                        onClick={() => navigate('/register')}
                        className="w-full h-14 bg-white border-2 border-[#63498b] text-[#63498b] rounded-2xl font-bold text-lg hover:bg-[#f8f7faff] transition-all"
                      >
                         إنشاء حساب جديد
                      </button>
                   </div>
                   
                   <div className="pt-4 text-center">
                      <p className="text-zinc-500 text-sm">
                         بتسجيلك في التطبيق أنت توافق على 
                         <button className="text-[#63498b] font-medium mx-1">الشروط والأحكام</button>
                      </p>
                   </div>
                </div>
            </div>
          </div>
      </div>
    );
  }

  // --- Authenticated User View ---
  return (
    <div className="h-screen overflow-hidden bg-[#ededed] font-['Tajawal'] text-slate-900 selection:bg-[#63498b] selection:text-white flex flex-col">
      <MontHeader />
      <div
        aria-hidden="true"
        className="pointer-events-none"
        style={{ height: headerHeight }}
      />
      <div
        className="flex-1 overflow-y-auto"
        style={{ scrollPaddingTop: headerHeight }}
      >
        {/* Hero Banner */}
        <section className="px-4 md:px-8 py-3 max-w-[1400px] mx-auto">
          <div className="relative rounded-xl bg-[#63498b] p-6 md:p-8 overflow-hidden min-h-[140px] flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
            
            <div className="relative z-10" dir="rtl">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-white/20 overflow-hidden bg-white/10 flex items-center justify-center">
                      {(user.profileImage || user.avatar) ? (
                        <img src={user.profileImage || user.avatar} className="w-full h-full object-cover" alt={user.name} />
                      ) : (
                        <UserIcon size={24} className="text-white/60" />
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center text-[#63498b] hover:bg-slate-50 transition-all shadow-lg"
                      title="تغيير الصورة"
                    >
                      <Camera size={12} />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      aria-label="رفع صورة الملف الشخصي"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h1 className="text-lg md:text-xl text-white leading-tight">{isEditing ? editName : user.name}</h1>
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center text-white hover:bg-white/20 transition-all"
                        title={isEditing ? 'إلغاء التعديل' : 'تعديل المعلومات'}
                      >
                        {isEditing ? <X size={12} /> : <Edit2 size={12} />}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                      {(() => {
                        const roleInfo = getRoleLabel(user.role);
                        return (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${roleInfo.color}`}>
                            {roleInfo.icon}
                            {roleInfo.label}
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-white/70 text-xs flex items-center gap-1.5">
                      <Phone size={10} />
                      {isEditing ? editPhone : user.phone}
                    </p>
                    {user.email && (
                      <p className="text-white/70 text-xs flex items-center gap-1.5">
                        <Mail size={10} />
                        {isEditing ? editEmail : user.email}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 border border-white/10 flex flex-col items-center justify-center min-w-[60px]">
                    <span className="text-lg text-white">{user.credits || 0}</span>
                    <span className="text-[8px] text-white/60">الرصيد</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 border border-white/10 flex flex-col items-center justify-center min-w-[60px]">
                    <span className="text-lg text-white">{ordersCount || 0}</span>
                    <span className="text-[8px] text-white/60">الطلبات</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 border border-white/10 flex flex-col items-center justify-center min-w-[60px]">
                    <span className="text-lg text-white">{user.points || 0}</span>
                    <span className="text-[8px] text-white/60">النقاط</span>
                  </div>
                  <button
                    onClick={handleRefresh}
                    title="تحديث البيانات"
                    disabled={isRefreshing}
                    className="bg-white/10 backdrop-blur-md rounded-lg p-2 border border-white/10 flex flex-col items-center justify-center min-w-[60px] hover:bg-white/20 transition-all"
                  >
                    <RefreshCw size={16} className={`text-white ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span className="text-[8px] text-white/60">تحديث</span>
                  </button>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="bg-white/10 backdrop-blur-md rounded-lg p-2 border border-white/10 flex flex-col items-center justify-center min-w-[60px] hover:bg-white/20 transition-all"
                  >
                    <LogOut size={16} className="text-white" />
                    <span className="text-[8px] text-white/60">خروج</span>
                  </button>
                </div>
              </div>
              
              {isEditing && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="الاسم"
                    className="h-9 bg-white/10 border border-white/20 rounded-lg px-3 text-sm text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                  />
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="رقم الجوال"
                    className="h-9 bg-white/10 border border-white/20 rounded-lg px-3 text-sm text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                  />
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="البريد الإلكتروني"
                    className="h-9 bg-white/10 border border-white/20 rounded-lg px-3 text-sm text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 focus:border-transparent transition-all"
                  />
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="md:col-span-3 h-9 bg-white text-[#63498b] rounded-lg text-sm font-bold hover:bg-white/90 transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={14} />
                    {savingProfile ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        <main className="px-4 md:px-8 py-3 max-w-[1400px] mx-auto pb-8">
          {/* Tabs Navigation */}
          <div className="mb-4" dir="rtl">
            <div className="bg-white rounded-lg p-1.5 shadow-sm border border-slate-100 flex gap-1">
              <button
                onClick={() => navigate('/account/measurements')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'measurements'
                    ? 'bg-[#63498b] text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Ruler size={16} />
                <span>قياساتي</span>
              </button>
              <div className="w-px bg-slate-200 self-stretch my-1"></div>
              <button
                onClick={() => navigate('/account/family')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'family'
                    ? 'bg-[#63498b] text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Users size={16} />
                <span>قياسات العائلة</span>
              </button>
              <div className="w-px bg-slate-200 self-stretch my-1"></div>
              <button
                onClick={() => navigate('/account/wallet')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'wallet'
                    ? 'bg-[#63498b] text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Wallet size={16} />
                <span>المحفظة</span>
              </button>
            </div>
          </div>

          {isEditing && (
          <div className="mb-4" dir="rtl">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
              <h3 className="text-xs text-slate-500 mb-2">إجراءات الحساب</h3>
              <button
                onClick={() => {
                  setDeleteAccountRequested(true);
                  setShowDeleteConfirm(true);
                }}
                className="text-xs text-rose-600 hover:text-rose-700 underline flex items-center gap-1.5"
              >
                <AlertTriangle size={12} />
                حذف الحساب
              </button>
            </div>
          </div>
          )}

          {/* Measurements Tab Content */}
          {activeTab === 'measurements' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3" dir="rtl">
              <h3 className="text-base text-slate-900 font-bold">قياساتي</h3>
              <button
                onClick={() => {
                   setEditorInitialData(null);
                   setIsEditorOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#63498b] text-white rounded-lg text-sm font-medium hover:bg-[#63498b]/90 transition-all"
              >
                <Ruler size={16} />
                إضافة قياس جديد
              </button>
            </div>
            
            {loadingMeasurements ? (
              <div className="bg-white rounded-lg p-8 shadow-sm border border-slate-100">
                <div className="flex items-center justify-center gap-3">
                  <RefreshCw size={20} className="text-[#63498b] animate-spin" />
                  <span className="text-slate-600 text-sm">جاري تحميل القياسات...</span>
                </div>
              </div>
            ) : measurements.length === 0 ? (
              <div className="bg-white rounded-lg p-8 shadow-sm border border-slate-100 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-slate-50 flex items-center justify-center">
                  <Ruler size={28} className="text-slate-400" />
                </div>
                <h4 className="text-lg text-slate-900 font-bold mb-2">لا توجد قياسات محفوظة</h4>
                <p className="text-sm text-slate-600 mb-6">
                  احفظ قياساتك لاستخدامها في الطلبات المستقبلية
                </p>
                <button
                  onClick={() => {
                     setEditorInitialData(null);
                     setIsEditorOpen(true);
                  }}
                  className="px-6 py-3 bg-[#63498b] text-white rounded-lg text-sm font-bold hover:bg-[#63498b]/90 transition-all inline-flex items-center gap-2"
                >
                  <Ruler size={16} />
                  إضافة قياس جديد
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {measurements.map((measurement) => {
                  const normalizedType = normalizeGarmentType(measurement.type);
                  const template = measurementTemplates[normalizedType];
                  const metrics = measurement.metrics || {};
                  
                  return (
                  <div
                    key={measurement.id}
                    className="bg-white rounded-lg p-4 shadow-sm border border-slate-100 hover:shadow-md transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3" dir="rtl">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-[#63498b]/10 flex items-center justify-center flex-shrink-0">
                          <Ruler size={20} className="text-[#63498b]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {measurement.name || 'قياس بدون اسم'}
                          </h4>
                          <p className="text-xs text-slate-600">
                            {template?.label || measurement.type || 'نوع غير محدد'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEditMeasurement(measurement)}
                          className="p-2 text-[#63498b] hover:bg-[#63498b]/10 rounded-lg transition-all"
                          title="تعديل القياسات"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingMeasurement(measurement)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Measurements */}
                    <div className="space-y-1.5 mb-3" dir="rtl">
                      {template?.fields.map((field) => {
                        const value = metrics[field.key];
                        if (value === undefined || value === null) return null;
                        
                        return (
                          <div key={field.key} className="flex items-center justify-between text-xs">
                            <span className="text-slate-600">{field.label}</span>
                            <span className="font-medium text-slate-900">{value} {field.unit}</span>
                          </div>
                        );
                      })}
                      {Object.keys(metrics).length === 0 && (
                        <p className="text-xs text-slate-400 italic">لا توجد قياسات مُدخلة</p>
                      )}
                    </div>

                    {/* Date */}
                    <div className="pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-500 flex items-center gap-1" dir="rtl">
                        <Calendar size={10} />
                        {new Date(measurement.createdAt).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
          )}

          {/* Family Measurements Tab Content */}
          {activeTab === 'family' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3" dir="rtl">
              <h3 className="text-base text-slate-900 font-bold">قياسات العائلة</h3>
              <button
                onClick={() => setShowFamilyDialog(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#63498b] text-white rounded-lg text-sm font-medium hover:bg-[#63498b]/90 transition-all"
              >
                <Users size={16} />
                إضافة فرد
              </button>
            </div>
            
            {familyMembers.length === 0 ? (
              <div className="bg-white rounded-lg p-8 shadow-sm border border-slate-100 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-slate-50 flex items-center justify-center">
                  <Users size={28} className="text-slate-400" />
                </div>
                <h4 className="text-lg text-slate-900 font-bold mb-2">لا توجد قياسات عائلية</h4>
                <p className="text-sm text-slate-600 mb-6">
                  أضف قياسات أفراد عائلتك لتسهيل عملية الطلب
                </p>
                <button
                  onClick={() => setShowFamilyDialog(true)}
                  className="px-6 py-3 bg-[#63498b] text-white rounded-lg text-sm font-bold hover:bg-[#63498b]/90 transition-all inline-flex items-center gap-2"
                >
                  <Users size={16} />
                  إضافة أول فرد
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {familyMembers.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white rounded-lg p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-sm text-slate-900 font-bold">{member.name}</h4>
                        <p className="text-xs text-slate-500 mt-1">{member.relation}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteFamilyMember(member.id!)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="حذف"
                        aria-label="حذف"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {member.measurements.height && (
                        <div className="text-slate-600">
                          <span className="text-slate-400">الطول:</span> {member.measurements.height} سم
                        </div>
                      )}
                      {member.measurements.chest && (
                        <div className="text-slate-600">
                          <span className="text-slate-400">الصدر:</span> {member.measurements.chest} سم
                        </div>
                      )}
                      {member.measurements.waist && (
                        <div className="text-slate-600">
                          <span className="text-slate-400">الخصر:</span> {member.measurements.waist} سم
                        </div>
                      )}
                      {member.measurements.shoulder && (
                        <div className="text-slate-600">
                          <span className="text-slate-400">الكتف:</span> {member.measurements.shoulder} سم
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Wallet Tab Content */}
          {activeTab === 'wallet' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3" dir="rtl">
              <h3 className="text-base text-slate-900 font-bold">المحفظة</h3>
              <button 
                onClick={handleRefreshCredits} 
                disabled={isRefreshingCredits}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isRefreshingCredits 
                    ? 'bg-[#63498b]/10 text-[#63498b]' 
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <RefreshCw size={14} className={isRefreshingCredits ? 'animate-spin' : ''} />
                {isRefreshingCredits ? 'جاري التحديث...' : 'تحديث الرصيد'}
              </button>
            </div>
            <div className="bg-white rounded-lg p-8 shadow-sm border border-slate-100">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#63498b]/10 flex items-center justify-center relative">
                  <Wallet size={32} className="text-[#63498b]" />
                  {isRefreshingCredits && (
                    <div className="absolute inset-0 rounded-full border-2 border-[#63498b] border-t-transparent animate-spin"></div>
                  )}
                </div>
                <h4 className="text-2xl text-slate-900 font-bold mb-2 flex items-center justify-center gap-2">
                  {user?.credits || 0} رصيد
                </h4>
                <p className="text-sm text-slate-600">
                  {isRefreshingCredits ? 'جاري تحديث الرصيد...' : 'رصيدك الحالي في المحفظة'}
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="px-6 py-3 bg-[#63498b] text-white rounded-lg text-sm font-bold hover:bg-[#63498b]/90 transition-all"
                >
                  شراء رصيد
                </button>
                <button
                  onClick={() => navigate('/transaction-history')}
                  className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition-all"
                >
                  سجل المعاملات
                </button>
              </div>
            </div>
          </div>
          )}

          {/* Tailor Dashboard Section - Only for tailor users */}
          {user.role === 'tailor' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3" dir="rtl">
              <h3 className="text-base text-slate-900 font-bold">مجموعاتي</h3>
            </div>
            <div className="bg-white rounded-lg p-8 shadow-sm border border-slate-100 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-lg bg-blue-50 flex items-center justify-center">
                <Scissors size={32} className="text-blue-600" />
              </div>
              <h4 className="text-lg text-slate-900 font-bold mb-2">إدارة المجموعات</h4>
              <p className="text-sm text-slate-600 mb-6">
                قم بإدارة مجموعات التصاميم الخاصة بك وإضافة تصاميم جديدة لعملائك.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => navigate('/tailor/collections')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all"
                >
                  مجموعاتي
                </button>
              </div>
            </div>
          </div>
          )}

          {/* Version Footer */}
          <div className="px-4 py-6 mt-8 border-t border-slate-200">
            <div className="max-w-[1400px] mx-auto">
              <div className="text-center text-xs text-slate-400 space-y-1">
                <div className="font-mono">
                  Build: {new Date().toLocaleString('ar-SA', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </div>
                <div className="text-slate-300">
                  Version: 2.14.2026 • Deployed ✓
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#63498b]/10 flex items-center justify-center text-[#63498b]">
                <LogOut size={24} />
              </div>
              <div>
                <h3 className="text-lg text-slate-900 font-bold">تسجيل الخروج</h3>
                <p className="text-xs text-slate-500">هل تريد الخروج من حسابك؟</p>
              </div>
            </div>
            
            <p className="text-sm text-slate-600 mb-6">
              يمكنك البقاء مسجلاً للدخول لمتابعة طلباتك والوصول السريع إلى حسابك.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 h-11 bg-[#63498b] text-white rounded-lg text-sm hover:bg-[#63498b]/90 transition-all"
              >
                البقاء مسجلاً
              </button>
              <button
                onClick={async () => {
                  setShowLogoutConfirm(false);
                  await logout();
                  navigate('/');
                }}
                className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-slate-700 transition-colors"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]" onClick={() => !isDeleting && setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto animate-in zoom-in duration-300" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg text-slate-900 font-bold">حذف الحساب</h3>
                <p className="text-xs text-slate-500">قبل المتابعة، يرجى مراجعة البدائل</p>
              </div>
            </div>
            
            {/* Alternatives */}
            <div className="mb-4 p-4 bg-[#63498b]/5 rounded-lg border border-[#63498b]/10">
              <h4 className="text-sm font-bold text-slate-900 mb-2">هل تفكر في البدائل؟</h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-[#63498b] mt-0.5">•</span>
                  <span>يمكنك تعطيل الحساب مؤقتاً بدلاً من الحذف النهائي</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#63498b] mt-0.5">•</span>
                  <span>تواصل معنا إذا كانت لديك أي مشكلة وسنساعدك</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#63498b] mt-0.5">•</span>
                  <span>ستفقد جميع طلباتك وقياساتك ونقاطك</span>
                </li>
              </ul>
            </div>
            
            {/* Reason */}
            <div className="mb-4">
              <label className="text-sm text-slate-700 mb-2 block font-medium">لماذا تريد حذف حسابك؟</label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="اختياري - ساعدنا على التحسين بمعرفة السبب"
                className="w-full h-24 px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-[#63498b] focus:border-transparent transition-all"
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="w-full h-11 bg-[#63498b] text-white rounded-lg text-sm hover:bg-[#63498b]/90 transition-all"
              >
                إلغاء والعودة
              </button>
              <button
                onClick={() => handleDeleteAccount(true)}
                disabled={isDeleting}
                className="w-full h-11 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm text-slate-700 transition-colors"
              >
                تعطيل الحساب مؤقتاً
              </button>
              <button
                onClick={() => handleDeleteAccount(false)}
                disabled={isDeleting}
                className="w-full h-11 bg-rose-600 text-white rounded-lg text-sm hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    جاري الحذف...
                  </>
                ) : (
                  'حذف نهائي'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Family Member Dialog */}
      {showFamilyDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowFamilyDialog(false)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()} dir="rtl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">إضافة فرد من العائلة</h3>
            <p className="text-sm text-slate-600 mb-4">
              هذه الميزة قيد التطوير. سيتم إضافة نموذج كامل لإدخال البيانات قريباً.
            </p>
            <button
              onClick={() => setShowFamilyDialog(false)}
              className="w-full h-11 bg-[#63498b] text-white rounded-lg text-sm hover:bg-[#63498b]/90 transition-all"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Measurement Editor Dialog - New reusable component */}
      <MeasurementEditorDialog
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        initialData={editorInitialData}
        onSave={handleSaveDialog}
        userGender={user?.gender}
      />

      {/* Delete Measurement Confirmation Dialog */}
      {deletingMeasurement && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[10002]" onClick={() => setDeletingMeasurement(null)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-2">حذف القياس</h3>
                <p className="text-sm text-slate-600 mb-1">
                  هل أنت متأكد من حذف القياس "<strong>{deletingMeasurement.name}</strong>"؟
                </p>
                <p className="text-xs text-slate-500">
                  لن تتمكن من استرجاع هذا القياس بعد الحذف.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingMeasurement(null)}
                disabled={isDeletingMeasurement}
                className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteMeasurement}
                disabled={isDeletingMeasurement}
                className="flex-1 h-10 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeletingMeasurement ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    جاري الحذف...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    حذف نهائي
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
