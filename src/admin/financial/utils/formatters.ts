/**
 * تنسيق العملة
 */
export const formatCurrency = (amount: number, currency: string = 'OMR'): string => {
  return `${amount.toFixed(3)} ${currency}`;
};

/**
 * تنسيق التاريخ
 */
export const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * تنسيق التاريخ القصير
 */
export const formatShortDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('ar-SA');
};

/**
 * حساب معدل النقر CTR
 */
export const getCTR = (views: number, clicks: number): string => {
  if (views === 0) return '0.00';
  return ((clicks / views) * 100).toFixed(2);
};

/**
 * تنسيق الأرقام الكبيرة
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('ar-SA');
};
