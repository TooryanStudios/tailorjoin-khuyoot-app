import React from 'react';
import { Search, Download, Eye } from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency, formatShortDate } from '../utils/formatters';
import {
  TRANSACTION_TYPE_NAMES,
  TRANSACTION_STATUS_NAMES,
  TRANSACTION_STATUS_COLORS,
  PAYMENT_METHOD_NAMES,
  PAYMENT_METHOD_ICONS
} from '../utils/constants';

interface TransactionsTabProps {
  transactions: Transaction[];
  filter: {
    type: string;
    status: string;
    search: string;
  };
  onFilterChange: (filter: any) => void;
  onViewTransaction: (transaction: Transaction) => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  filter,
  onFilterChange,
  onViewTransaction
}) => {
  const getPaymentMethodIcon = (method: string) => {
    const Icon = PAYMENT_METHOD_ICONS[method];
    return Icon ? <Icon size={16} /> : null;
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter.type && t.type !== filter.type) return false;
    if (filter.status && t.status !== filter.status) return false;
    if (filter.search) {
      const search = filter.search.toLowerCase();
      return (
        t.description.toLowerCase().includes(search) ||
        t.fromUserName?.toLowerCase().includes(search) ||
        t.toUserName?.toLowerCase().includes(search) ||
        t.reference?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="بحث..."
              value={filter.search}
              onChange={(e) => onFilterChange({ ...filter, search: e.target.value })}
              className="w-full pr-10 pl-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
            />
          </div>

          <select
            value={filter.type}
            onChange={(e) => onFilterChange({ ...filter, type: e.target.value })}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
          >
            <option value="">جميع الأنواع</option>
            {Object.entries(TRANSACTION_TYPE_NAMES).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>

          <select
            value={filter.status}
            onChange={(e) => onFilterChange({ ...filter, status: e.target.value })}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
          >
            <option value="">جميع الحالات</option>
            {Object.entries(TRANSACTION_STATUS_NAMES).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>

          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
            <Download size={18} />
            تصدير Excel
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">النوع</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">الوصف</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">من/إلى</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">المبلغ</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">الطريقة</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">الحالة</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">التاريخ</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredTransactions.map(transaction => (
                <tr key={transaction.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded dark:bg-blue-900/30 dark:text-blue-400">
                      {TRANSACTION_TYPE_NAMES[transaction.type] || transaction.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-800 dark:text-white">
                    {transaction.description}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {transaction.fromUserName && <div>من: {transaction.fromUserName}</div>}
                    {transaction.toUserName && <div>إلى: {transaction.toUserName}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-800 dark:text-white">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </div>
                    {transaction.platformCommission && transaction.platformCommission > 0 && (
                      <div className="text-xs text-slate-500">
                        عمولة: {formatCurrency(transaction.platformCommission, transaction.currency)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      {getPaymentMethodIcon(transaction.paymentMethod)}
                      {PAYMENT_METHOD_NAMES[transaction.paymentMethod] || transaction.paymentMethod}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${TRANSACTION_STATUS_COLORS[transaction.status] || ''}`}>
                      {TRANSACTION_STATUS_NAMES[transaction.status] || transaction.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                    {formatShortDate(transaction.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onViewTransaction(transaction)}
                      className="p-1.5 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded transition-colors dark:bg-blue-900/30 dark:text-blue-400"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
