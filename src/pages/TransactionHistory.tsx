import React, { useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, CreditCard, Package, Receipt, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { firebaseService } from '../../services/firebase';
import { MontHeader } from '../components/MontHeader';

interface PurchaseRecord {
  id: string;
  purchase_id: string;
  transaction_id: string;
  user_id: string;
  package_type: string;
  package_name: string;
  amount_paid: number;
  currency: string;
  credits_purchased: number;
  balance_before: number;
  balance_after: number;
  status: string;
  payment_method: string;
  payment_reference?: string;
  purchase_date: string;
  createdAt: any;
  is_subscription: boolean;
}

const MONT_HEADER_ID = 'khuyoot-mont-header';
const DEFAULT_HEADER_SPACER_HEIGHT = 72;

export const TransactionHistory: React.FC = () => {
  const navigate = useNavigate();
  const { user, toggleAuthModal } = useApp();
  const [purchases, setPurchases] = React.useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>('');
  const [headerHeight, setHeaderHeight] = React.useState(DEFAULT_HEADER_SPACER_HEIGHT);

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
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, []);

  React.useEffect(() => {
    if (!user?.id && !user?.uid) {
      setLoading(false);
      return;
    }

    const toIso = (value: any) => {
      try {
        if (!value) return new Date().toISOString();
        if (typeof value === 'string') return value;
        if (typeof value?.toDate === 'function') return value.toDate().toISOString();
        if (typeof value?.seconds === 'number') return new Date(value.seconds * 1000).toISOString();
        return new Date().toISOString();
      } catch {
        return new Date().toISOString();
      }
    };

    const loadHistory = async () => {
      try {
        setLoading(true);
        setError('');

        console.log('🔍 Loading purchase history for user:', user.id);

        const history = await firebaseService.getPurchaseHistory({
          userId: user.id || user.uid,
          limit: 100,
        });

        console.log('📦 Purchase history results:', history?.length || 0, 'records');

        if (history && history.length > 0) {
          console.log('✅ Found purchase_history records:', history);
          setPurchases(history as PurchaseRecord[]);
          return;
        }

        // Fallback: legacy purchases stored only in credit_transactions
        console.log('🔄 Fallback: checking credit_transactions...');
        const txs = await firebaseService.getCreditTransactions({
          userId: user.id || user.uid,
          limit: 100,
        });

        console.log('📝 Credit transactions results:', txs?.length || 0, 'records');

        const mapped = (txs || [])
          .filter((tx: any) => tx?.action_type === 'purchase')
          .map((tx: any) => ({
            id: tx.id || tx.transaction_id,
            purchase_id: tx.meta?.purchase_id || tx.transaction_id || tx.id,
            transaction_id: tx.transaction_id || tx.id,
            user_id: tx.user_id,
            package_type: tx.meta?.purchase_type || 'legacy',
            package_name: tx.meta?.package_name || 'عملية شراء',
            amount_paid: typeof tx.meta?.amount_paid === 'number' ? tx.meta.amount_paid : 0,
            currency: 'OMR',
            credits_purchased: typeof tx.amount === 'number' ? Math.max(0, tx.amount) : 0,
            balance_before: 0,
            balance_after: 0,
            status: tx.status || 'completed',
            payment_method: tx.meta?.payment_method || 'other',
            payment_reference: tx.meta?.payment_reference,
            purchase_date: tx.meta?.timestamp ? new Date(tx.meta.timestamp).toISOString() : toIso(tx.createdAt),
            createdAt: tx.createdAt,
            is_subscription: Boolean(tx.meta?.is_subscription),
          })) as PurchaseRecord[];

        setPurchases(mapped);
      } catch (err: any) {
        const errorMsg = err?.message || 'Failed to load transaction history';
        console.error('❌ Transaction history error:', errorMsg);
        
        // Check if it's an index building error
        if (errorMsg.includes('index is currently building')) {
          setError('INDEX_BUILDING');
        } else {
          setError(errorMsg);
        }
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [user?.id, user?.uid]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('ar-OM', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'pending':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'failed':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'refunded':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'مكتمل';
      case 'pending':
        return 'قيد الانتظار';
      case 'failed':
        return 'فشل';
      case 'refunded':
        return 'مسترجع';
      default:
        return status;
    }
  };

  if (!user) {
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
          <div className="px-4 md:px-8 py-3">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg p-8 shadow-sm border border-slate-100 text-center">
                <CreditCard className="w-16 h-16 mx-auto mb-4 text-[#63498b]/20" />
                <h2 className="text-xl font-bold text-slate-900 mb-2">يجب تسجيل الدخول</h2>
                <p className="text-slate-600 mb-6">الرجاء تسجيل الدخول لعرض سجل المعاملات</p>
                <button
                  onClick={() => toggleAuthModal(true, 'login')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#63498b] hover:bg-[#523d74] text-white font-medium rounded-lg transition-all"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>تسجيل الدخول</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="px-4 md:px-8 py-3">
          <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6" dir="rtl">
            <button
              onClick={() => navigate(-1)}
              aria-label="الرجوع"
              title="الرجوع"
              className="p-2 rounded-lg bg-white hover:bg-slate-50 transition-colors shadow-sm border border-slate-100"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">سجل المعاملات</h1>
              <p className="text-sm text-slate-600">جميع عمليات شراء الرصيد</p>
            </div>
          </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg p-12 shadow-sm border border-slate-100 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#63498b] animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && error === 'INDEX_BUILDING' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-3 text-blue-600 animate-spin" />
            <h3 className="text-base font-bold text-blue-900 mb-2">جارٍ إعداد النظام</h3>
            <p className="text-sm text-blue-700 mb-4">قاعدة البيانات تقوم بإعداد الفهارس... قد يستغرق هذا 5-10 دقائق</p>
            <button
              onClick={() => {
                setError('');
                setLoading(true);
                setTimeout(() => {
                  if (user?.id) {
                    const loadHistory = async () => {
                      try {
                        const history = await firebaseService.getPurchaseHistory({ userId: user.id || user.uid, limit: 100 });
                        if (history && history.length > 0) {
                          setPurchases(history as PurchaseRecord[]);
                        }
                      } catch (err: any) {
                        if (err?.message?.includes('index is currently building')) {
                          setError('INDEX_BUILDING');
                        } else {
                          setError(err?.message || 'Failed to load');
                        }
                      } finally {
                        setLoading(false);
                      }
                    };
                    loadHistory();
                  }
                }, 500);
              }}
              className="px-6 py-2 text-sm bg-[#63498b] hover:bg-[#523d74] text-white font-medium rounded-lg transition-all"
            >
              إعادة المحاولة
            </button>
          </div>
        )}
        {error && error !== 'INDEX_BUILDING' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && purchases.length === 0 && (
          <div className="bg-white rounded-lg p-12 shadow-sm border border-slate-100 text-center">
            <Receipt className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h2 className="text-lg font-bold text-slate-900 mb-2">لا توجد معاملات</h2>
            <p className="text-sm text-slate-600">لم تقم بأي عمليات شراء بعد</p>
          </div>
        )}

        {/* Purchases List */}
        {!loading && !error && purchases.length > 0 && (
          <div className="space-y-3">
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="bg-white border border-slate-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[#63498b]/10">
                      <Package className="w-5 h-5 text-[#63498b]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1">{purchase.package_name}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(purchase.purchase_date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(purchase.status)}`}>
                    {getStatusText(purchase.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">المبلغ المدفوع</p>
                    <p className="text-lg font-bold text-slate-900">
                      {purchase.amount_paid} <span className="text-sm text-slate-500">{purchase.currency}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">الرصيد المضاف</p>
                    <p className="text-lg font-bold text-green-600">
                      +{purchase.credits_purchased} <span className="text-sm text-slate-500">نقطة</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{purchase.payment_method === 'cash' ? 'نقداً' : purchase.payment_method}</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    الرصيد: {purchase.balance_before} → <span className="text-green-600 font-medium">{purchase.balance_after}</span>
                  </div>
                </div>

                {purchase.is_subscription && (
                  <div className="mt-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 font-medium">
                    📅 اشتراك شهري
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </div>
        </div>
      </div>
    </div>
  );
};

