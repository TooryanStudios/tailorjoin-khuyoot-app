import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  ArrowRight, Check, Edit2, ShoppingCart, Package,
  Ruler, Scissors, AlertCircle, User, MapPin, Phone, Mail, ClipboardList,
  CheckCircle2, Clock
} from 'lucide-react';
import { Button } from '../components/Button';
import { useApp } from '../context/AppContext';
import { firebaseService } from '../services/firebase';

export const OrderSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId: routeOrderId } = useParams<{ orderId: string }>();
  // Legacy support: also accept draftId param name
  const { draftId: legacyDraftId } = useParams<{ draftId: string }>();
  const resolvedOrderId = routeOrderId || legacyDraftId;
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
  const [order, setOrder] = useState<any>(null);

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

        // 1. Try to load a real order from the orders collection
        if (resolvedOrderId && !resolvedOrderId.startsWith('draft_')) {
          try {
            const orderDoc = await firebaseService.getOrder?.(resolvedOrderId);
            if (orderDoc) {
              setOrder(orderDoc);
              // Populate measurement state from order data
              if (orderDoc.measurements) {
                setMeasurements(normalizeMeasurementRecord({
                  measurements: orderDoc.measurements,
                  metrics: orderDoc.measurements,
                  templateName: orderDoc.templateName || orderDoc.categoryName,
                  name: orderDoc.measurementName,
                  notes: orderDoc.notes,
                }));
              }
              // Populate product-like display from order fields
              if (!state?.productId) {
                setProduct({
                  name: orderDoc.productName,
                  price: orderDoc.price,
                  image: orderDoc.productImage || orderDoc.customDesignImageUrl,
                  description: orderDoc.tailorName ? `خياط: ${orderDoc.tailorName}` : undefined,
                });
              }
              setLoading(false);
              return; // Order loaded — skip legacy draft/state logic
            }
          } catch (e) {
            console.warn('[OrderSummary] Could not load order by ID, trying draft fallback', e);
          }
        }

        // 2. Hydrate from draftId if present
        if (resolvedOrderId) {
          try {
            const uid = user?.id || 'guest';
            const drafts = await firebaseService.loadOrderDrafts(uid);
            const found = (drafts || []).find((d: any) => d.id === resolvedOrderId);
            if (found) {
              setMeasurements(normalizeMeasurementRecord(found.measurements));
              setCustomization(found.customizationData || found.customization || null);
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
  }, [state, user, preloadedMeasurement, resolvedOrderId]);

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

  // Status badge helper — kept before early return so React Fast Refresh works correctly
  const statusLabels: Record<string, { label: string; color: string }> = {
    pending:   { label: 'بانتظار موافقة الخياط', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    accepted:  { label: 'قبل الخياط',             color: 'bg-green-50 text-green-700 border-green-200' },
    rejected:  { label: 'رفض الخياط',             color: 'bg-red-50 text-red-700 border-red-200' },
    completed: { label: 'مكتمل',                 color: 'bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] border-[var(--theme-primary)]/25' },
  };
  const orderStatus = order?.status || 'pending';
  const statusBadge = statusLabels[orderStatus] || statusLabels.pending;
  const orderNumber = order?.orderNumber || (resolvedOrderId && !resolvedOrderId.startsWith('draft_') ? resolvedOrderId.substring(0, 8).toUpperCase() : null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">جاري تحميل بيانات الطلب...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32" dir="rtl">

      {/* ── Hero Header ── */}
      <div className="bg-gradient-to-l from-[var(--theme-primary)] to-[var(--theme-primary-dark)] text-white px-4 pt-10 pb-16">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors text-sm"
          >
            <ArrowRight size={18} />
            <span>رجوع</span>
          </button>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-widest mb-1">ملخص الطلب</p>
              <h1 className="text-2xl font-bold">
                {order?.productName || product?.name || 'طلب تفصيل'}
              </h1>
              {orderNumber && (
                <p className="text-white/60 text-xs mt-1 font-mono">#{orderNumber}</p>
              )}
            </div>
            <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${statusBadge.color}`}>
              {orderStatus === 'completed' ? <Check size={14} /> : orderStatus === 'accepted' ? <CheckCircle2 size={14} /> : orderStatus === 'rejected' ? <AlertCircle size={14} /> : <Clock size={14} />}
              {statusBadge.label}
            </span>
          </div>

          {order?.tailorName && (
            <p className="mt-3 text-white/70 text-sm">خياط: <span className="text-white font-medium">{order.tailorName}</span></p>
          )}
        </div>
      </div>

      {/* ── Cards ── */}
      <div className="max-w-3xl mx-auto px-4 -mt-8 space-y-4 pb-10">

        {/* Guest alert */}
        {!user && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-semibold text-amber-800">لم تسجل الدخول</p>
              <p className="text-xs text-amber-700 mt-0.5">سجّل الدخول لمتابعة طلبك وحفظه</p>
            </div>
          </div>
        )}

        {/* Design image (custom_design orders) */}
        {(order?.customDesignImageUrl || order?.productImage) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
              <div className="w-7 h-7 rounded-lg bg-[var(--theme-primary)]/10 flex items-center justify-center">
                <Package size={14} className="text-[var(--theme-primary)]" />
              </div>
              <h2 className="font-bold text-sm text-gray-800">التصميم</h2>
            </div>
            <div className="p-5">
              <img
                src={order.customDesignImageUrl || order.productImage}
                alt="صورة التصميم"
                className="w-full max-w-xs mx-auto rounded-xl object-cover aspect-[3/4] shadow-md"
              />
            </div>
          </div>
        )}

        {/* Product card (shop product orders) */}
        {product && !order?.customDesignImageUrl && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
              <div className="w-7 h-7 rounded-lg bg-[var(--theme-primary)]/10 flex items-center justify-center">
                <Package size={14} className="text-[var(--theme-primary)]" />
              </div>
              <h2 className="font-bold text-sm text-gray-800">معلومات المنتج</h2>
            </div>
            <div className="p-5 flex gap-4">
              {product.image && (
                <img src={product.image} alt={product.name} className="w-20 h-24 object-cover rounded-xl border border-gray-100" />
              )}
              <div className="flex-1">
                <p className="font-bold text-gray-900">{product.name}</p>
                {product.description && <p className="text-xs text-gray-500 mt-1">{product.description}</p>}
                {product.price > 0 && (
                  <p className="mt-2 text-[var(--theme-primary)] font-bold text-lg">{product.price} ر.ع</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Measurements card */}
        {measurements && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[var(--theme-primary)]/10 flex items-center justify-center">
                  <Ruler size={14} className="text-[var(--theme-primary)]" />
                </div>
                <h2 className="font-bold text-sm text-gray-800">المقاسات</h2>
                {measurements.templateName && (
                  <span className="text-[10px] bg-[var(--theme-primary)]/10 text-[var(--theme-primary)] px-2 py-0.5 rounded-full font-medium">
                    {measurements.templateName}
                  </span>
                )}
              </div>
              {!order && (
                <button onClick={handleEditMeasurements} className="flex items-center gap-1 text-xs text-[var(--theme-primary)] hover:underline">
                  <Edit2 size={13} />تعديل
                </button>
              )}
            </div>
            <div className="p-5">
              {measurements.name && (
                <p className="text-xs text-gray-500 mb-3">اسم القياس: <span className="font-semibold text-gray-800">{measurements.name}</span></p>
              )}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {measurements.measurements && Object.entries(measurements.measurements).map(([key, value]: [string, any]) => (
                  <div key={key} className="bg-[var(--theme-primary)]/5 rounded-xl p-2.5 text-center">
                    <p className="text-[10px] text-gray-500 mb-0.5 truncate">{key}</p>
                    <p className="font-bold text-gray-900 text-sm">{value}<span className="text-[10px] font-normal text-gray-400"> سم</span></p>
                  </div>
                ))}
              </div>
              {measurements.notes && (
                <p className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{measurements.notes}</p>
              )}
            </div>
          </div>
        )}

        {/* Customization card */}
        {customization && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[var(--theme-primary)]/10 flex items-center justify-center">
                  <Scissors size={14} className="text-[var(--theme-primary)]" />
                </div>
                <h2 className="font-bold text-sm text-gray-800">التخصيص</h2>
              </div>
              <button onClick={handleEditCustomization} className="flex items-center gap-1 text-xs text-[var(--theme-primary)] hover:underline">
                <Edit2 size={13} />تعديل
              </button>
            </div>
            <div className="p-5 space-y-3">
              {customization.fabricUrl && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">القماش المختار:</p>
                  <img src={customization.fabricUrl} alt="القماش" className="w-24 h-24 object-cover rounded-xl border border-gray-100" />
                </div>
              )}
              {customization.colors && Object.keys(customization.colors).length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">الألوان:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(customization.colors).map(([part, color]: [string, any]) => (
                      <div key={part} className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1">
                        <div className="w-5 h-5 rounded border border-gray-200" style={{ backgroundColor: color }} />
                        <span className="text-xs text-gray-700">{part}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {customization.notes && (
                <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{customization.notes}</p>
              )}
            </div>
          </div>
        )}

        {/* Customer info */}
        {user && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
              <div className="w-7 h-7 rounded-lg bg-[var(--theme-primary)]/10 flex items-center justify-center">
                <User size={14} className="text-[var(--theme-primary)]" />
              </div>
              <h2 className="font-bold text-sm text-gray-800">بيانات العميل</h2>
            </div>
            <div className="p-5 space-y-2">
              {user.name  && <div className="flex items-center gap-2 text-sm text-gray-700"><User size={14} className="text-gray-400" />{user.name}</div>}
              {user.email && <div className="flex items-center gap-2 text-sm text-gray-700"><Mail size={14} className="text-gray-400" />{user.email}</div>}
              {user.phone && <div className="flex items-center gap-2 text-sm text-gray-700"><Phone size={14} className="text-gray-400" />{user.phone}</div>}
              {user.address && <div className="flex items-center gap-2 text-sm text-gray-700"><MapPin size={14} className="text-gray-400" />{user.address}</div>}
            </div>
          </div>
        )}

        {/* Price summary */}
        {(basePrice !== null || addOnEntries.length > 0) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
              <div className="w-7 h-7 rounded-lg bg-[var(--theme-primary)]/10 flex items-center justify-center">
                <ClipboardList size={14} className="text-[var(--theme-primary)]" />
              </div>
              <h2 className="font-bold text-sm text-gray-800">ملخص السعر</h2>
            </div>
            <div className="p-5 space-y-2">
              {basePrice !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">السعر الأساسي</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(basePrice)}</span>
                </div>
              )}
              {addOnEntries.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-500">{item.name}</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(item.price)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <span className="font-bold text-gray-900">الإجمالي التقديري</span>
                <span className="font-bold text-[var(--theme-primary)] text-base">{Number.isFinite(estimatedTotalPrice) ? formatCurrency(estimatedTotalPrice) : '—'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Status note */}
        <div className="bg-[var(--theme-primary)]/5 border border-[var(--theme-primary)]/20 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle2 size={18} className="text-[var(--theme-primary)] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-[var(--theme-primary)]">
            <p className="font-semibold mb-0.5">طلبك قيد المراجعة</p>
            <p className="text-[var(--theme-primary)]/80 text-xs">سيتواصل معك الخياط لتأكيد التفاصيل النهائية قبل البدء بالعمل.</p>
          </div>
        </div>

        {/* Action buttons — only show for non-order flows */}
        {!order && (
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={saveOrderDraft}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-[var(--theme-primary)]/30 text-[var(--theme-primary)] text-sm font-semibold hover:bg-[var(--theme-primary)]/5 transition"
            >
              <Check size={16} />حفظ كمسودة
            </button>
            <button
              onClick={handleConfirmOrder}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[var(--theme-primary)] text-white text-sm font-bold hover:bg-[var(--theme-primary-dark)] transition shadow-sm"
            >
              <ShoppingCart size={16} />تأكيد الطلب
            </button>
          </div>
        )}

      </div>

      {/* Help Video Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">فيديو المساعدة</h3>
              <button onClick={() => setShowHelp(false)} className="text-gray-500 hover:text-gray-900">إغلاق</button>
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
    </div>
  );
};
