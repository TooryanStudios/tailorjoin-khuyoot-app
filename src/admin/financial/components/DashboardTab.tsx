import React from 'react';
import { DollarSign, TrendingUp, Wallet, ArrowDownToLine, Eye, Clock } from 'lucide-react';
import { Transaction, WithdrawalRequest } from '../types';
import { formatCurrency, formatShortDate } from '../utils/formatters';
import { TRANSACTION_TYPE_NAMES, PAYMENT_METHOD_ICONS } from '../utils/constants';

interface DashboardTabProps {
  dashboardStats: any;
  transactions: Transaction[];
  withdrawals: WithdrawalRequest[];
  onViewWithdrawal: (withdrawal: WithdrawalRequest) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  dashboardStats,
  transactions,
  withdrawals,
  onViewWithdrawal
}) => {
  const getPaymentMethodIcon = (method: string) => {
    const Icon = PAYMENT_METHOD_ICONS[method] || DollarSign;
    return <Icon size={16} />;
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <DollarSign size={32} />
            <TrendingUp size={24} className="opacity-75" />
          </div>
          <p className="text-sm opacity-90 mb-1">العائدات الشهرية</p>
          <p className="text-3xl font-bold">
            {formatCurrency(dashboardStats.monthlyRevenue)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp size={32} />
            <DollarSign size={24} className="opacity-75" />
          </div>
          <p className="text-sm opacity-90 mb-1">العمولات الشهرية</p>
          <p className="text-3xl font-bold">
            {formatCurrency(dashboardStats.monthlyCommission)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <Wallet size={32} />
            <Eye size={24} className="opacity-75" />
          </div>
          <p className="text-sm opacity-90 mb-1">رصيد المنصة</p>
          <p className="text-3xl font-bold">
            {formatCurrency(dashboardStats.totalPlatformBalance)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <ArrowDownToLine size={32} />
            <Clock size={24} className="opacity-75" />
          </div>
          <p className="text-sm opacity-90 mb-1">طلبات سحب معلقة</p>
          <p className="text-3xl font-bold">{dashboardStats.pendingWithdrawals}</p>
          <p className="text-sm opacity-75 mt-1">
            {formatCurrency(dashboardStats.pendingWithdrawalAmount)}
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
            آخر المعاملات
          </h3>
          <div className="space-y-3">
            {transactions.slice(0, 5).map(transaction => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    transaction.status === 'completed' ? 'bg-green-100 text-green-600' :
                    transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {getPaymentMethodIcon(transaction.paymentMethod)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white text-sm">
                      {TRANSACTION_TYPE_NAMES[transaction.type] || transaction.type}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {transaction.description}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800 dark:text-white">
                    {formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {formatShortDate(transaction.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Withdrawals */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
            طلبات السحب المعلقة
          </h3>
          <div className="space-y-3">
            {withdrawals
              .filter(w => w.status === 'pending')
              .slice(0, 5)
              .map(withdrawal => (
                <div
                  key={withdrawal.id}
                  className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
                >
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white text-sm">
                      {withdrawal.userName}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {withdrawal.bankName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-amber-600">
                      {formatCurrency(withdrawal.amount, withdrawal.currency)}
                    </p>
                    <button
                      onClick={() => onViewWithdrawal(withdrawal)}
                      className="text-xs text-blue-600 hover:underline mt-1"
                    >
                      معالجة
                    </button>
                  </div>
                </div>
              ))}
            {withdrawals.filter(w => w.status === 'pending').length === 0 && (
              <p className="text-center text-slate-500 dark:text-slate-400 py-8 text-sm">
                لا توجد طلبات سحب معلقة
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
