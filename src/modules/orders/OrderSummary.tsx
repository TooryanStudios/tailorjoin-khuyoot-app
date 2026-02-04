import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  ArrowRight,
  CheckCircle2, 
  MapPin, 
  Scissors, 
  Shield, 
  Star, 
  ChevronRight, 
  ShoppingBag,
  Ruler,
  Layers,
  Search,
  Check,
  FileText,
  History,
} from 'lucide-react';
import { firebaseService } from '../../services/firebase';
import { measurementService } from '../measurements/services/measurementService';
import { useApp } from '../../../context/AppContext';

type OrderSummaryView = 'details' | 'chooseTailor' | 'submitted';

function formatMeasurementKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function safeDateString(value: any, locale: string): string {
  try {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString(locale);
  } catch {
    return '—';
  }
}

function parsePrice(p: any): number {
  if (typeof p === 'number') return p;
  if (typeof p === 'string') {
    const matched = p.match(/(\d+(\.\d+)?)/);
    return matched ? parseFloat(matched[0]) : 0;
  }
  return 0;
}

const TailorCard = React.memo(function TailorCard({
  tailor,
  onSelect,
  disabled,
}: {
  tailor: any;
  onSelect: (tailor: any) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation('orderSummary');
  const { t: tCommon } = useTranslation('common');
  const imageSrc = tailor?.image || tailor?.profileImage || null;
  const rating = typeof tailor?.rating === 'number' ? tailor.rating : 5.0;

  return (
    <div className="group bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/10 p-4 flex items-center gap-4 hover:bg-zinc-800/80 transition-all duration-300">
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0 border border-white/5 group-hover:border-blue-500/30 transition-colors">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={tailor?.name || tCommon('roleTailor')}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-800/50">
            <Scissors className="text-white/20" size={24} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-white font-bold truncate">{tailor?.name || tCommon('roleTailor')}</h4>
          <div className="flex items-center gap-1 text-blue-400 text-xs font-bold bg-blue-400/10 px-1.5 py-0.5 rounded-md">
            <Star size={12} fill="currentColor" />
            <span>{rating.toFixed(1)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-1 text-zinc-400">
          <MapPin size={12} />
          <p className="text-xs truncate">{tailor?.location || tailor?.region || '—'}</p>
        </div>
      </div>
      <button
        onClick={() => onSelect(tailor)}
        disabled={disabled}
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 active:scale-95 transition-all uppercase tracking-wider"
      >
        {t('send')}
      </button>
    </div>
  );
});

const SubmissionDialog = React.memo(function SubmissionDialog({
  open,
  tailorName,
  onTrackOrder,
  onGoHome,
  onBrowseSameShop,
  onViewTailorProfile,
  onClose,
  disableActions,
}: {
  open: boolean;
  tailorName?: string | null;
  onTrackOrder: () => void;
  onGoHome: () => void;
  onBrowseSameShop: () => void;
  onViewTailorProfile: () => void;
  onClose: () => void;
  disableActions?: boolean;
}) {
  const { t } = useTranslation('orderSummary');
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden"
      data-overlay="khuyoot-modal"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-[#000000]/80 backdrop-blur-xl transition-all duration-500" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-[2.5rem] border border-white/10 bg-zinc-950 p-8 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Yellow pulse glow for "Pending/Submitted" state */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-amber-500/20 blur-[128px] rounded-full pointer-events-none animate-pulse" />
        
        <button
          type="button"
          onClick={onClose}
          aria-label={t('closeAriaLabel')}
          className="absolute top-6 left-6 w-10 h-10 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center relative z-10 mt-4">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 scale-110 shadow-[0_0_40px_rgba(245,158,11,0.2)] animate-pulse">
            <Check className="text-amber-500" size={40} strokeWidth={3} />
          </div>
          
          <h3 className="text-white font-black text-2xl tracking-tight">{t('dialog.title')}</h3>
          <p className="mt-3 text-zinc-400 text-sm leading-relaxed">{t('dialog.body')}</p>
          
          {tailorName && (
             <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 inline-flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                 <Scissors size={14} className="text-amber-400" />
               </div>
               <span className="text-zinc-200 text-sm font-bold">{tailorName}</span>
             </div>
          )}
        </div>

        <div className="mt-10 space-y-3 relative z-10">
          <button
            type="button"
            onClick={onTrackOrder}
            disabled={disableActions}
            className="w-full h-14 rounded-2xl bg-amber-500 text-zinc-950 font-black uppercase tracking-tight shadow-xl shadow-amber-500/10 hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <History size={20} strokeWidth={3} />
            {t('viewMyOrders')}
          </button>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onViewTailorProfile}
              disabled={disableActions}
              className="h-12 rounded-2xl bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-wider transition-all border border-white/5"
            >
              {t('dialog.viewTailorProfile')}
            </button>
            <button
              type="button"
              onClick={onGoHome}
              disabled={disableActions}
              className="h-12 rounded-2xl bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white/70 text-[10px] font-black uppercase tracking-wider transition-all border border-white/5"
            >
              {t('dialog.goHome')}
            </button>
          </div>

          <button
            type="button"
            onClick={onBrowseSameShop}
            disabled={disableActions}
            className="w-full h-11 rounded-2xl bg-transparent hover:bg-white/5 disabled:opacity-50 text-zinc-500 hover:text-zinc-300 text-[10px] font-black uppercase tracking-widest transition-all"
          >
            {t('dialog.browseSameShop')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
});

export const OrderSummary: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('orderSummary');
  const { t: tCommon } = useTranslation('common');
  const { user: currentUser } = useApp();
  
  const [order, setOrder] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [tailorUser, setTailorUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [view, setView] = useState<OrderSummaryView>('details');
  const [tailors, setTailors] = useState<any[]>([]);
  const [isTailorsLoading, setIsTailorsLoading] = useState(false);
  const [submitErrorKey, setSubmitErrorKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedDialogOpen, setIsSubmittedDialogOpen] = useState(false);
  
  const [fabricSource, setFabricSource] = useState<'shop' | 'store' | 'customer'>('customer');
  const [deliveryMethod, setDeliveryMethod] = useState<'self' | 'courier' | 'khuyoot_collection'>('self');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  const [measurementTemplate, setMeasurementTemplate] = useState<any>(null);

  useEffect(() => {
    if (product) {
      measurementService.getTemplateForProduct(product).then(setMeasurementTemplate);
    } else if (order) {
      measurementService.getTemplateForProduct({
        categoryId: order.categoryId || order.productCategory,
        categoryName: order.productCategory,
        name: order.productName
      }).then(setMeasurementTemplate);
    }
  }, [product, order]);

  const dateLocale = useMemo(() => {
    const lang = (i18n.resolvedLanguage || i18n.language || 'en').toLowerCase();
    if (lang.startsWith('ar')) return 'ar-SA';
    if (lang.startsWith('fr')) return 'fr-FR';
    return 'en-US';
  }, [i18n.language, i18n.resolvedLanguage]);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setIsLoading(true);
        setErrorKey(null);
        
        if (!orderId) {
          setErrorKey('missingOrderId');
          return;
        }

        const orderData = await firebaseService.getOrder(orderId);
        
        if (orderData) {
          setOrder(orderData);
          if (orderData.submissionStatus === 'submitted') {
            setView('submitted');
          }
          
          try {
            const pid = orderData.productId || orderData.product_id;
            if (pid) {
              const productData = await firebaseService.getProduct(pid);
              setProduct(productData);

              const tailorId = productData?.tailorId || orderData?.tailorId || null;
              if (tailorId) {
                const tailorData = await firebaseService.getUserById(String(tailorId));
                if (tailorData) {
                  setTailorUser({ ...tailorData, id: String(tailorId) });
                }
              }
            }
          } catch (e) {
            console.warn('Failed to load related data:', e);
          }
        } else {
          setErrorKey('orderNotFound');
        }
      } catch (err) {
        console.error('Error loading order:', err);
        setErrorKey('failedToLoadOrder');
        setErrorDetails(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  const orderCreatedAtText = useMemo(() => safeDateString(order?.createdAt, dateLocale), [order?.createdAt, dateLocale]);
  const productName = order?.productName || product?.name || '—';
  const categoryName = order?.categoryName || product?.category || '—';
  const productImage = order?.productImage || product?.image || null;
  const shopName = tailorUser?.name || tailorUser?.displayName || product?.tailorName || order?.tailorName || t('noTailorSelectedYet');
  const shopLocation = tailorUser?.location || tailorUser?.region || product?.location || order?.tailorLocation || '—';

  const productPrice = parsePrice(product?.price || product?.basePrice || order?.productPrice || 0);
  const servicePrice = parsePrice(order?.servicePrice || 0);
  const totalAmount = parsePrice(order?.totalPrice || (productPrice + servicePrice) || order?.price || 0);

  const regionCandidate = useMemo(() => {
    return [
      order?.region, 
      order?.location, 
      order?.customerRegion, 
      product?.region
    ].find(x => typeof x === 'string' && x.trim()) || null;
  }, [order, product]);

  useEffect(() => {
    const loadTailors = async () => {
      if (view !== 'chooseTailor') return;
      try {
        setIsTailorsLoading(true);
        let data: any[] = [];
        if (regionCandidate) {
          data = await firebaseService.getTailorsByRegion(regionCandidate, 24);
        }
        if (!data || data.length === 0) {
          data = await firebaseService.getApprovedTailors();
        }
        setTailors(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Error loading tailors:', e);
        setSubmitErrorKey('loadTailorsFailed');
      } finally {
        setIsTailorsLoading(false);
      }
    };
    loadTailors();
  }, [view, regionCandidate]);

  const submitOrder = async (selectedTailor?: any) => {
    if (!orderId) return;
    
    // Auth Guard: User must be signed in to submit
    if (!currentUser) {
      // Proactively trigger the login prompt instead of just failing
      import('../../auth/authEvents').then(({ requestLoginPrompt }) => {
        requestLoginPrompt('user_action');
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitErrorKey(null);

      const targetTailor = selectedTailor || tailorUser;
      const payload: any = {
        status: 'pending', // Ensure order shows as active
        submissionStatus: 'submitted',
        submittedAt: new Date().toISOString(),
        requestType: targetTailor ? 'specificTailor' : 'unassigned',
        canEdit: false, // Lock measurements after submission
        acceptedByTailor: false, // Reset acceptance status
      };

      if (targetTailor) {
        payload.requestedTailorId = targetTailor.id || targetTailor.uid || null;
        payload.requestedTailorName = targetTailor.name || targetTailor.displayName || null;
        payload.requestedTailorLocation = targetTailor.location || targetTailor.region || '';
      }

      // Final safety: Remove any undefined fields that would crash Firebase updateDoc
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) delete payload[key];
      });

      await firebaseService.updateOrder(orderId, payload);
      setOrder((prev: any) => ({ ...(prev || {}), ...payload }));
      // Audio 4: Don't change view to full screen, just show dialog
      setIsSubmittedDialogOpen(true);
    } catch (e: any) {
      console.error('Error submitting order:', e);
      setSubmitErrorKey('submitFailed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToTailorProfile = () => {
    const tailorId = order?.requestedTailorId || product?.tailorId || order?.tailorId || null;
    if (tailorId) navigate(`/tailor/${tailorId}`);
    else navigate('/');
  };

  const goToTailors = () => setView('chooseTailor');
  const browseSameShop = () => {
    const shopId = product?.tailorId || order?.tailorId || null;
    if (shopId) navigate(`/tailor/${shopId}`);
    else navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center p-4">
        <div className="relative">
          <div className="w-24 h-24 border-[3px] border-purple-600/20 rounded-full animate-pulse" />
          <div className="absolute inset-0 w-24 h-24 border-t-[3px] border-purple-500 rounded-full animate-spin" />
          <p className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white/50 text-xs font-bold whitespace-nowrap tracking-widest uppercase">
            {t('loadingOrderDetails')}
          </p>
        </div>
      </div>
    );
  }

  if (errorKey || !order) {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900/50 backdrop-blur-xl rounded-[2.5rem] border border-red-500/20 p-10 text-center shadow-2xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <Shield className="text-red-500" size={40} />
          </div>
          <h2 className="text-2xl font-black text-white mb-4 tracking-tight">{t('orderNotFoundTitle')}</h2>
          <p className="text-white/60 leading-relaxed mb-10">{t(`errors.${errorKey || 'failedToLoadOrder'}` as any)}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full h-14 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold border border-white/10 transition-all active:scale-95"
          >
            {tCommon('navHome')}
          </button>
        </div>
      </div>
    );
  }

  if (view === 'chooseTailor') {
    return (
      <div className="min-h-screen bg-[#070709] py-8 px-4" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-2xl mx-auto">
          <button onClick={() => setView('details')} className="mb-8 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-sm">{t('back')}</span>
          </button>
          
          <div className="mb-10">
            <h1 className="text-3xl font-black text-white tracking-tight">{t('chooseTailorTitle')}</h1>
            <p className="text-zinc-500 mt-2 font-medium">{t('chooseTailorSubtitle')}</p>
          </div>

          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
            <input 
              type="text" 
              placeholder={tCommon('searchPlaceholder') || 'Search...'} 
              className="w-full h-14 bg-zinc-900/50 border border-white/5 rounded-2xl pl-12 pr-6 text-white text-sm focus:ring-2 focus:ring-purple-500/30 transition-all outline-none"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black text-zinc-600 uppercase tracking-widest">
                {regionCandidate ? t('tailorsInRegion', { region: regionCandidate }) : t('allTailors')}
              </h3>
              <span className="text-[10px] font-bold text-zinc-700 bg-zinc-900 px-2 py-0.5 rounded-full">{tailors.length} found</span>
            </div>

            {isTailorsLoading ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4">
                 <div className="w-10 h-10 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
              </div>
            ) : tailors.length > 0 ? (
               tailors.map(tailor => (
                 <TailorCard key={tailor.id || tailor.uid} tailor={tailor} onSelect={submitOrder} disabled={isSubmitting} />
               ))
            ) : (
              <div className="text-center py-20 bg-zinc-900/20 rounded-3xl border border-dashed border-white/5">
                <Scissors size={48} className="mx-auto text-zinc-800 mb-4" />
                <p className="text-zinc-500 font-bold">{t('noTailorsFound')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-[#070709] py-8 px-4 pb-24" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-5xl mx-auto space-y-5">
        <SubmissionDialog
          open={isSubmittedDialogOpen}
          tailorName={order?.requestedTailorName || null}
          disableActions={isSubmitting}
          onClose={() => setIsSubmittedDialogOpen(false)}
          onTrackOrder={() => {
            setIsSubmittedDialogOpen(false);
            navigate('/account');
          }}
          onGoHome={() => {
            setIsSubmittedDialogOpen(false);
            navigate('/');
          }}
          onBrowseSameShop={() => {
            setIsSubmittedDialogOpen(false);
            browseSameShop();
          }}
          onViewTailorProfile={() => {
            setIsSubmittedDialogOpen(false);
            goToTailorProfile();
          }}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-white/10">
           <button onClick={() => navigate(-1)} className="flex items-center gap-3 text-zinc-400 hover:text-white transition-all group">
             <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/15 border border-white/10 group-hover:border-blue-500/50 transition-all shadow-lg">
                <ArrowRight size={18} className={`transition-transform text-white ${i18n.language === 'ar' ? 'rotate-180 group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'}`} />
             </div>
             <span className="text-[12px] font-black uppercase tracking-[0.15em]">{t('back')}</span>
           </button>
           
           <div className="flex items-center gap-5">
              <div className="text-end flex flex-col items-end">
                <h4 className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em] mb-0.5">{tCommon('order') || 'Order'}</h4>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.7)]" />
                  <span className="text-white text-[11px] font-mono select-all bg-zinc-800 px-3 py-1 rounded-lg border border-white/10 tabular-nums">#{orderId?.toUpperCase()}</span>
                </div>
              </div>
           </div>
        </div>

        <div className="flex items-center justify-between pt-3">
          <h1 className="text-3xl font-black text-white tracking-tighter">
            {t('title')}
          </h1>
          <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg">
             <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
               {order?.submissionStatus === 'submitted' ? 'Sent for Approval' : 'Awaiting Submission'}
             </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-2">
          <div className="lg:col-span-8 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  onClick={() => product?.id && navigate(`/product/${product.id}`)}
                  className="bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-white/5 p-4 flex items-center gap-4 group cursor-pointer hover:bg-zinc-800/60 transition-all"
                >
                  <div className="w-16 h-20 rounded-xl overflow-hidden bg-zinc-800 border border-white/5 flex-shrink-0 relative">
                    {productImage ? (
                      <img src={productImage} alt={productName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-20"><ShoppingBag size={24}/></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <ShoppingBag className="text-blue-400" size={12} />
                      <h2 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{t('productSection')}</h2>
                    </div>
                    <h3 className="text-white font-bold text-base truncate group-hover:text-blue-400 transition-colors">{productName}</h3>
                    <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-medium mt-1">
                      <span>{categoryName}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-700" />
                      <span className="text-zinc-600">{orderCreatedAtText}</span>
                    </div>
                  </div>
                </div>

                <div 
                  onClick={() => {
                    const shopId = product?.tailorId || order?.tailorId || null;
                    if (shopId) navigate(`/tailor/${shopId}`);
                  }}
                  className="bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-white/5 p-4 flex items-center gap-4 text-start cursor-pointer hover:bg-zinc-800/60 transition-all group"
                >
                  <div className="w-16 h-20 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col items-center justify-center flex-shrink-0 text-blue-400 overflow-hidden">
                     {tailorUser?.image || tailorUser?.profileImage ? (
                       <img src={tailorUser.image || tailorUser.profileImage} alt={shopName} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                     ) : (
                       <>
                         <Scissors size={24} />
                         <span className="text-[8px] font-black uppercase mt-1">Shop</span>
                       </>
                     )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <MapPin className="text-blue-400" size={12} />
                      <h2 className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{t('shopSection')}</h2>
                    </div>
                    <h3 className="text-white font-bold text-base truncate group-hover:text-blue-400 transition-colors">{shopName}</h3>
                    <div className="flex items-center gap-1.5 mt-1 text-zinc-500">
                      <span className="text-[10px] font-medium truncate max-w-[150px]">{shopLocation}</span>
                    </div>
                    <div className="mt-2">
                      {order?.requestedTailorName ? (
                         <div className="text-blue-400 text-[9px] font-black uppercase inline-flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            {order.requestedTailorName}
                         </div>
                      ) : (
                         <span className="text-zinc-500 text-[10px] font-bold italic opacity-60">{t('notSubmittedYet')}</span>
                      )}
                    </div>
                  </div>
                </div>
            </div>

            <div className="bg-zinc-800/40 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-xl text-start">
               <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.04]">
                 <div className="flex items-center gap-2.5">
                   <Ruler className="text-blue-500" size={16} />
                   <h2 className="text-sm font-black text-white uppercase tracking-tight">{t('measurementsSection')}</h2>
                 </div>
                 <button
                   onClick={() => navigate(`/measurements/${order.productId}`, { state: { order, product, measurements: order.measurements } })}
                   className="h-7 px-3 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[9px] font-black uppercase tracking-widest border border-white/5 transition-all flex items-center gap-1.5"
                 >
                   {t('editMeasurements')}
                   <ChevronRight size={10} className={`opacity-50 ${i18n.language === 'ar' ? 'rotate-180' : ''}`} />
                 </button>
               </div>
               
               <div className="p-4">
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {measurementTemplate?.points?.map((point: any, idx: number) => {
                      const measurementKey = point.measurementKey || point.label || point.name;
                      const measurementValue = order.measurements?.[measurementKey] || Object.values(order.measurements || {})[idx] || '—';
                      const pointName = point.label || point.name || formatMeasurementKey(measurementKey);
                      return (
                        <div key={point.id} className="bg-zinc-950/80 rounded-xl p-3 border border-white/5 group hover:border-blue-500/40 transition-all hover:bg-black/60 shadow-inner">
                          <p className="text-zinc-400 text-[9px] font-black uppercase mb-1.5 truncate tracking-widest">{pointName}</p>
                          <p className="text-white font-black text-lg font-mono flex items-baseline gap-1">
                            {measurementValue}<span className="text-[8px] text-zinc-500 font-sans uppercase">{t('unitCm')}</span>
                          </p>
                        </div>
                      );
                    }) || (order.measurements && Object.entries(order.measurements).map(([key, value]: [string, any]) => (
                      <div key={key} className="bg-zinc-950/80 rounded-xl p-3 border border-white/5 group hover:border-blue-500/40 transition-colors shadow-inner">
                        <p className="text-zinc-400 text-[9px] font-black uppercase mb-1.5 truncate tracking-widest">{formatMeasurementKey(key)}</p>
                        <p className="text-white font-black text-lg font-mono">
                          {value}<span className="text-[8px] text-zinc-500 font-sans ml-1 uppercase">{t('unitCm')}</span>
                        </p>
                      </div>
                    )))}
                 </div>
               </div>
            </div>

            <div className="bg-zinc-900/40 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden text-start">
               <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                 <div className="flex items-center gap-2.5">
                   <Layers className="text-blue-500" size={16} />
                   <h2 className="text-sm font-black text-white uppercase tracking-tight">{t('fabricSourceSection')}</h2>
                 </div>
               </div>
               
               <div className="p-5 space-y-6">
                  <div className="grid grid-cols-3 p-1 bg-white/5 rounded-xl border border-white/5">
                    {[
                      { id: 'shop', label: t('fabricFromShop'), disabled: true },
                      { id: 'store', label: t('fabricFromStore'), disabled: true },
                      { id: 'customer', label: t('fabricProvideMyOwn'), disabled: false },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        disabled={tab.disabled}
                        onClick={() => setFabricSource(tab.id as any)}
                        className={`h-9 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                          fabricSource === tab.id
                            ? 'bg-blue-600 text-white shadow-lg'
                            : tab.disabled 
                              ? 'text-zinc-600 cursor-not-allowed opacity-50' 
                              : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {fabricSource === 'customer' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-400">
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] px-1">{t('deliveryMethodLabel')}</h4>
                        <div className="grid grid-cols-3 gap-2.5">
                          {[
                            { id: 'self', label: t('deliverySelf'), icon: MapPin, disabled: false },
                            { id: 'courier', label: t('deliveryCourier'), icon: ShoppingBag, disabled: false },
                            { id: 'khuyoot_collection', label: t('deliveryKhuyoot'), icon: Shield, disabled: true },
                          ].map((opt) => (
                            <button
                              key={opt.id}
                              disabled={opt.disabled}
                              onClick={() => setDeliveryMethod(opt.id as any)}
                              className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all text-center group ${
                                deliveryMethod === opt.id
                                  ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.2)]'
                                  : opt.disabled
                                    ? 'bg-zinc-900/30 border-white/5 opacity-40 cursor-not-allowed'
                                    : 'bg-zinc-900/50 border-white/5 hover:border-white/15 hover:bg-zinc-800'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                deliveryMethod === opt.id ? 'bg-blue-600 text-white' : 'bg-white/10 text-zinc-400 group-hover:text-white'
                              }`}>
                                <opt.icon size={16} />
                              </div>
                              <span className={`text-[10px] font-black uppercase leading-tight tracking-tight ${
                                deliveryMethod === opt.id ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'
                              }`}>
                                {opt.label}
                                {opt.disabled && <span className="block text-[7px] text-zinc-600 mt-0.5 tracking-normal lowercase">{t('comingSoon')}</span>}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-zinc-500 text-[9px] font-bold italic flex items-center gap-2 px-1">
                     <Shield size={10} className="text-blue-400" />
                     {t('fabricOnlyCustomerAvailableNote')}
                  </p>
               </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4 text-start">
            <div className="sticky top-6 space-y-4">
               {submitErrorKey && (
                 <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-500 text-[10px] font-bold animate-shake">
                   {t(`errors.${submitErrorKey}` as any)}
                 </div>
               )}

               <div className="bg-zinc-900/60 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-2xl space-y-4">
                 <div>
                   <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-3 px-1">Payment Summary</h3>
                   <div className="bg-zinc-950/50 rounded-xl p-4 border border-white/5 space-y-2.5" dir="ltr">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                         <span>Product Price</span>
                         <span className="text-white font-mono">{productPrice.toFixed(3)} OMR</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-500 tracking-wider">
                         <span>Tailoring Fee</span>
                         <span className="text-white font-mono">{servicePrice.toFixed(3)} OMR</span>
                      </div>
                      <div className="h-px bg-white/5 my-1" />
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Total Amount</span>
                         <span className="text-xl font-black text-white font-mono">{totalAmount.toFixed(3)} OMR</span>
                      </div>
                   </div>
                 </div>

                 <div className="space-y-2">
                   <button
                     type="button"
                     onClick={() => !currentUser ? import('../../auth/authEvents').then(m => m.requestLoginPrompt('user_action')) : (order?.submissionStatus === 'submitted' ? navigate('/account') : submitOrder())}
                     disabled={isSubmitting}
                     className={`w-full h-12 rounded-xl font-black text-sm shadow-xl active:scale-95 transition-all flex flex-col items-center justify-center leading-none ${
                       order?.submissionStatus === 'submitted'
                         ? 'bg-amber-500 text-zinc-950 shadow-amber-500/10 hover:bg-amber-400'
                         : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 animate-shine'
                     }`}
                   >
                     {isSubmitting ? (
                       <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                     ) : !currentUser ? (
                       <span className="flex items-center gap-2">
                         <Star size={14} className="text-amber-400" />
                         Sign in to Submit
                       </span>
                     ) : order?.submissionStatus === 'submitted' ? (
                       <span className="flex items-center gap-2">
                         <History size={14} strokeWidth={3} />
                         {t('viewMyOrders')}
                       </span>
                     ) : (
                       <span>{t('submitThisOrder')}</span>
                     )}
                   </button>

                   {order?.submissionStatus !== 'submitted' && (
                    <div className="grid grid-cols-2 gap-2">
                     <button
                       type="button"
                       onClick={goToTailors}
                       disabled={isSubmitting}
                       className="w-full h-11 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-white/5 text-[10px] uppercase tracking-wider"
                     >
                       <Search size={14} />
                       {t('findAnotherTailor')}
                     </button>

                      <button
                        type="button"
                        onClick={browseSameShop}
                        disabled={isSubmitting}
                        className="w-full h-11 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white/50 rounded-xl font-bold flex items-center justify-center transition-all text-[10px] uppercase tracking-wider"
                      >
                        {t('browseSameShop')}
                      </button>
                    </div>
                    )}
                 </div>
               </div>

               <div className="bg-blue-500/5 rounded-2xl border border-blue-500/10 p-5 space-y-3 text-start">
                 <div>
                    <h4 className="text-blue-400 font-black text-[9px] uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
                      <Shield size={12} />
                      {tCommon('securePayment') || 'Payment & Terms'}
                    </h4>
                    <p className="text-zinc-400 text-[10px] font-medium leading-[1.6]">
                      {t('paymentSecureNote')}
                    </p>
                 </div>
                 
                 <div className="pt-2 border-t border-white/5">
                    <button className="flex items-center gap-2 text-zinc-500 hover:text-blue-400 transition-colors">
                       <FileText size={12} />
                       <span className="text-[9px] font-black uppercase tracking-widest">{t('termsAndConditions')}</span>
                    </button>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
