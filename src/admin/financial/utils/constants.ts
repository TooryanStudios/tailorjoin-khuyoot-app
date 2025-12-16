import { Banknote, Building2, CreditCard, Smartphone, DollarSign } from 'lucide-react';

/**
 * أسماء أنواع المعاملات
 */
export const TRANSACTION_TYPE_NAMES: Record<string, string> = {
  order_payment: 'دفعة طلب',
  subscription_fee: 'رسوم اشتراك',
  commission: 'عمولة',
  advertisement_payment: 'دفع إعلان',
  refund: 'استرجاع',
  withdrawal: 'سحب',
  adjustment: 'تعديل',
  bonus: 'مكافأة',
  penalty: 'غرامة'
};

/**
 * أسماء حالات المعاملات
 */
export const TRANSACTION_STATUS_NAMES: Record<string, string> = {
  pending: 'معلقة',
  completed: 'مكتملة',
  failed: 'فشلت',
  cancelled: 'ملغاة',
  refunded: 'مستردة'
};

/**
 * أسماء طرق الدفع
 */
export const PAYMENT_METHOD_NAMES: Record<string, string> = {
  cash: 'نقدي',
  bank_transfer: 'تحويل بنكي',
  credit_card: 'بطاقة ائتمان',
  wallet: 'محفظة إلكترونية',
  platform_balance: 'رصيد المنصة'
};

/**
 * أيقونات طرق الدفع
 */
export const PAYMENT_METHOD_ICONS: Record<string, any> = {
  cash: Banknote,
  bank_transfer: Building2,
  credit_card: CreditCard,
  wallet: Smartphone,
  platform_balance: DollarSign
};

/**
 * أسماء أنواع المستخدمين
 */
export const USER_TYPE_NAMES: Record<string, string> = {
  tailor: 'خياط',
  boutique: 'بوتيك',
  shop: 'محل',
  fabric_store: 'محل أقمشة',
  platform: 'المنصة'
};

/**
 * أسماء حالات طلبات السحب
 */
export const WITHDRAWAL_STATUS_NAMES: Record<string, string> = {
  pending: 'معلقة',
  approved: 'موافق عليها',
  rejected: 'مرفوضة',
  completed: 'مكتملة'
};

/**
 * ألوان حالات المعاملات
 */
export const TRANSACTION_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  refunded: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
};

/**
 * ألوان حالات طلبات السحب
 */
export const WITHDRAWAL_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
};
