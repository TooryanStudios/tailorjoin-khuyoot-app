import React, { useState, useEffect } from 'react';
import { TrendingUp, FileText, Wallet, ArrowDownToLine, Download } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import {
  getTransactions,
  getAllBalances,
  getWithdrawalRequests,
  processWithdrawalRequest,
  completeWithdrawal,
  getFinancialDashboardStats,
  adjustBalance
} from '../../../services/financialService';
import { Transaction, Balance, WithdrawalRequest } from './types';

// Components
import { DashboardTab } from './components/DashboardTab';
import { TransactionsTab } from './components/TransactionsTab';
import { BalancesTab } from './components/BalancesTab';
import { WithdrawalsTab } from './components/WithdrawalsTab';

// Modals
import { TransactionDetailsModal } from './modals/TransactionDetailsModal';
import { WithdrawalDetailsModal } from './modals/WithdrawalDetailsModal';
import { AdjustBalanceModal } from './modals/AdjustBalanceModal';

type FinancialTab = 'dashboard' | 'transactions' | 'balances' | 'withdrawals' | 'reports';

export const FinancialManagement: React.FC = () => {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState<FinancialTab>('dashboard');
  const [loading, setLoading] = useState(true);
  
  // البيانات
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  
  // الفلاتر
  const [transactionFilter, setTransactionFilter] = useState({
    type: '',
    status: '',
    search: ''
  });
  const [withdrawalFilter, setWithdrawalFilter] = useState({
    status: '',
    search: ''
  });
  
  // Modals
  const [showTransactionDetails, setShowTransactionDetails] = useState<Transaction | null>(null);
  const [showWithdrawalDetails, setShowWithdrawalDetails] = useState<WithdrawalRequest | null>(null);
  const [showAdjustBalance, setShowAdjustBalance] = useState<Balance | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stats, txns, bals, wds] = await Promise.all([
        getFinancialDashboardStats(),
        getTransactions({ limit: 100 }),
        getAllBalances(),
        getWithdrawalRequests()
      ]);
      
      setDashboardStats(stats);
      setTransactions(txns);
      setBalances(bals);
      setWithdrawals(wds);
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessWithdrawal = async (
    requestId: string,
    approved: boolean,
    notes?: string
  ) => {
    try {
      await processWithdrawalRequest(requestId, approved, user?.id || '', notes);
      await loadData();
      setShowWithdrawalDetails(null);
      alert(approved ? 'تمت الموافقة على الطلب' : 'تم رفض الطلب');
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      alert('حدث خطأ في معالجة الطلب');
    }
  };

  const handleCompleteWithdrawal = async (requestId: string) => {
    try {
      await completeWithdrawal(requestId, user?.id || '');
      await loadData();
      setShowWithdrawalDetails(null);
      alert('تم تأكيد اكتمال السحب');
    } catch (error) {
      console.error('Error completing withdrawal:', error);
      alert('حدث خطأ في تأكيد السحب');
    }
  };

  const handleAdjustBalance = async (amount: number, reason: string) => {
    if (!showAdjustBalance) return;

    try {
      await adjustBalance(
        showAdjustBalance.userId,
        amount,
        reason,
        user?.id || ''
      );
      await loadData();
      setShowAdjustBalance(null);
      alert('تم تعديل الرصيد بنجاح');
    } catch (error) {
      console.error('Error adjusting balance:', error);
      alert('حدث خطأ في تعديل الرصيد');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">الإدارة المالية</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            إدارة المعاملات والأرصدة والتدفقات النقدية
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-2">
        <div className="flex gap-2 overflow-x-auto">
          {[
            { id: 'dashboard' as const, label: 'لوحة المعلومات', icon: TrendingUp },
            { id: 'transactions' as const, label: 'المعاملات', icon: FileText },
            { id: 'balances' as const, label: 'الأرصدة', icon: Wallet },
            { id: 'withdrawals' as const, label: 'طلبات السحب', icon: ArrowDownToLine },
            { id: 'reports' as const, label: 'التقارير', icon: Download }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && dashboardStats && (
        <DashboardTab
          dashboardStats={dashboardStats}
          transactions={transactions}
          withdrawals={withdrawals}
          onViewWithdrawal={setShowWithdrawalDetails}
        />
      )}

      {activeTab === 'transactions' && (
        <TransactionsTab
          transactions={transactions}
          filter={transactionFilter}
          onFilterChange={setTransactionFilter}
          onViewTransaction={setShowTransactionDetails}
        />
      )}

      {activeTab === 'balances' && (
        <BalancesTab
          balances={balances}
          onAdjustBalance={setShowAdjustBalance}
        />
      )}

      {activeTab === 'withdrawals' && (
        <WithdrawalsTab
          withdrawals={withdrawals}
          filter={withdrawalFilter}
          onFilterChange={setWithdrawalFilter}
          onViewWithdrawal={setShowWithdrawalDetails}
        />
      )}

      {activeTab === 'reports' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <Download size={48} className="mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
            التقارير المالية
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            قريباً: إنشاء تقارير مخصصة مع رسوم بيانية وتحليلات متقدمة
          </p>
        </div>
      )}

      {/* Modals */}
      {showTransactionDetails && (
        <TransactionDetailsModal
          transaction={showTransactionDetails}
          onClose={() => setShowTransactionDetails(null)}
        />
      )}

      {showWithdrawalDetails && (
        <WithdrawalDetailsModal
          withdrawal={showWithdrawalDetails}
          onClose={() => setShowWithdrawalDetails(null)}
          onApprove={(notes) => handleProcessWithdrawal(showWithdrawalDetails.id, true, notes)}
          onReject={(notes) => handleProcessWithdrawal(showWithdrawalDetails.id, false, notes)}
          onComplete={() => handleCompleteWithdrawal(showWithdrawalDetails.id)}
        />
      )}

      {showAdjustBalance && (
        <AdjustBalanceModal
          balance={showAdjustBalance}
          onClose={() => setShowAdjustBalance(null)}
          onAdjust={handleAdjustBalance}
        />
      )}
    </div>
  );
};
