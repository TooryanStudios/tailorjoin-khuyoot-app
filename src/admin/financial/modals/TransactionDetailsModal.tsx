import React from 'react';
import { XCircle } from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  TRANSACTION_TYPE_NAMES,
  TRANSACTION_STATUS_NAMES,
  PAYMENT_METHOD_NAMES,
  PAYMENT_METHOD_ICONS
} from '../utils/constants';

interface TransactionDetailsModalProps {
  transaction: Transaction;
  onClose: () => void;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  transaction,
  onClose
}) => {
  const getPaymentMethodIcon = (method: string) => {
    const Icon = PAYMENT_METHOD_ICONS[method];
    return Icon ? <Icon size={16} /> : null;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">تفاصيل المعاملة</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <XCircle size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">النوع</p>
              <p className="font-medium text-slate-800 dark:text-white">
                {TRANSACTION_TYPE_NAMES[transaction.type] || transaction.type}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">الحالة</p>
              <span className={`inline-block px-3 py-1 rounded text-sm ${
                transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {TRANSACTION_STATUS_NAMES[transaction.status] || transaction.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">المبلغ</p>
              <p className="font-bold text-lg text-slate-800 dark:text-white">
                {formatCurrency(transaction.amount, transaction.currency)}
              </p>
            </div>
            {transaction.platformCommission && transaction.platformCommission > 0 && (
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">العمولة</p>
                <p className="font-medium text-slate-800 dark:text-white">
                  {formatCurrency(transaction.platformCommission, transaction.currency)}
                </p>
              </div>
            )}
            {transaction.fromUserName && (
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">من</p>
                <p className="font-medium text-slate-800 dark:text-white">
                  {transaction.fromUserName}
                </p>
              </div>
            )}
            {transaction.toUserName && (
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">إلى</p>
                <p className="font-medium text-slate-800 dark:text-white">
                  {transaction.toUserName}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">طريقة الدفع</p>
              <div className="flex items-center gap-2">
                {getPaymentMethodIcon(transaction.paymentMethod)}
                <span className="font-medium text-slate-800 dark:text-white">
                  {PAYMENT_METHOD_NAMES[transaction.paymentMethod] || transaction.paymentMethod}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">التاريخ</p>
              <p className="font-medium text-slate-800 dark:text-white text-sm">
                {formatDate(transaction.createdAt)}
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">الوصف</p>
            <p className="font-medium text-slate-800 dark:text-white">
              {transaction.description}
            </p>
          </div>
          {transaction.notes && (
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">ملاحظات</p>
              <p className="text-slate-600 dark:text-slate-400">
                {transaction.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
