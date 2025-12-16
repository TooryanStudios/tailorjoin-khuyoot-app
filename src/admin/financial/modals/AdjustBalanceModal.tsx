import React, { useState } from 'react';
import { XCircle } from 'lucide-react';
import { Balance } from '../types';

interface AdjustBalanceModalProps {
  balance: Balance;
  onClose: () => void;
  onAdjust: (amount: number, reason: string) => void;
}

export const AdjustBalanceModal: React.FC<AdjustBalanceModalProps> = ({
  balance,
  onClose,
  onAdjust
}) => {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (!amount || !reason) {
      alert('يرجى إدخال المبلغ والسبب');
      return;
    }

    onAdjust(parseFloat(amount), reason);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">تعديل الرصيد</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {balance.userName}
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              المبلغ (استخدم - للخصم)
            </label>
            <input
              type="number"
              step="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.000"
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              السبب
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="سبب التعديل..."
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300"
            >
              إلغاء
            </button>
            <button
              onClick={handleSubmit}
              disabled={!amount || !reason}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              تطبيق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
