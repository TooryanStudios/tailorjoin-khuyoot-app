import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  ArrowRight, Check, Edit2, ShoppingCart, Package,
  Ruler, Scissors, AlertCircle, User, MapPin, Phone, Mail, ClipboardList
} from 'lucide-react';
import { Button } from '../components/Button';
import { useApp } from '../context/AppContext';
import { firebaseService } from '../services/firebase';

export const OrderSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { draftId } = useParams();
  const { user, appSettings } = useApp();
  const [showHelp, setShowHelp] = useState(false);
  
  const state = location.state as {
    measurementId?: string;
    measurementData?: any;
    customizationId?: string;
    customizationData?: any;
    productId?: string;
    from?: string;
    measurementSaved?: boolean;
  };

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [measurements, setMeasurements] = useState<any>(null);
  const [customization, setCustomization] = useState<any>(null);

  const formatMeasurementValue = (value: any) => {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    const str = String(value).trim();
    return str.endsWith('سم') ? str : `${str} سم`;
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return '—';
    }
    const absolute = Math.abs(value);
    const fractionDigits = absolute > 0 && absolute < 1 ? 3 : 2;
    return `${value.toLocaleString('ar-SA', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits
    })} ر.ع`;
  };

  const normalizeAddOnEntry = (entry: any) => {
    if (!entry || typeof entry !== 'object') return null;
    const name = entry.label || entry.title || entry.name || entry.id;
    const possiblePrice = [entry.price, entry.cost, entry.amount, entry.total, entry.value].find((val) => typeof val === 'number');
    if (typeof possiblePrice !== 'number' || Number.isNaN(possiblePrice)) {
      return null;
    }
    return {
      name: name || 'إضافة بدون اسم',
      price: possiblePrice
    };
  };

  const normalizeMeasurementRecord = (raw: any) => {
    if (!raw || typeof raw !== 'object') return null;
    const sourceMetrics = raw.measurements || raw.metrics || raw.values || {};
    const normalizedMetrics = Object.entries(sourceMetrics).reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, any>);
    return {
      ...raw,
      measurements: normalizedMetrics,
      metrics: raw.metrics ? { ...raw.metrics } : normalizedMetrics
    };
  };

  const preloadedMeasurement = useMemo(() => normalizeMeasurementRecord(state?.measurementData), [state?.measurementData]);

  const measurementPayload = measurements || preloadedMeasurement;
  const customizationPayload = customization || state?.customizationData;

  const measurementNavigationState = useMemo(() => {
    const payload = measurementPayload ? { ...measurementPayload } : null;
    const navigationState: Record<string, any> = {
      measurementId: payload?.id || state?.measurementId,
      customizationId: state?.customizationId,
      customizationData: customizationPayload,
      productId: state?.productId,
      from: 'order-summary',
      editMode: true,
      measurementSaved: state?.measurementSaved ?? Boolean(payload?.id)
    };

    if (payload) {
      navigationState.measurementData = payload;
    }

    return navigationState;
  }, [measurementPayload, customizationPayload, state?.measurementId, state?.customizationId, state?.productId, state?.measurementSaved]);

  const goToMeasurements = (options?: { replace?: boolean }) => {
    const path = state?.productId ? `/measurements/${state.productId}` : '/measurements';
    navigate(path, { state: measurementNavigationState, replace: options?.replace });
  };

  const addOnRawSource = useMemo(() => {
    const candidateArrays = [
      customization?.addOns,
      customization?.addons,
      customization?.extraServices,
      customization?.extras,
      customization?.pricing?.addOns,
      customization?.pricing?.addons,
      customization?.priceBreakdown?.addOns,
      customization?.priceBreakdown?.addons,
      customization?.priceBreakdown?.extras,
      product?.addOns,
      product?.addons,
      product?.extraServices,
      product?.pricing?.addOns,
      product?.pricing?.addons
    ];

    return candidateArrays.find((arr) => Array.isArray(arr) && arr.some((item) => typeof item === 'object')) || null;
  }, [customization, product]);

  const addOnEntries = useMemo(() => {
    if (!Array.isArray(addOnRawSource)) return [] as Array<{ name: string; price: number }>;
    return addOnRawSource
      .map(normalizeAddOnEntry)
      .filter((item): item is { name: string; price: number } => Boolean(item));
  }, [addOnRawSource]);

  const addOnsTotal = useMemo(
    () => addOnEntries.reduce((sum, item) => sum + (item.price || 0), 0),
    [addOnEntries]
  );

  const basePrice = typeof product?.price === 'number' && !Number.isNaN(product.price) ? product.price : null;
  const providedTotal = useMemo(() => {
    const candidates = [
      customization?.pricing?.total,
      customization?.priceBreakdown?.total,
      customization?.priceBreakdown?.grandTotal,
      customization?.totalPrice,
      product?.pricing?.total,
      product?.priceBreakdown?.total
    ];
    const found = candidates.find((val) => typeof val === 'number' && !Number.isNaN(val));
    return typeof found === 'number' ? found : null;
  }, [customization, product]);

  const estimatedTotalPrice = useMemo(() => {
    if (typeof providedTotal === 'number') return providedTotal;
    const base = basePrice ?? 0;
    return base + addOnsTotal;
  }, [providedTotal, basePrice, addOnsTotal]);

  const derivedTotalFromParts = (basePrice ?? 0) + addOnsTotal;
  const totalsDiffer =
    typeof providedTotal === 'number' &&
    Math.abs(providedTotal - derivedTotalFromParts) > 0.499;

  useEffect(() => {
    if (preloadedMeasurement) {
      setMeasurements(preloadedMeasurement);
    }
  }, [preloadedMeasurement]);

  const measurementEntries = measurements?.measurements
    ? Object.entries(measurements.measurements).filter(([, value]) => value !== undefined && value !== null && value !== '')
    : [];
  const totalMeasurements = measurements?.measurements
    ? Object.keys(measurements.measurements).length
    : 0;
  const measurementCompletionText = totalMeasurements
    ? `${measurementEntries.length} من ${totalMeasurements} قياسات مكتملة`
    : 'لا يوجد قياسات مدخلة';
  const colorCount = customization?.colors ? Object.keys(customization.colors).length : 0;
  const formattedContact = user
    ? ([user.name, user.phone, user.email].filter(Boolean).join(' • ') || 'لم يتم توفير بيانات اتصال كافية')
    : 'عميل ضيف';
  const measurementNotes = typeof measurements?.notes === 'string' ? measurements.notes.trim() : '';
  const customizationNotes = typeof customization?.notes === 'string' ? customization.notes.trim() : '';
  const originScreen = state?.from;
  const fabricSummary = customization?.fabricName
    || (customization?.fabricUrl ? 'تم اختيار صورة قماش مخصصة' : 'لم يتم تحديد قماش');

  const summaryItems: Array<{ label: string; value: React.ReactNode }> = [
    { label: 'المنتج', value: product?.name || 'لم يتم اختيار المنتج' },
    { label: 'السعر الأساسي', value: basePrice !== null ? formatCurrency(basePrice) : '—' },
    { label: 'القالب المختار', value: measurements?.templateName || '—' },
    { label: 'حالة القياسات', value: measurementCompletionText },
    { label: 'القماش', value: fabricSummary },
    { label: 'عدد الألوان المختارة', value: colorCount ? `${colorCount} لون` : 'لا يوجد' },
    { label: 'ملاحظات القياس', value: measurementNotes || 'لا يوجد' },
    { label: 'ملاحظات التخصيص', value: customizationNotes || 'لا يوجد' },
    { label: 'بيانات التواصل', value: formattedContact },
    addOnEntries.length > 0 ? { label: 'إجمالي الإضافات', value: formatCurrency(addOnsTotal) } : null,
    { label: 'الإجمالي التقديري', value: Number.isFinite(estimatedTotalPrice) ? formatCurrency(estimatedTotalPrice) : '—' },
    totalsDiffer ? { label: 'إجمالي النظام', value: formatCurrency(providedTotal) } : null,
    originScreen ? { label: 'آخر شاشة تم الوصول منها', value: originScreen } : null,
  ].filter(Boolean) as Array<{ label: string; value: React.ReactNode }>;

  // Load data (and hydrate by draftId if provided)
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('[OrderSummary] Loading data with state:', state);

        // Hydrate from draftId if present
        if (draftId) {
          try {
            const uid = user?.id || 'guest';
            const drafts = await firebaseService.loadOrderDrafts(uid);
            const found = (drafts || []).find((d: any) => d.id === draftId);
            if (found) {
              setMeasurements(normalizeMeasurementRecord(found.measurements));
              setCustomization(found.customizationData || found.customization || null);
              // Load product by id from draft
              if (found.productId) {
                const productData = await firebaseService.getProduct(found.productId);
                setProduct(productData);
              }
            }
          } catch (e) {
            console.warn('[OrderSummary] Failed to hydrate from draftId', e);
          }
        }

        // Load product
        if (state?.productId) {
          const productData = await firebaseService.getProduct(state.productId);
          setProduct(productData);
        }

        // Load measurements only if not already provided via navigation state
        if (!preloadedMeasurement && state?.measurementId) {
          if (state.measurementId.startsWith('guest_')) {
            // Guest measurements from localStorage
            const guestMeasurements = JSON.parse(localStorage.getItem('guest_measurements') || '[]');
            const found = guestMeasurements.find((m: any) => m.id === state.measurementId);
            const normalized = normalizeMeasurementRecord(found);
            if (normalized) {
              setMeasurements(normalized);
            }
          } else if (user?.id) {
            // Authenticated user measurements from Firebase
            const userMeasurements = await firebaseService.getMeasurements(user.id);
            const found = userMeasurements.find((m: any) => m.id === state.measurementId);
            const normalized = normalizeMeasurementRecord(found);
            if (normalized) {
              setMeasurements(normalized);
            }
          }
        }

        // Load customization
        if (state?.customizationData) {
          setCustomization(state.customizationData);
        }
        // Note: customization is passed via state.customizationData, no need to fetch from Firebase

      } catch (error) {
        console.error('[OrderSummary] Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [state, user, preloadedMeasurement, draftId]);

  const handleConfirmOrder = () => {
    // Navigate to checkout or order confirmation
    navigate('/checkout', {
      state: {
        measurementId: state?.measurementId,
        customizationId: state?.customizationId,
        productId: state?.productId,
        product,
        measurements,
        customization
      }
    });
  };

  const saveOrderDraft = () => {
    try {
      const uid = user?.id || 'guest';
      const key = `order_drafts_${uid}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const now = new Date().toISOString();
      const draftId = state?.measurementId || (measurements?.id ? String(measurements.id) : `draft_${Date.now()}`);
      const newDraft = {
        id: draftId,
        userId: uid,
        productId: state?.productId || product?.id || null,
        productName: product?.name || null,
        productPrice: product?.price || null,
        measurements,
        customization,
        status: 'draft',
        updatedAt: now,
        createdAt: now
      };
      const filtered = Array.isArray(existing) ? existing.filter((d: any) => d.id !== draftId) : [];
      localStorage.setItem(key, JSON.stringify([...filtered, newDraft]));
      // Try to persist to Firebase as well (best-effort)
      try {
        void firebaseService.saveOrderDraft(newDraft);
      } catch (err) {
        console.warn('[OrderSummary] Firebase draft save skipped/failure:', err);
      }
      alert('تم حفظ المسودة بنجاح. يمكنك العودة لاحقاً لإكمال الطلب.');
    } catch (e) {
      console.error('[OrderSummary] Failed to save draft:', e);
      alert('تعذر حفظ المسودة محلياً. حاول مرة أخرى.');
    }
  };

  // Auto-save on page load when we have meaningful data
  useEffect(() => {
    if (product || measurements || customization) {
      // Debounce minimal
      const t = setTimeout(() => {
        saveOrderDraft();
      }, 300);
      return () => clearTimeout(t);
    }
  }, [product, measurements, customization]);

  const handleEditMeasurements = () => {
    goToMeasurements();
  };

  const handleEditCustomization = () => {
    navigate(`/customization/${state?.productId}`, {
      state: {
        editMode: true
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 md:pb-24 px-4 md:px-6 lg:px-8 py-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => goToMeasurements({ replace: true })}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowRight size={20} />
            <span>العودة</span>
          </button>
          
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Package className="text-blue-600 dark:text-blue-400" size={32} />
            ملخص الطلب
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            تحقق من معلومات طلبك قبل التأكيد
          </p>
          {appSettings?.helpVideo?.enabled && (
            <div className="mt-3">
              <Button variant="outline" onClick={() => setShowHelp(true)}>
                {appSettings.helpVideo.buttonText}
              </Button>
            </div>
          )}
        </div>

        {/* Alert for guest users */}
        {!user && (
          <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  تنبيه: لم تسجل الدخول
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  لحفظ طلبك وإمكانية متابعته لاحقاً، يُفضل تسجيل الدخول أو إنشاء حساب جديد
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Product Info */}
          {product && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Package className="text-blue-600 dark:text-blue-400" size={24} />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  معلومات المنتج
                </h2>
              </div>
              
              <div className="flex gap-4">
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-24 h-28 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {product.description}
                    </p>
                  )}
                  {product.price && (
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {product.price} ر.ع
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Customization Details */}
          {customization && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Scissors className="text-purple-600 dark:text-purple-400" size={24} />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    التخصيص
                  </h2>
                </div>
                <button
                  onClick={handleEditCustomization}
                  className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Edit2 size={16} />
                  <span>تعديل</span>
                </button>
              </div>

              <div className="space-y-3">
                {customization.fabricUrl && (
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">القماش المختار:</p>
                    <img
                      src={customization.fabricUrl}
                      alt="القماش"
                      className="w-32 h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                    />
                  </div>
                )}
                
                {customization.colors && Object.keys(customization.colors).length > 0 && (
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">الألوان:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(customization.colors).map(([part, color]: [string, any]) => (
                        <div key={part} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg px-3 py-2">
                          <div
                            className="w-6 h-6 rounded border border-slate-300 dark:border-slate-600"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{part}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {customization.notes && (
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">ملاحظات:</p>
                    <p className="text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                      {customization.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Measurements */}
          {measurements && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Ruler className="text-emerald-600 dark:text-emerald-400" size={24} />
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    المقاسات
                  </h2>
                </div>
                <button
                  onClick={handleEditMeasurements}
                  className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Edit2 size={16} />
                  <span>تعديل</span>
                </button>
              </div>

              <div className="space-y-3">
                {measurements.templateName && (
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-400">القالب:</p>
                    <p className="font-medium text-slate-900 dark:text-white">{measurements.templateName}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {measurements.measurements && Object.entries(measurements.measurements).map(([key, value]: [string, any]) => (
                    <div
                      key={key}
                      className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3"
                    >
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">{key}</p>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {value} <span className="text-sm font-normal text-slate-500">سم</span>
                      </p>
                    </div>
                  ))}
                </div>

                {measurements.notes && (
                  <div className="mt-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">ملاحظات:</p>
                    <p className="text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                      {measurements.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Customer Info (if logged in) */}
          {user && (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="text-indigo-600 dark:text-indigo-400" size={24} />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  معلومات العميل
                </h2>
              </div>

              <div className="space-y-3">
                {user.name && (
                  <div className="flex items-center gap-3">
                    <User size={18} className="text-slate-400" />
                    <span className="text-slate-900 dark:text-white">{user.name}</span>
                  </div>
                )}
                {user.email && (
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-slate-400" />
                    <span className="text-slate-900 dark:text-white">{user.email}</span>
                  </div>
                )}
                {user.phone && (
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-slate-400" />
                    <span className="text-slate-900 dark:text-white">{user.phone}</span>
                  </div>
                )}
                {user.address && (
                  <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-slate-400" />
                    <span className="text-slate-900 dark:text-white">{user.address}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Detailed Summary */}
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <ClipboardList className="text-teal-600 dark:text-teal-400" size={24} />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              ملخص تفصيلي قبل التأكيد
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {summaryItems.map((item) => (
              <div
                key={item.label}
                className="bg-slate-50 dark:bg-slate-700/40 rounded-lg p-3 border border-slate-200/70 dark:border-slate-600/70"
              >
                <p className="text-xs text-slate-600 dark:text-slate-300 mb-1">{item.label}</p>
                <div className="text-sm font-semibold text-slate-900 dark:text-white break-words">
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {addOnEntries.length > 0 && (
            <div className="mt-5">
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">تفاصيل الإضافات المدفوعة</p>
              <div className="space-y-2">
                {addOnEntries.map((item, index) => (
                  <div
                    key={`${item.name}-${index}`}
                    className="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{item.name}</span>
                    <span className="text-slate-900 dark:text-white font-semibold">{formatCurrency(item.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {measurementEntries.length > 0 && (
            <div className="mt-5">
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">تفاصيل القياسات البارزة</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {measurementEntries.slice(0, 6).map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-sm"
                  >
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{key}</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formatMeasurementValue(value)}
                    </p>
                  </div>
                ))}
              </div>
              {measurementEntries.length > 6 && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  يوجد {measurementEntries.length - 6} قياسات إضافية، راجع قسم المقاسات أعلاه للاطلاع عليها بالكامل.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button
            onClick={saveOrderDraft}
            variant="outline"
            className="flex-1"
          >
            <Check size={20} />
            <span>حفظ كمسودة</span>
          </Button>
          <Button
            onClick={() => goToMeasurements({ replace: true })}
            variant="outline"
            className="flex-1"
          >
            <ArrowRight size={20} />
            <span>العودة للتعديل</span>
          </Button>
          
          <Button
            onClick={handleConfirmOrder}
            className="flex-1"
          >
            <Check size={20} />
            <span>تأكيد الطلب والمتابعة</span>
            <ShoppingCart size={20} />
          </Button>
        </div>

        {/* Help Video Modal */}
        {showHelp && (
          <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white">فيديو المساعدة</h3>
                <button onClick={() => setShowHelp(false)} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">إغلاق</button>
              </div>
              <div className="aspect-video bg-black">
                <iframe
                  src={(appSettings?.helpVideo?.url || 'https://www.youtube.com/embed/6eZtn5Du8O4') + '?rel=0'}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Info Note */}
        <div className="mt-6 mb-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-semibold mb-1">ملاحظة مهمة:</p>
              <p>
                بعد تأكيد الطلب، سيتم مراجعة التفاصيل من قبل الخياط. 
                سيتواصل معك الخياط لتأكيد التفاصيل النهائية قبل البدء بالعمل.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
