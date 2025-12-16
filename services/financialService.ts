import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit,
  Timestamp,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Transaction, 
  Balance, 
  WithdrawalRequest, 
  FinancialReport,
  FinancialSettings,
  TransactionType,
  TransactionStatus,
  PaymentMethod
} from '../src/admin/financial/types';

// =====================
// معاملات مالية (Transactions)
// =====================

/**
 * إنشاء معاملة مالية جديدة
 */
export const createTransaction = async (
  transactionData: Omit<Transaction, 'id' | 'createdAt'>
): Promise<string> => {
  try {
    const transactionsRef = collection(db, 'transactions');
    const newTransaction = {
      ...transactionData,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(transactionsRef, newTransaction);
    
    // تحديث الأرصدة
    if (transactionData.status === 'completed') {
      await updateBalancesAfterTransaction({
        id: docRef.id,
        ...newTransaction
      } as Transaction);
    }

    console.log('✅ Transaction created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating transaction:', error);
    throw error;
  }
};

/**
 * الحصول على معاملة بالمعرف
 */
export const getTransaction = async (id: string): Promise<Transaction | null> => {
  try {
    const docRef = doc(db, 'transactions', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Transaction;
    }
    return null;
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return null;
  }
};

/**
 * الحصول على جميع المعاملات مع فلترة
 */
export const getTransactions = async (filters?: {
  userId?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<Transaction[]> => {
  try {
    let q = query(collection(db, 'transactions'));
    
    if (filters?.userId) {
      q = query(q, where('fromUserId', '==', filters.userId));
    }
    
    if (filters?.type) {
      q = query(q, where('type', '==', filters.type));
    }
    
    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }
    
    q = query(q, orderBy('createdAt', 'desc'));
    
    if (filters?.limit) {
      q = query(q, limit(filters.limit));
    }
    
    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Transaction[];
    
    // فلترة حسب التاريخ في الذاكرة
    let filtered = transactions;
    if (filters?.startDate) {
      filtered = filtered.filter(t => t.createdAt >= filters.startDate!);
    }
    if (filters?.endDate) {
      filtered = filtered.filter(t => t.createdAt <= filters.endDate!);
    }
    
    return filtered;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

/**
 * تحديث حالة معاملة
 */
export const updateTransactionStatus = async (
  id: string,
  status: TransactionStatus,
  notes?: string
): Promise<void> => {
  try {
    const docRef = doc(db, 'transactions', id);
    const updateData: any = { status };
    
    if (notes) updateData.notes = notes;
    
    if (status === 'completed') {
      updateData.completedAt = new Date().toISOString();
    } else if (status === 'cancelled') {
      updateData.cancelledAt = new Date().toISOString();
    }
    
    await updateDoc(docRef, updateData);
    
    // تحديث الأرصدة إذا اكتملت المعاملة
    if (status === 'completed') {
      const transaction = await getTransaction(id);
      if (transaction) {
        await updateBalancesAfterTransaction(transaction);
      }
    }
    
    console.log('✅ Transaction status updated:', id, status);
  } catch (error) {
    console.error('Error updating transaction status:', error);
    throw error;
  }
};

/**
 * حذف معاملة (للمدير فقط)
 */
export const deleteTransaction = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'transactions', id));
    console.log('✅ Transaction deleted:', id);
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

// =====================
// الأرصدة (Balances)
// =====================

/**
 * الحصول على رصيد مستخدم
 */
export const getUserBalance = async (userId: string): Promise<Balance | null> => {
  try {
    const docRef = doc(db, 'balances', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { userId, ...docSnap.data() } as Balance;
    }
    
    // إنشاء رصيد جديد إذا لم يكن موجوداً
    const newBalance: Omit<Balance, 'userId'> = {
      userName: '',
      userType: 'tailor',
      availableBalance: 0,
      pendingBalance: 0,
      totalEarned: 0,
      totalWithdrawn: 0,
      currency: 'OMR',
      lastUpdated: new Date().toISOString()
    };
    
    await updateDoc(docRef, newBalance as any);
    return { userId, ...newBalance } as Balance;
  } catch (error) {
    console.error('Error fetching balance:', error);
    return null;
  }
};

/**
 * الحصول على جميع الأرصدة
 */
export const getAllBalances = async (): Promise<Balance[]> => {
  try {
    const snapshot = await getDocs(collection(db, 'balances'));
    return snapshot.docs.map(doc => ({
      userId: doc.id,
      ...doc.data()
    })) as Balance[];
  } catch (error) {
    console.error('Error fetching balances:', error);
    return [];
  }
};

/**
 * تحديث الأرصدة بعد معاملة
 */
const updateBalancesAfterTransaction = async (transaction: Transaction): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    // تحديث رصيد المستلم (الخياط/المحل)
    if (transaction.toUserId) {
      const toBalanceRef = doc(db, 'balances', transaction.toUserId);
      const netAmount = transaction.netAmount || transaction.amount;
      
      batch.update(toBalanceRef, {
        availableBalance: increment(netAmount),
        totalEarned: increment(transaction.amount),
        lastUpdated: new Date().toISOString()
      });
    }
    
    // تحديث رصيد المنصة (العمولة)
    if (transaction.platformCommission && transaction.platformCommission > 0) {
      const platformBalanceRef = doc(db, 'balances', 'platform');
      batch.update(platformBalanceRef, {
        availableBalance: increment(transaction.platformCommission),
        totalEarned: increment(transaction.platformCommission),
        lastUpdated: new Date().toISOString()
      });
    }
    
    await batch.commit();
    console.log('✅ Balances updated after transaction');
  } catch (error) {
    console.error('Error updating balances:', error);
  }
};

/**
 * تحديث رصيد يدوياً (للمدير)
 */
export const adjustBalance = async (
  userId: string,
  amount: number,
  reason: string,
  adminId: string
): Promise<void> => {
  try {
    // إنشاء معاملة تعديل
    await createTransaction({
      type: 'adjustment',
      status: 'completed',
      amount: Math.abs(amount),
      currency: 'OMR',
      description: reason,
      toUserId: amount > 0 ? userId : undefined,
      fromUserId: amount < 0 ? userId : undefined,
      paymentMethod: 'platform_balance',
      createdBy: adminId,
      completedAt: new Date().toISOString()
    });
    
    console.log('✅ Balance adjusted for user:', userId);
  } catch (error) {
    console.error('Error adjusting balance:', error);
    throw error;
  }
};

// =====================
// طلبات السحب (Withdrawal Requests)
// =====================

/**
 * إنشاء طلب سحب
 */
export const createWithdrawalRequest = async (
  requestData: Omit<WithdrawalRequest, 'id' | 'createdAt' | 'status'>
): Promise<string> => {
  try {
    // التحقق من الرصيد المتاح
    const balance = await getUserBalance(requestData.userId);
    if (!balance || balance.availableBalance < requestData.amount) {
      throw new Error('الرصيد غير كافٍ');
    }
    
    const withdrawalsRef = collection(db, 'withdrawal_requests');
    const newRequest = {
      ...requestData,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };

    const docRef = await addDoc(withdrawalsRef, newRequest);
    
    // تحديث الرصيد المعلق
    const balanceRef = doc(db, 'balances', requestData.userId);
    await updateDoc(balanceRef, {
      availableBalance: increment(-requestData.amount),
      pendingBalance: increment(requestData.amount),
      lastUpdated: new Date().toISOString()
    });
    
    console.log('✅ Withdrawal request created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating withdrawal request:', error);
    throw error;
  }
};

/**
 * الحصول على جميع طلبات السحب
 */
export const getWithdrawalRequests = async (filters?: {
  userId?: string;
  status?: WithdrawalRequest['status'];
}): Promise<WithdrawalRequest[]> => {
  try {
    let q = query(collection(db, 'withdrawal_requests'));
    
    if (filters?.userId) {
      q = query(q, where('userId', '==', filters.userId));
    }
    
    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }
    
    q = query(q, orderBy('createdAt', 'desc'));
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as WithdrawalRequest[];
  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    return [];
  }
};

/**
 * معالجة طلب سحب (موافقة/رفض)
 */
export const processWithdrawalRequest = async (
  requestId: string,
  approved: boolean,
  adminId: string,
  adminNotes?: string
): Promise<void> => {
  try {
    const requestRef = doc(db, 'withdrawal_requests', requestId);
    const requestSnap = await getDoc(requestRef);
    
    if (!requestSnap.exists()) {
      throw new Error('طلب السحب غير موجود');
    }
    
    const request = requestSnap.data() as WithdrawalRequest;
    const balanceRef = doc(db, 'balances', request.userId);
    
    if (approved) {
      // الموافقة على السحب
      await updateDoc(requestRef, {
        status: 'approved',
        processedAt: new Date().toISOString(),
        processedBy: adminId,
        adminNotes
      });
      
      // تحديث الرصيد المعلق
      await updateDoc(balanceRef, {
        pendingBalance: increment(-request.amount),
        lastUpdated: new Date().toISOString()
      });
      
      // إنشاء معاملة سحب
      await createTransaction({
        type: 'withdrawal',
        status: 'completed',
        amount: request.amount,
        currency: request.currency,
        description: `سحب رصيد - ${request.bankName}`,
        fromUserId: request.userId,
        fromUserName: request.userName,
        paymentMethod: 'bank_transfer',
        paymentDetails: `${request.bankName} - ${request.accountNumber}`,
        reference: requestId,
        completedAt: new Date().toISOString()
      });
      
    } else {
      // رفض السحب - إعادة المبلغ للرصيد المتاح
      await updateDoc(requestRef, {
        status: 'rejected',
        processedAt: new Date().toISOString(),
        processedBy: adminId,
        adminNotes
      });
      
      await updateDoc(balanceRef, {
        availableBalance: increment(request.amount),
        pendingBalance: increment(-request.amount),
        lastUpdated: new Date().toISOString()
      });
    }
    
    console.log('✅ Withdrawal request processed:', requestId, approved ? 'approved' : 'rejected');
  } catch (error) {
    console.error('Error processing withdrawal request:', error);
    throw error;
  }
};

/**
 * تأكيد اكتمال السحب
 */
export const completeWithdrawal = async (
  requestId: string,
  adminId: string
): Promise<void> => {
  try {
    const requestRef = doc(db, 'withdrawal_requests', requestId);
    await updateDoc(requestRef, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      processedBy: adminId
    });
    
    const requestSnap = await getDoc(requestRef);
    const request = requestSnap.data() as WithdrawalRequest;
    
    // تحديث إجمالي المسحوب
    const balanceRef = doc(db, 'balances', request.userId);
    await updateDoc(balanceRef, {
      totalWithdrawn: increment(request.amount),
      lastUpdated: new Date().toISOString()
    });
    
    console.log('✅ Withdrawal completed:', requestId);
  } catch (error) {
    console.error('Error completing withdrawal:', error);
    throw error;
  }
};

// =====================
// التقارير المالية (Financial Reports)
// =====================

/**
 * إنشاء تقرير مالي
 */
export const generateFinancialReport = async (
  startDate: string,
  endDate: string,
  reportType: FinancialReport['reportType'] = 'custom',
  generatedBy?: string
): Promise<FinancialReport> => {
  try {
    // جلب جميع المعاملات في الفترة المحددة
    const transactions = await getTransactions({ startDate, endDate });
    
    const completedTransactions = transactions.filter(t => t.status === 'completed');
    const successfulCount = completedTransactions.length;
    const failedCount = transactions.filter(t => t.status === 'failed').length;
    const refundedCount = transactions.filter(t => t.type === 'refund').length;
    
    // حساب الإحصائيات
    const totalRevenue = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalCommission = completedTransactions.reduce((sum, t) => sum + (t.platformCommission || 0), 0);
    const netRevenue = totalRevenue - totalCommission;
    
    // حسب النوع
    const orderPayments = completedTransactions
      .filter(t => t.type === 'order_payment')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const subscriptionFees = completedTransactions
      .filter(t => t.type === 'subscription_fee')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const advertisementPayments = completedTransactions
      .filter(t => t.type === 'advertisement_payment')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const refunds = completedTransactions
      .filter(t => t.type === 'refund')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const withdrawals = completedTransactions
      .filter(t => t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // حسب طريقة الدفع
    const cashPayments = completedTransactions
      .filter(t => t.paymentMethod === 'cash')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const bankTransferPayments = completedTransactions
      .filter(t => t.paymentMethod === 'bank_transfer')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const cardPayments = completedTransactions
      .filter(t => t.paymentMethod === 'credit_card')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const walletPayments = completedTransactions
      .filter(t => t.paymentMethod === 'wallet')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // أفضل الشركاء
    const earnerMap = new Map<string, any>();
    completedTransactions.forEach(t => {
      if (t.toUserId) {
        const existing = earnerMap.get(t.toUserId) || {
          userId: t.toUserId,
          userName: t.toUserName || '',
          userType: '',
          totalEarned: 0,
          transactionsCount: 0
        };
        
        existing.totalEarned += (t.netAmount || t.amount);
        existing.transactionsCount += 1;
        earnerMap.set(t.toUserId, existing);
      }
    });
    
    const topEarners = Array.from(earnerMap.values())
      .sort((a, b) => b.totalEarned - a.totalEarned)
      .slice(0, 10);
    
    const report: FinancialReport = {
      id: `report_${Date.now()}`,
      reportType,
      startDate,
      endDate,
      totalRevenue,
      totalCommission,
      netRevenue,
      totalTransactions: transactions.length,
      successfulTransactions: successfulCount,
      failedTransactions: failedCount,
      refundedTransactions: refundedCount,
      orderPayments,
      subscriptionFees,
      advertisementPayments,
      refunds,
      withdrawals,
      cashPayments,
      bankTransferPayments,
      cardPayments,
      walletPayments,
      topEarners,
      currency: 'OMR',
      generatedAt: new Date().toISOString(),
      generatedBy
    };
    
    // حفظ التقرير
    const reportsRef = collection(db, 'financial_reports');
    await addDoc(reportsRef, report);
    
    console.log('✅ Financial report generated');
    return report;
  } catch (error) {
    console.error('Error generating financial report:', error);
    throw error;
  }
};

/**
 * الحصول على التقارير المحفوظة
 */
export const getSavedReports = async (): Promise<FinancialReport[]> => {
  try {
    const q = query(
      collection(db, 'financial_reports'),
      orderBy('generatedAt', 'desc'),
      limit(50)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FinancialReport[];
  } catch (error) {
    console.error('Error fetching saved reports:', error);
    return [];
  }
};

// =====================
// الإعدادات المالية
// =====================

/**
 * الحصول على إعدادات النظام المالي
 */
export const getFinancialSettings = async (): Promise<FinancialSettings> => {
  try {
    const docRef = doc(db, 'settings', 'financial');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as FinancialSettings;
    }
    
    // الإعدادات الافتراضية
    const defaultSettings: FinancialSettings = {
      defaultCurrency: 'OMR',
      defaultCommissionRate: 10,
      tailorCommissionRate: 10,
      boutiqueCommissionRate: 15,
      shopCommissionRate: 12,
      minimumWithdrawal: 10,
      withdrawalProcessingDays: 3,
      allowedPaymentMethods: ['cash', 'bank_transfer', 'credit_card', 'wallet'],
      autoApproveWithdrawals: false,
      autoGenerateReports: true,
      reportEmailRecipients: [],
      lastUpdated: new Date().toISOString()
    };
    
    return defaultSettings;
  } catch (error) {
    console.error('Error fetching financial settings:', error);
    throw error;
  }
};

/**
 * تحديث إعدادات النظام المالي
 */
export const updateFinancialSettings = async (
  settings: Partial<FinancialSettings>,
  adminId: string
): Promise<void> => {
  try {
    const docRef = doc(db, 'settings', 'financial');
    await updateDoc(docRef, {
      ...settings,
      lastUpdated: new Date().toISOString(),
      updatedBy: adminId
    });
    
    console.log('✅ Financial settings updated');
  } catch (error) {
    console.error('Error updating financial settings:', error);
    throw error;
  }
};

// =====================
// إحصائيات سريعة
// =====================

/**
 * الحصول على إحصائيات Dashboard
 */
export const getFinancialDashboardStats = async () => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();
    
    const [
      monthTransactions,
      allBalances,
      pendingWithdrawals
    ] = await Promise.all([
      getTransactions({ startDate: startOfMonth, endDate: endOfMonth }),
      getAllBalances(),
      getWithdrawalRequests({ status: 'pending' })
    ]);
    
    const completedTransactions = monthTransactions.filter(t => t.status === 'completed');
    const monthlyRevenue = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const monthlyCommission = completedTransactions.reduce((sum, t) => sum + (t.platformCommission || 0), 0);
    
    const totalPlatformBalance = allBalances
      .find(b => b.userId === 'platform')?.availableBalance || 0;
    
    const pendingWithdrawalAmount = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    
    return {
      monthlyRevenue,
      monthlyCommission,
      totalPlatformBalance,
      pendingWithdrawals: pendingWithdrawals.length,
      pendingWithdrawalAmount,
      totalTransactions: monthTransactions.length,
      successRate: monthTransactions.length > 0 
        ? ((completedTransactions.length / monthTransactions.length) * 100).toFixed(1)
        : '0'
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      monthlyRevenue: 0,
      monthlyCommission: 0,
      totalPlatformBalance: 0,
      pendingWithdrawals: 0,
      pendingWithdrawalAmount: 0,
      totalTransactions: 0,
      successRate: '0'
    };
  }
};
