import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { X, Upload, Loader2, Check, AlertCircle, Star, Eye } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { firebaseService, db } from '../../../services/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../services/firebase';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { MeasurementEditorDialog } from '@/src/components/MeasurementEditorDialog';

export interface UploadDesignDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: { imageUrl: string; tailorId: string; tailorName: string; productId?: string; measurements?: any }) => void;
}

type DialogStep = 'upload' | 'selecting-tailors' | 'tailor-selection' | 'confirmation';

interface Tailor {
  id: string;
  name: string;
  email?: string;
  rating?: number;
  reviews?: number;
  region?: string;
}

interface ProductOption {
  id: string;
  name: string;
  image?: string;
  price?: number;
}

const StarRating = ({ rating, reviews }: { rating?: number; reviews?: number }) => {
  const stars = Math.round((rating || 0) / 5 * 5);
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={14}
            className={i <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-zinc-700">
        {rating?.toFixed(1)} ({reviews || 0})
      </span>
    </div>
  );
};



export const UploadDesignDialog: React.FC<UploadDesignDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation(['designer']);
  const { user, toggleAuthModal } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<DialogStep>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [selectedTailor, setSelectedTailor] = useState<Tailor | null>(null);
  
  // Measurements Modal
  const [showMeasurementsModal, setShowMeasurementsModal] = useState(false);
  const [savedMeasurements, setSavedMeasurements] = useState<any>(null);

  // Tailor Products Preview
  const [showTailorProducts, setShowTailorProducts] = useState<Tailor | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  const uploadImageToFirebase = async (file: File): Promise<string> => {
    if (!user?.uid) throw new Error('User not authenticated');
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
    const fileName = `${timestamp}_${sanitizedFileName}`;
    const imageRef = storageRef(storage, `user_designs/${user.uid}/${fileName}`);
    await uploadBytes(imageRef, file, { contentType: file.type || 'image/jpeg' });
    return await getDownloadURL(imageRef);
  };

  const handleFileSelect = async (file: File) => {
    setError('');
    if (!user?.uid) {
      setError('يرجى تسجيل الدخول أولاً');
      toggleAuthModal(true, 'login');
      return;
    }
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('JPG أو PNG فقط');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('الحد الأقصى 5 MB');
      return;
    }

    setUploadedFile(file);
    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => setUploadedImageUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    } catch (err) {
      setError((err as any).message || 'خطأ');
      setUploadedFile(null);
      setUploadedImageUrl('');
    } finally {
      setLoading(false);
    }
  };

  const handleMeasurementSave = async (data: {
    name: string; type: string; metrics: Record<string, number>; notes: string;
    templateId?: string; templateName?: string;
  }) => {
    try {
      setLoading(true);
      const saveData = {
        userId: user?.uid,
        name: data.name,
        type: data.type,
        templateId: data.templateId,
        templateName: data.templateName,
        metrics: data.metrics,
        notes: data.notes,
        createdAt: new Date().toISOString(),
      };
      await firebaseService.saveMeasurement(saveData);
      setSavedMeasurements(saveData);
      setError('');
      // Proceed to tailor search after dialog closes
      await loadRecommendedTailors();
    } catch (err) {
      setError(`فشل حفظ القياسات: ${(err as any)?.message}`);
      throw err; // re-throw so dialog stays open
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendedTailors = async () => {
    try {
      setStep('selecting-tailors');
      setLoading(true);
      setError('');
      const userRegion = user?.region || 'riyadh';
      let fetchedTailors = await firebaseService.getTailorsByRegion(userRegion, 10);

      if (!fetchedTailors || fetchedTailors.length === 0) {
        try {
          const snapshot = await getDocs(
            query(
              collection(db, 'users'),
              where('role', '==', 'tailor'),
              where('approvalStatus', '==', 'approved'),
              limit(20)
            )
          );
          if (snapshot.docs.length > 0) {
            fetchedTailors = snapshot.docs.map((doc: any) => ({
              id: doc.id,
              name: doc.data().name || 'Unknown',
              email: doc.data().email,
              rating: doc.data().rating,
              reviews: doc.data().reviewsCount || 0,
              region: doc.data().region,
            }));
          }
        } catch (fallbackErr) {
          console.error('Fallback failed:', fallbackErr);
        }
      }

      const transformedTailors = (fetchedTailors || []).map((t: any) => ({
        id: t.uid || t.id,
        name: t.name,
        email: t.email,
        rating: t.rating,
        reviews: t.reviews || t.reviewsCount || 0,
        region: t.region,
      }));

      setTailors(transformedTailors);
      if (transformedTailors.length === 0) {
        setError('لا توجد خياطين متاحين حالياً');
      }
      setStep('tailor-selection');
    } catch (err) {
      setError('فشل تحميل الخياطين');
      setStep('upload');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedTailor || !uploadedFile) {
      setError('يرجى تحديد خياط');
      return;
    }
    if (!user?.uid) {
      setError('يجب تسجيل الدخول أولاً');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // 1. Upload design image to Firebase Storage
      const downloadUrl = await uploadImageToFirebase(uploadedFile);

      // 2. Build measurement labels map for the tailor dashboard
      const measurementLabels: Record<string, string> = {};
      if (savedMeasurements?.metrics) {
        Object.keys(savedMeasurements.metrics).forEach((key) => {
          measurementLabels[key] = key;
        });
      }

      // 3. Create order in the existing `orders` collection — same flow as ClientMeasurementsV2
      const orderData = {
        // Mark as a custom design upload (no shop product attached)
        orderType: 'custom_design' as const,
        productId: 'custom_design',
        productName: savedMeasurements?.templateName || savedMeasurements?.type || 'تصميم مخصص',
        productImage: downloadUrl,
        customDesignImageUrl: downloadUrl,

        // Tailor
        tailorId: selectedTailor.id,
        tailorName: selectedTailor.name,
        tailorLocation: selectedTailor.region || '',
        region: selectedTailor.region || '',

        // Customer
        userId: user.uid,
        customerId: user.uid,
        customerName: (user as any)?.displayName || (user as any)?.name || '',
        customerEmail: (user as any)?.email || '',
        customerPhone: (user as any)?.phoneNumber || (user as any)?.phone || '',

        // Measurements
        measurements: savedMeasurements?.metrics || null,
        measurementLabels,
        measurementName: savedMeasurements?.name || null,
        templateId: savedMeasurements?.templateId || null,
        templateName: savedMeasurements?.templateName || null,
        notes: savedMeasurements?.notes || '',

        // Status — tailor must accept/reject
        status: 'pending' as const,
        acceptedByTailor: false,
        price: 0,
      };

      const orderId = await firebaseService.createOrder(orderData);

      if (onSuccess) {
        onSuccess({
          imageUrl: downloadUrl,
          tailorId: selectedTailor.id,
          tailorName: selectedTailor.name,
          measurements: savedMeasurements,
        });
      }

      // Navigate the user to their order summary
      onClose();
      window.location.href = `/order-summary/${orderId}`;
    } catch (err) {
      setError((err as any).message || 'فشل إرسال الطلب');
    } finally {
      setLoading(false);
    }
  };

  /* Step label helper */
  const stepLabel = (s: DialogStep) => {
    if (s === 'upload') return 'الصورة';
    if (s === 'selecting-tailors') return 'تحميل';
    if (s === 'tailor-selection') return 'الخياط';
    return 'التأكيد';
  };
  const steps: DialogStep[] = ['upload', 'tailor-selection', 'confirmation'];
  const currentStepIndex = steps.indexOf(step === 'selecting-tailors' ? 'tailor-selection' : step);

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Main Dialog */}
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4"
        onClick={(e) => e.target === e.currentTarget && !showMeasurementsModal && onClose()}
      >
      {/* Main Dialog */}
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex"
        dir="rtl"
      >
        {/* Left Column - Image Preview (Sticky) */}
        {(uploadedImageUrl || step === 'upload') && (
          <div className="w-36 bg-gradient-to-b from-[var(--theme-primary)]/8 to-[var(--theme-primary)]/4 p-4 flex flex-col border-l border-[var(--theme-primary)]/15">
            <h3 className="text-[10px] font-bold text-[var(--theme-primary)] mb-3 uppercase tracking-widest">التصميم</h3>
            {uploadedImageUrl ? (
              <div className="space-y-2 flex-1 flex flex-col">
                <div className="relative">
                  <img
                    src={uploadedImageUrl}
                    alt="Design"
                    className="w-full aspect-[3/4] object-cover rounded-xl border-2 border-[var(--theme-primary)] shadow-md"
                  />
                  <button
                    onClick={() => {
                      setUploadedFile(null);
                      setUploadedImageUrl('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    title="تغيير الصورة"
                    className="absolute top-1 left-1 bg-white/90 text-[10px] text-red-600 hover:bg-red-50 py-0.5 px-1.5 rounded-md shadow transition"
                  >
                    تغيير
                  </button>
                </div>

                {/* Measurements Summary Card */}
                {savedMeasurements ? (
                  <div className="bg-[var(--theme-primary)]/8 border border-[var(--theme-primary)]/25 rounded-lg p-2">
                    <p className="text-[9px] font-bold text-[var(--theme-primary)] uppercase tracking-wide mb-0.5">القياسات ✓</p>
                    <p className="text-[11px] font-semibold text-gray-900 leading-tight truncate">{savedMeasurements.name}</p>
                    <p className="text-[10px] text-gray-500 truncate">{savedMeasurements.templateName || savedMeasurements.type}</p>
                  </div>
                ) : (
                  <div className="border border-dashed border-[var(--theme-primary)]/30 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-[var(--theme-primary)]/60">لا توجد قياسات</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[var(--theme-primary)]/8 flex items-center justify-center">
                  <Upload size={16} className="text-[var(--theme-primary)]/50" />
                </div>
                <p className="text-[10px] text-gray-400">ارفع صورة التصميم</p>
              </div>
            )}
          </div>
        )}

        {/* Right Column - Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 bg-gradient-to-l from-[var(--theme-primary)]/5 via-white to-white">
            <div>
              <h2 className="text-base font-bold text-gray-900">رفع تصميم للخياطة</h2>
              <p className="text-[11px] text-[var(--theme-primary)]/70 font-medium">
                {step === 'upload' ? 'ارفع صورة تصميمك' :
                 step === 'selecting-tailors' ? 'يتم تحميل الخياطين...' :
                 step === 'tailor-selection' ? 'اختر خياطك المفضل' :
                 'مراجعة الطلب وإرساله'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition"
              title="إغلاق"
              aria-label="إغلاق"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="px-5 py-2.5 bg-white border-b border-gray-100">
            <div className="flex items-center gap-0">
              {steps.map((s, i) => (
                <React.Fragment key={s}>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      i < currentStepIndex ? 'bg-[var(--theme-primary)] text-white' :
                      i === currentStepIndex ? 'bg-[var(--theme-primary)] text-white ring-2 ring-[var(--theme-primary)]/25' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {i < currentStepIndex ? '✓' : i + 1}
                    </div>
                    <span className={`text-[11px] font-medium hidden sm:block ${
                      i <= currentStepIndex ? 'text-[var(--theme-primary)]' : 'text-gray-400'
                    }`}>{stepLabel(s)}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1.5 rounded transition-all ${
                      i < currentStepIndex ? 'bg-[var(--theme-primary)]' : 'bg-gray-100'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-5 overflow-y-auto">
            {/* Upload Step */}
            {step === 'upload' && !user?.uid && (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-[var(--theme-primary)]/10 flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-6 h-6 text-[var(--theme-primary)]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">تسجيل الدخول مطلوب</h3>
                <p className="text-xs text-gray-500">يجب تسجيل الدخول لرفع التصاميم والتواصل مع الخياطين</p>
              </div>
            )}

            {/* Upload Section */}
            {step === 'upload' && user?.uid && (
              <div className="space-y-3">
                {!loading ? (
                  <>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
                      }}
                      className="border-2 border-dashed border-[var(--theme-primary)]/30 rounded-xl p-8 text-center cursor-pointer hover:border-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/3 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-full bg-[var(--theme-primary)]/8 group-hover:bg-[var(--theme-primary)]/15 flex items-center justify-center mx-auto mb-3 transition-all">
                        <Upload className="w-5 h-5 text-[var(--theme-primary)]" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">انقر أو اسحب الصورة هنا</p>
                      <p className="text-xs text-gray-400 mt-1">JPG أو PNG • حتى 5MB</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={(e) => e.currentTarget.files?.[0] && handleFileSelect(e.currentTarget.files[0])}
                      className="hidden"
                      title="اختر صورة"
                      aria-label="اختر صورة"
                    />
                  </>
                ) : (
                  <div className="text-center py-6">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--theme-primary)] mx-auto mb-2" />
                    <p className="text-sm text-gray-500">جاري المعالجة...</p>
                  </div>
                )}
              </div>
            )}

            {/* ------- Tailor Selection ------- */}
            {step === 'tailor-selection' && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">الخياطون المتاحون</p>
                
                {loading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--theme-primary)] mx-auto mb-2" />
                    <p className="text-xs text-gray-500">جاري البحث عن الخياطين...</p>
                  </div>
                ) : tailors.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">لا توجد خياطين متاحين</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {tailors.map((tailor) => (
                      <div
                        key={tailor.id}
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                          selectedTailor?.id === tailor.id
                            ? 'border-[var(--theme-primary)] bg-[var(--theme-primary)]/5 shadow-sm'
                            : 'border-gray-150 hover:border-[var(--theme-primary)]/40 bg-white hover:shadow-sm'
                        }`}
                        onClick={() => setSelectedTailor(tailor)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-gray-900">{tailor.name}</h4>
                            {tailor.rating && (
                              <StarRating rating={tailor.rating} reviews={tailor.reviews} />
                            )}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowTailorProducts(tailor); }}
                            title="عرض أعمال الخياط"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/8 transition-all"
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                        {selectedTailor?.id === tailor.id && (
                          <div className="mt-1.5 text-[11px] text-[var(--theme-primary)] font-semibold flex items-center gap-1">
                            <span className="w-3.5 h-3.5 rounded-full bg-[var(--theme-primary)] text-white flex items-center justify-center text-[8px]">✓</span>
                            تم التحديد
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Confirmation Step */}
            {step === 'confirmation' && (
              <div className="space-y-3">
                {/* Status header */}
                <div className="flex items-center gap-3 bg-[var(--theme-primary)]/6 rounded-xl p-3 border border-[var(--theme-primary)]/15">
                  <div className="w-9 h-9 bg-[var(--theme-primary)] rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">جاهز للإرسال</h3>
                    <p className="text-[11px] text-gray-500">سيتلقى الخياط الطلب ويمكنه القبول أو الرفض</p>
                  </div>
                </div>

                {/* Summary grid */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Tailor card */}
                  <div className="bg-white border border-gray-150 rounded-xl p-3 shadow-sm space-y-1">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold">الخياط</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{selectedTailor?.name}</p>
                    {selectedTailor?.rating && (
                      <StarRating rating={selectedTailor.rating} reviews={selectedTailor.reviews} />
                    )}
                    {selectedTailor?.region && (
                      <p className="text-[11px] text-gray-400">{selectedTailor.region}</p>
                    )}
                  </div>

                  {/* Measurements card */}
                  <div className={`rounded-xl p-3 shadow-sm space-y-1 ${
                    savedMeasurements ? 'bg-[var(--theme-primary)]/5 border border-[var(--theme-primary)]/20' : 'bg-gray-50 border border-gray-150'
                  }`}>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold">القياسات</p>
                    {savedMeasurements ? (
                      <>
                        <p className="text-sm font-bold text-[var(--theme-primary)] truncate">{savedMeasurements.name}</p>
                        <p className="text-[11px] text-gray-500 truncate">{savedMeasurements.templateName || savedMeasurements.type}</p>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400 italic">غير مرفق</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2">
                <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            {step !== 'confirmation' && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition"
              >
                إلغاء
              </button>
            )}

            {step === 'upload' && !user?.uid && (
              <button
                onClick={() => toggleAuthModal(true, 'login')}
                className="flex-1 py-2 px-4 text-xs font-medium text-white bg-[var(--theme-primary)] rounded-lg hover:bg-[var(--theme-primary-dark)] transition"
              >
                تسجيل الدخول
              </button>
            )}

            {step === 'upload' && user?.uid && uploadedImageUrl && (
              <button
                onClick={() => setShowMeasurementsModal(true)}
                disabled={loading}
                className="flex-1 py-2 px-4 text-xs font-medium text-white bg-[var(--theme-primary)] rounded-lg hover:bg-[var(--theme-primary-dark)] disabled:opacity-50 transition flex items-center justify-center gap-1"
              >
                {loading ? <><Loader2 size={13} className="animate-spin" />جاري...</> : <>إضافة القياسات ←</>}
              </button>
            )}

            {step === 'tailor-selection' && selectedTailor && (
              <button
                onClick={() => setStep('confirmation')}
                className="flex-1 py-2 px-4 text-xs font-medium text-white bg-[var(--theme-primary)] rounded-lg hover:bg-[var(--theme-primary-dark)] transition flex items-center justify-center gap-1"
              >
                التالي ←
              </button>
            )}

            {step === 'confirmation' && (
              <>
                <button
                  onClick={() => setStep('tailor-selection')}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition"
                >
                  رجوع
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 py-2 px-4 text-xs font-medium text-white bg-[var(--theme-primary)] rounded-lg hover:bg-[var(--theme-primary-dark)] disabled:opacity-50 transition flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Check size={13} />
                      إرسال الطلب للخياط
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Measurements Modal - reuses the exact same dialog from Account/Measurements page */}
    <MeasurementEditorDialog
      isOpen={showMeasurementsModal}
      onClose={() => setShowMeasurementsModal(false)}
      onSave={handleMeasurementSave}
      userGender={(user as any)?.gender}
    />

    {/* Tailor Products Preview Modal */}
    {showTailorProducts && (
      <div
        className="fixed inset-0 z-[10100] flex items-center justify-center bg-black/50"
        onClick={() => setShowTailorProducts(null)}
      >
        <div
          className="relative w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl p-5"
          dir="rtl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">{showTailorProducts.name}</h3>
            <button
              onClick={() => setShowTailorProducts(null)}
              title="إغلاق"
              className="p-1 rounded-lg hover:bg-gray-100 transition"
            >
              <X size={18} />
            </button>
          </div>
          {showTailorProducts.rating && (
            <div className="mb-3">
              <StarRating rating={showTailorProducts.rating} reviews={showTailorProducts.reviews} />
            </div>
          )}
          {showTailorProducts.region && (
            <p className="text-sm text-gray-500 mb-4">المنطقة: {showTailorProducts.region}</p>
          )}
          <div className="bg-gray-50 rounded-xl p-6 text-center text-sm text-gray-400">
            معرض أعمال الخياط قادم قريباً
          </div>
          <button
            onClick={() => { setShowTailorProducts(null); setSelectedTailor(showTailorProducts); }}
            className="mt-4 w-full py-2 px-4 text-sm font-medium text-white bg-[var(--theme-primary)] rounded-lg hover:bg-[var(--theme-primary-dark)] transition"
          >
            اختر هذا الخياط
          </button>
        </div>
      </div>
    )}
    </>,

    document.body
  );
};

export default UploadDesignDialog;

