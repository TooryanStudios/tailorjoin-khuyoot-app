import React from 'react';
import { XCircle, CheckCircle } from 'lucide-react';
import { WithdrawalRequest } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface WithdrawalDetailsModalProps {
  withdrawal: WithdrawalRequest;
  onClose: () => void;
  onApprove: (notes?: string) => void;
  onReject: (notes: string) => void;
  onComplete: () => void;
}

export const WithdrawalDetailsModal: React.FC<WithdrawalDetailsModalProps> = ({
  withdrawal,
  onClose,
  onApprove,
  onReject,
  onComplete
}) => {
  const handleApprove = () => {
    const notes = prompt('ملاحظات (اختياري):');
    onApprove(notes || undefined);
  };

  const handleReject = () => {
    const notes = prompt('سبب الرفض:');
    if (notes) {
      onReject(notes);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">تفاصيل طلب السحب</h3>
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
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">المستخدم</p>
              <p className="font-medium text-slate-800 dark:text-white">{withdrawal.userName}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">المبلغ</p>
              <p className="font-bold text-lg text-slate-800 dark:text-white">
                {formatCurrency(withdrawal.amount, withdrawal.currency)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">البنك</p>
              <p className="font-medium text-slate-800 dark:text-white">{withdrawal.bankName}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">اسم صاحب الحساب</p>
              <p className="font-medium text-slate-800 dark:text-white">{withdrawal.accountHolderName}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">رقم الحساب</p>
              <p className="font-medium text-slate-800 dark:text-white">{withdrawal.accountNumber}</p>
            </div>
            {withdrawal.iban && (
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">IBAN</p>
                <p className="font-medium text-slate-800 dark:text-white">{withdrawal.iban}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">الحالة</p>
              <span className={`inline-block px-3 py-1 rounded text-sm ${
                withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                withdrawal.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                withdrawal.status === 'completed' ? 'bg-green-100 text-green-700' :
                'bg-red-100 text-red-700'
              }`}>
                {withdrawal.status === 'pending' ? 'معلقة' :
                 withdrawal.status === 'approved' ? 'موافق عليها' :
                 withdrawal.status === 'completed' ? 'مكتملة' : 'مرفوضة'}
              </span>
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">تاريخ الطلب</p>
              <p className="font-medium text-slate-800 dark:text-white text-sm">
                {formatDate(withdrawal.createdAt)}
              </p>
            </div>
          </div>
          
          {withdrawal.notes && (
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">ملاحظات المستخدم</p>
              <p className="text-slate-600 dark:text-slate-400">{withdrawal.notes}</p>
            </div>
          )}
          
          {withdrawal.adminNotes && (
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">ملاحظات المدير</p>
              <p className="text-slate-600 dark:text-slate-400">{withdrawal.adminNotes}</p>
            </div>
          )}

          {/* Actions */}
          {withdrawal.status === 'pending' && (
            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleApprove}
                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                موافقة
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                <XCircle size={18} />
                رفض
              </button>
            </div>
          )}

          {withdrawal.status === 'approved' && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={onComplete}
                className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} />
                تأكيد اكتمال التحويل
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
