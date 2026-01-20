import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { firebaseService } from '../../services/firebase';

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

const TailorCard = React.memo(function TailorCard({
  tailor,
  onSelect,
  disabled,
}: {
  tailor: any;
  onSelect: (tailor: any) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation('translation', { keyPrefix: 'orderSummary' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common' });
  const imageSrc = tailor?.image || tailor?.profileImage || null;
  return (
    <div className="bg-zinc-900 rounded-2xl border border-white/10 p-4 flex items-center gap-4">
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0">
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={tailor?.name || tCommon('roleTailor')}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full bg-zinc-800" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-white font-semibold truncate">{tailor?.name || tCommon('roleTailor')}</h4>
          <span className="text-xs text-white/50">⭐ {typeof tailor?.rating === 'number' ? tailor.rating.toFixed(1) : '—'}</span>
        </div>
        <p className="text-xs text-white/60 truncate">{tailor?.location || tailor?.region || '—'}</p>
      </div>
      <button
        onClick={() => onSelect(tailor)}
        disabled={disabled}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors"
      >
        {t('send')}
      </button>
    </div>
  );
});

const SubmissionDialog = React.memo(function SubmissionDialog({
  open,
  tailorName,
  onFindAnotherTailor,
  onGoHome,
  onBrowseSameShop,
  onClose,
  disableActions,
}: {
  open: boolean;
  tailorName?: string | null;
  onFindAnotherTailor: () => void;
  onGoHome: () => void;
  onBrowseSameShop: () => void;
  onClose: () => void;
  disableActions?: boolean;
}) {
  const { t } = useTranslation('translation', { keyPrefix: 'orderSummary.dialog' });
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      data-overlay="khuyoot-modal"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label={t('closeAriaLabel')}
          className="absolute top-3 right-3 w-9 h-9 rounded-full border border-white/10 text-white/80 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 border-b border-white/10 text-center">
          <img
            src="/logo_big.png"
            alt="Khuyoot"
            className="mx-auto h-14 w-auto"
            loading="eager"
            decoding="async"
          />
          <h3 className="mt-4 text-white font-bold text-lg">{t('title')}</h3>
          <p className="mt-2 text-white/70 text-sm">{t('body')}</p>
          {tailorName ? <p className="mt-3 text-emerald-300 text-sm">{t('selectedTailor', { name: tailorName })}</p> : null}
        </div>

        <div className="p-5 space-y-3">
          <button
            type="button"
            onClick={onBrowseSameShop}
            disabled={disableActions}
            className="w-full px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/40 disabled:cursor-not-allowed text-white font-semibold transition-colors"
          >
            {t('browseSameShop')}
          </button>
          <button
            type="button"
            onClick={onFindAnotherTailor}
            disabled={disableActions}
            className="w-full px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800/50 disabled:cursor-not-allowed text-white font-semibold transition-colors border border-white/10"
          >
            {t('findAnotherTailor')}
          </button>
          <button
            type="button"
            onClick={onGoHome}
            disabled={disableActions}
            className="w-full px-4 py-3 rounded-xl bg-transparent hover:bg-white/5 disabled:bg-transparent disabled:cursor-not-allowed text-white/80 font-semibold transition-colors border border-white/10"
          >
            {t('goHome')}
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
  const { t, i18n } = useTranslation('translation', { keyPrefix: 'orderSummary' });
  const { t: tCommon } = useTranslation('translation', { keyPrefix: 'common' });
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
        setErrorDetails(null);
        
        if (!orderId) {
          setErrorKey('missingOrderId');
          setIsLoading(false);
          return;
        }

        const orderData = await firebaseService.getOrder(orderId);
        
        if (orderData) {
          setOrder(orderData);
          // Load product details (for shop/tailor info + image fallback)
          try {
            if (orderData.productId) {
              const productData = await firebaseService.getProduct(orderData.productId);
              setProduct(productData);

              // Canonical shop/tailor info should come from users/{tailorId}.
              try {
                const tailorId = productData?.tailorId || orderData?.tailorId || null;
                if (tailorId) {
                  const tailorData = await firebaseService.getUserById(String(tailorId));
                  setTailorUser(tailorData);
                } else {
                  setTailorUser(null);
                }
              } catch (e) {
                console.warn('Failed to load tailor user for order summary:', e);
                setTailorUser(null);
              }
            } else {
              setProduct(null);
              setTailorUser(null);
            }
          } catch (e) {
            console.warn('Failed to load product for order summary:', e);
            setProduct(null);
            setTailorUser(null);
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
  const shopName =
    tailorUser?.name ||
    tailorUser?.displayName ||
    product?.tailorName ||
    order?.tailorName ||
    t('noTailorSelectedYet');
  const shopLocation =
    tailorUser?.location ||
    tailorUser?.region ||
    product?.location ||
    order?.tailorLocation ||
    product?.region ||
    '—';

  const regionCandidate = useMemo(() => {
    const candidates = [
      order?.region,
      order?.location,
      order?.customerRegion,
      product?.region,
      product?.location,
      product?.tailorRegion,
    ]
      .map((x: any) => (typeof x === 'string' ? x.trim() : ''))
      .filter(Boolean);
    return candidates[0] || '';
  }, [order?.region, order?.location, order?.customerRegion, product?.region, product?.location, product?.tailorRegion]);

  useEffect(() => {
    const loadTailors = async () => {
      if (view !== 'chooseTailor') return;
      try {
        setIsTailorsLoading(true);
        setSubmitErrorKey(null);

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
        setTailors([]);
        setSubmitErrorKey('loadTailorsFailed');
      } finally {
        setIsTailorsLoading(false);
      }
    };

    loadTailors();
  }, [view, regionCandidate]);

  const submitOrder = async (selectedTailor?: any) => {
    if (!orderId) return;
    try {
      setIsSubmitting(true);
      setSubmitErrorKey(null);

      const payload: any = {
        submissionStatus: 'submitted',
        submittedAt: new Date().toISOString(),
        requestType: selectedTailor ? 'specificTailor' : 'unassigned',
      };

      if (selectedTailor) {
        payload.requestedTailorId = selectedTailor.id;
        payload.requestedTailorName = selectedTailor.name;
        payload.requestedTailorLocation = selectedTailor.location || selectedTailor.region || '';
      }

      await firebaseService.updateOrder(orderId, payload);
      setOrder((prev: any) => ({ ...(prev || {}), ...payload }));
      setView('submitted');
      setIsSubmittedDialogOpen(true);
    } catch (e: any) {
      console.error('Error submitting order:', e);
      setSubmitErrorKey('submitFailed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white/70">{t('loadingOrderDetails')}</p>
        </div>
      </div>
    );
  }

  if (errorKey || !order) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 rounded-2xl border border-red-500/30 p-8 text-center space-y-4">
          <div className="text-red-500 text-5xl">⚠️</div>
          <h2 className="text-xl font-bold text-white">{t('orderNotFoundTitle')}</h2>
          <p className="text-white/60">{t(`errors.${errorKey || 'failedToLoadOrder'}` as any)}</p>
          {errorDetails ? <p className="text-white/40 text-xs break-words">{errorDetails}</p> : null}
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
          >
            {tCommon('navHome')}
          </button>
        </div>
      </div>
    );
  }

  const browseSameShop = () => {
    const shopId =
      product?.tailorId ||
      (product as any)?.ownerId ||
      (product as any)?.shopId ||
      (product as any)?.merchantId ||
      order?.tailorId ||
      (order as any)?.shopId ||
      (order as any)?.merchantId ||
      (order as any)?.ownerId ||
      null;
    if (shopId) {
      navigate(`/shop/${shopId}`);
      return;
    }
    navigate('/');
  };

  const goToTailors = () => {
    navigate('/tailors');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-6 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <SubmissionDialog
          open={isSubmittedDialogOpen}
          tailorName={order?.requestedTailorName || null}
          disableActions={isSubmitting}
          onClose={() => setIsSubmittedDialogOpen(false)}
          onFindAnotherTailor={() => {
            setIsSubmittedDialogOpen(false);
            goToTailors();
          }}
          onGoHome={() => {
            setIsSubmittedDialogOpen(false);
            navigate('/');
          }}
          onBrowseSameShop={() => {
            setIsSubmittedDialogOpen(false);
            browseSameShop();
          }}
        />
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors group"
        >
          <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sm font-semibold">{t('back')}</span>
        </button>

        {/* Order Overview */}
        <div className="bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden">
          <div className="bg-zinc-950 px-5 py-3 border-b border-white/10 flex items-center justify-between gap-3">
            <h1 className="text-xl font-bold text-white">{t('title')}</h1>
            <span className="text-xs text-white/50 font-mono">{orderId}</span>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product */}
            <div className="space-y-4">
              <h2 className="text-white font-semibold">{t('productSection')}</h2>
              <div className="flex gap-4">
                <div className="w-24 h-32 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0">
                  {productImage ? (
                    <img src={productImage} alt={productName} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  ) : (
                    <div className="w-full h-full bg-zinc-800" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <h3 className="text-white font-semibold truncate">{productName}</h3>
                  <p className="text-white/60 text-sm truncate">{categoryName}</p>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <span>{t('orderDateLabel')}:</span>
                    <span className="text-white/80">{orderCreatedAtText}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shop / Tailor */}
            <div className="space-y-4">
              <h2 className="text-white font-semibold">{t('shopSection')}</h2>
              <div className="bg-zinc-800/60 border border-white/10 rounded-2xl p-4">
                <p className="text-white font-semibold">{shopName}</p>
                <p className="text-white/60 text-sm">{shopLocation}</p>
                {order?.requestedTailorName ? (
                  <p className="mt-2 text-purple-300 text-sm">
                    {t('chosenTailorLabel')}: {order.requestedTailorName}
                  </p>
                ) : (
                  <p className="mt-2 text-white/50 text-sm">{t('notSubmittedYet')}</p>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Measurements */}
        <div className="bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden">
          <div className="bg-zinc-950 px-5 py-3 border-b border-white/10 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-white">{t('measurementsSection')}</h2>
            <button
              onClick={() => navigate(`/measurements/${order.productId}`)}
              className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-xl text-sm font-semibold transition-colors border border-purple-500/30"
            >
              {t('editMeasurements')}
            </button>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {order.measurements && Object.entries(order.measurements).map(([key, value]: [string, any]) => (
                <div key={key} className="bg-zinc-800 rounded-xl p-3 border border-white/5">
                  <p className="text-white/50 text-xs mb-1 truncate">{formatMeasurementKey(key)}</p>
                  <p className="text-white font-semibold">
                    {value} {t('unitCm')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fabric Source */}
        <div className="bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden">
          <div className="bg-zinc-950 px-5 py-3 border-b border-white/10">
            <h2 className="text-lg font-bold text-white">{t('fabricSourceSection')}</h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                className="p-4 rounded-2xl border transition-all text-left bg-purple-600/20 border-purple-500/50 ring-2 ring-purple-500/30"
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center border-purple-500 bg-purple-500">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t('fabricCustomerProvidesTitle')}</p>
                    <p className="text-white/50 text-xs">{t('fabricCustomerProvidesSubtitle')}</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                disabled
                className="p-4 rounded-2xl border text-left bg-zinc-800 border-white/10 opacity-50 cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-white/30" />
                  <div>
                    <p className="text-white font-semibold text-sm">{t('fabricFromShop')}</p>
                    <p className="text-white/50 text-xs">{t('comingSoon')}</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                disabled
                className="p-4 rounded-2xl border text-left bg-zinc-800 border-white/10 opacity-50 cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-white/30" />
                  <div>
                    <p className="text-white font-semibold text-sm">{t('fabricFromStore')}</p>
                    <p className="text-white/50 text-xs">{t('comingSoon')}</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                disabled
                className="p-4 rounded-2xl border text-left bg-zinc-800 border-white/10 opacity-50 cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-white/30" />
                  <div>
                    <p className="text-white font-semibold text-sm">{t('fabricSavedSet')}</p>
                    <p className="text-white/50 text-xs">{t('comingSoon')}</p>
                  </div>
                </div>
              </button>
            </div>
            <p className="text-white/50 text-sm">{t('fabricOnlyCustomerAvailableNote')}</p>
          </div>
        </div>

        {/* Submission Actions */}
        {submitErrorKey ? (
          <div className="bg-red-600/10 border border-red-500/30 rounded-2xl p-4 text-white/80">
            {t(`errors.${submitErrorKey}` as any)}
          </div>
        ) : null}

        <div className="bg-zinc-900 rounded-2xl border border-white/10 p-5 space-y-3">
          <button
            type="button"
            onClick={() => submitOrder()}
            disabled={isSubmitting || view === 'submitted'}
            className="w-full px-5 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/40 disabled:cursor-not-allowed text-white rounded-2xl font-semibold transition-colors"
          >
            {isSubmitting ? t('submitting') : t('submitThisOrder')}
          </button>
          <button
            type="button"
            onClick={goToTailors}
            disabled={isSubmitting}
            className="w-full px-5 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800/50 disabled:cursor-not-allowed text-white rounded-2xl font-semibold transition-colors border border-white/10"
          >
            {t('findAnotherTailor')}
          </button>
          <button
            type="button"
            onClick={browseSameShop}
            disabled={isSubmitting}
            className="w-full px-5 py-3 bg-transparent hover:bg-white/5 disabled:bg-transparent disabled:cursor-not-allowed text-white/80 rounded-2xl font-semibold transition-colors border border-white/10"
          >
            {t('browseSameShop')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
