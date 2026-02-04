import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, CreditCard, Package, Receipt, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { firebaseService } from '../../services/firebase';

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

export const TransactionHistory: React.FC = () => {
  const navigate = useNavigate();
  const { user, toggleAuthModal } = useApp();
  const [purchases, setPurchases] = React.useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string>('');

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
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'failed':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'refunded':
        return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      default:
        return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
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
      <div className="min-h-screen max-h-screen overflow-y-auto bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back Button */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">سجل المعاملات</h1>
              <p className="text-sm text-zinc-400">جميع عمليات شراء الرصيد</p>
            </div>
          </div>

          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
            <h2 className="text-xl font-bold text-zinc-300 mb-2">يجب تسجيل الدخول</h2>
            <p className="text-zinc-500 mb-6">الرجاء تسجيل الدخول لعرض سجل المعاملات</p>
            <button
              onClick={() => toggleAuthModal(true, 'login')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors"
            >
              <CreditCard className="w-5 h-5" />
              <span>تسجيل الدخول</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-h-screen overflow-y-auto bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-white">
      <div className="max-w-4xl mx-auto px-3 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-zinc-800/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">سجل المعاملات</h1>
            <p className="text-xs text-zinc-400">جميع عمليات شراء الرصيد</p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && error === 'INDEX_BUILDING' && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-3 text-blue-400 animate-spin" />
            <h3 className="text-base font-bold text-blue-300 mb-1.5">جارٍ إعداد النظام</h3>
            <p className="text-sm text-blue-400 mb-3">قاعدة البيانات تقوم بإعداد الفهارس... قد يستغرق هذا 5-10 دقائق</p>
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
              className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        )}
        {error && error !== 'INDEX_BUILDING' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && purchases.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
            <h2 className="text-base font-bold text-zinc-300 mb-1">لا توجد معاملات</h2>
            <p className="text-sm text-zinc-500">لم تقم بأي عمليات شراء بعد</p>
          </div>
        )}

        {/* Purchases List */}
        {!loading && !error && purchases.length > 0 && (
          <div className="space-y-2">
            {purchases.map((purchase, index) => (
              <div
                key={purchase.id}
                className={`border rounded-lg p-3 hover:border-zinc-700 transition-colors ${
                  index % 2 === 0 
                    ? 'bg-zinc-900/50 border-zinc-800' 
                    : 'bg-zinc-800/30 border-zinc-700/50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/10">
                      <Package className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white mb-0.5">{purchase.package_name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(purchase.purchase_date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(purchase.status)}`}>
                    {getStatusText(purchase.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <p className="text-xs text-zinc-500 mb-0.5">المبلغ المدفوع</p>
                    <p className="text-base font-bold text-white">
                      {purchase.amount_paid} <span className="text-xs text-zinc-400">{purchase.currency}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-0.5">الرصيد المضاف</p>
                    <p className="text-base font-bold text-green-400">
                      +{purchase.credits_purchased} <span className="text-xs text-zinc-400">نقطة</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <CreditCard className="w-3 h-3" />
                    <span>{purchase.payment_method === 'cash' ? 'نقداً' : purchase.payment_method}</span>
                  </div>
                  <div className="text-xs text-zinc-500">
                    الرصيد: {purchase.balance_before} → <span className="text-green-400 font-medium">{purchase.balance_after}</span>
                  </div>
                </div>

                {purchase.is_subscription && (
                  <div className="mt-2 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-400">
                    📅 اشتراك شهري
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

