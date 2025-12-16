// أنواع المعاملات المالية
export type TransactionType = 
  | 'order_payment'           // دفعة من طلب
  | 'subscription_fee'        // رسوم اشتراك
  | 'commission'              // عمولة المنصة
  | 'advertisement_payment'   // دفع إعلان
  | 'refund'                  // استرجاع مبلغ
  | 'withdrawal'              // سحب رصيد
  | 'adjustment'              // تعديل يدوي
  | 'bonus'                   // مكافأة
  | 'penalty';                // غرامة

// حالة المعاملة
export type TransactionStatus = 
  | 'pending'    // قيد الانتظار
  | 'completed'  // مكتملة
  | 'failed'     // فشلت
  | 'cancelled'  // ملغاة
  | 'refunded';  // مستردة

// طريقة الدفع
export type PaymentMethod = 
  | 'cash'           // نقدي
  | 'bank_transfer'  // تحويل بنكي
  | 'credit_card'    // بطاقة ائتمان
  | 'wallet'         // محفظة إلكترونية
  | 'platform_balance'; // رصيد المنصة

// المعاملة المالية
export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  currency: string; // OMR, SAR, etc.
  
  // معلومات المعاملة
  description: string;
  notes?: string;
  reference?: string; // رقم مرجعي (رقم طلب، رقم فاتورة، إلخ)
  
  // الأطراف المعنية
  fromUserId?: string;     // من (العميل عادة)
  fromUserName?: string;
  toUserId?: string;       // إلى (الخياط/المحل)
  toUserName?: string;
  
  // تفاصيل الدفع
  paymentMethod: PaymentMethod;
  paymentDetails?: string; // تفاصيل إضافية عن الدفع
  
  // العمولة
  platformCommission?: number;     // عمولة المنصة
  platformCommissionRate?: number; // نسبة العمولة
  netAmount?: number;              // المبلغ الصافي بعد العمولة
  
  // التواريخ
  createdAt: string;
  completedAt?: string;
  cancelledAt?: string;
  
  // المعاملة المرتبطة (للاستردادات)
  relatedTransactionId?: string;
  
  // معلومات إضافية
  metadata?: Record<string, any>;
  createdBy?: string; // مَن أنشأ المعاملة (للتعديلات اليدوية)
}

// رصيد المستخدم/المحل
export interface Balance {
  userId: string;
  userName: string;
  userType: 'tailor' | 'boutique' | 'shop' | 'platform';
  
  // الرصيد
  availableBalance: number;  // الرصيد المتاح للسحب
  pendingBalance: number;    // الرصيد المعلق (طلبات قيد التنفيذ)
  totalEarned: number;       // إجمالي المكتسب
  totalWithdrawn: number;    // إجمالي المسحوب
  
  currency: string;
  lastUpdated: string;
}

// طلب سحب رصيد
export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userType: 'tailor' | 'boutique' | 'shop';
  
  amount: number;
  currency: string;
  
  // معلومات الحساب البنكي
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  iban?: string;
  
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  notes?: string;
  adminNotes?: string;
  
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
  completedAt?: string;
}

// تقرير مالي
export interface FinancialReport {
  id: string;
  reportType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  startDate: string;
  endDate: string;
  
  // إحصائيات العائدات
  totalRevenue: number;           // إجمالي العائدات
  totalCommission: number;        // إجمالي العمولات
  netRevenue: number;             // العائدات الصافية
  
  // إحصائيات المعاملات
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  refundedTransactions: number;
  
  // إحصائيات حسب النوع
  orderPayments: number;          // دفعات الطلبات
  subscriptionFees: number;       // رسوم الاشتراكات
  advertisementPayments: number;  // دفعات الإعلانات
  refunds: number;                // المبالغ المستردة
  withdrawals: number;            // المبالغ المسحوبة
  
  // إحصائيات حسب طريقة الدفع
  cashPayments: number;
  bankTransferPayments: number;
  cardPayments: number;
  walletPayments: number;
  
  // أفضل الشركاء (أعلى عائدات)
  topEarners: Array<{
    userId: string;
    userName: string;
    userType: string;
    totalEarned: number;
    transactionsCount: number;
  }>;
  
  currency: string;
  generatedAt: string;
  generatedBy?: string;
}

// إعدادات النظام المالي
export interface FinancialSettings {
  // العملة الافتراضية
  defaultCurrency: string;
  
  // نسب العمولات
  defaultCommissionRate: number;      // النسبة الافتراضية
  tailorCommissionRate: number;       // نسبة عمولة الخياطين
  boutiqueCommissionRate: number;     // نسبة عمولة البوتيكات
  shopCommissionRate: number;         // نسبة عمولة المحلات
  
  // حد السحب
  minimumWithdrawal: number;          // الحد الأدنى للسحب
  withdrawalProcessingDays: number;   // أيام معالجة السحب
  
  // إعدادات الدفع
  allowedPaymentMethods: PaymentMethod[];
  autoApproveWithdrawals: boolean;    // الموافقة التلقائية على السحب
  
  // إعدادات التقارير
  autoGenerateReports: boolean;
  reportEmailRecipients: string[];
  
  lastUpdated: string;
  updatedBy?: string;
}

// إشعار مالي
export interface FinancialNotification {
  id: string;
  type: 'payment_received' | 'withdrawal_approved' | 'withdrawal_completed' | 'low_balance' | 'high_earning';
  userId: string;
  title: string;
  message: string;
  amount?: number;
  currency?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}
