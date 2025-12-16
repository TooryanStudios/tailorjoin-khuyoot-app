import React from 'react';
import { Balance } from '../types';
import { formatCurrency } from '../utils/formatters';
import { USER_TYPE_NAMES } from '../utils/constants';

interface BalancesTabProps {
  balances: Balance[];
  onAdjustBalance: (balance: Balance) => void;
}

export const BalancesTab: React.FC<BalancesTabProps> = ({
  balances,
  onAdjustBalance
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">المستخدم</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">النوع</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">الرصيد المتاح</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">الرصيد المعلق</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">إجمالي المكتسب</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">إجمالي المسحوب</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {balances.map(balance => (
                <tr key={balance.userId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-white">
                    {balance.userName || balance.userId}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded dark:bg-purple-900/30 dark:text-purple-400">
                      {USER_TYPE_NAMES[balance.userType] || balance.userType}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-green-600">
                    {formatCurrency(balance.availableBalance, balance.currency)}
                  </td>
                  <td className="px-4 py-3 font-bold text-yellow-600">
                    {formatCurrency(balance.pendingBalance, balance.currency)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {formatCurrency(balance.totalEarned, balance.currency)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {formatCurrency(balance.totalWithdrawn, balance.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onAdjustBalance(balance)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                    >
                      تعديل
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
