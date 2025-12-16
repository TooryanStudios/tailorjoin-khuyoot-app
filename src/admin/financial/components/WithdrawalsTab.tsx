import React from 'react';
import { Search } from 'lucide-react';
import { WithdrawalRequest } from '../types';
import { formatCurrency, formatShortDate } from '../utils/formatters';
import { WITHDRAWAL_STATUS_NAMES, WITHDRAWAL_STATUS_COLORS } from '../utils/constants';

interface WithdrawalsTabProps {
  withdrawals: WithdrawalRequest[];
  filter: {
    status: string;
    search: string;
  };
  onFilterChange: (filter: any) => void;
  onViewWithdrawal: (withdrawal: WithdrawalRequest) => void;
}

export const WithdrawalsTab: React.FC<WithdrawalsTabProps> = ({
  withdrawals,
  filter,
  onFilterChange,
  onViewWithdrawal
}) => {
  const filteredWithdrawals = withdrawals.filter(w => {
    if (filter.status && w.status !== filter.status) return false;
    if (filter.search) {
      const search = filter.search.toLowerCase();
      return (
        w.userName.toLowerCase().includes(search) ||
        w.bankName.toLowerCase().includes(search) ||
        w.accountNumber.includes(search)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            value={filter.status}
            onChange={(e) => onFilterChange({ ...filter, status: e.target.value })}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
          >
            <option value="">جميع الحالات</option>
            {Object.entries(WITHDRAWAL_STATUS_NAMES).map(([key, value]) => (
              <option key={key} value={key}>{value}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">المستخدم</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">المبلغ</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">البنك</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">رقم الحساب</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">الحالة</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">التاريخ</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredWithdrawals.map(withdrawal => (
                <tr key={withdrawal.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-white">
                    {withdrawal.userName}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">
                    {formatCurrency(withdrawal.amount, withdrawal.currency)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {withdrawal.bankName}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {withdrawal.accountNumber}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${WITHDRAWAL_STATUS_COLORS[withdrawal.status] || ''}`}>
                      {WITHDRAWAL_STATUS_NAMES[withdrawal.status] || withdrawal.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                    {formatShortDate(withdrawal.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onViewWithdrawal(withdrawal)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                    >
                      معالجة
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
