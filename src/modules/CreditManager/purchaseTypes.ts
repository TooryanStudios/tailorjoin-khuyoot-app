/**
 * Purchase History System Types
 * Tracks all credit purchases with complete transaction details
 */

export type PackageType = 'starter' | 'value' | 'pro' | 'basic_monthly' | 'standard_monthly' | 'plus_monthly' | 'custom';

export type PurchaseStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type PaymentMethod = 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash' | 'other';

export interface PurchaseRecord {
  // Transaction identification
  purchase_id: string;
  transaction_id: string;
  user_id: string;
  
  // Purchase details
  package_type: PackageType;
  package_name: string; // e.g., "البداية: 25 توليد"
  
  // Financial information
  amount_paid: number; // In OMR
  currency: string; // 'OMR'
  credits_purchased: number; // Credits added to account
  
  // User balance tracking
  balance_before: number; // Credits before purchase
  balance_after: number; // Credits after purchase
  
  // Purchase metadata
  status: PurchaseStatus;
  payment_method?: PaymentMethod;
  payment_reference?: string; // Bank reference, transaction ID, etc.
  
  // Timestamps
  purchase_date: string; // ISO timestamp
  createdAt?: any; // Firestore timestamp
  updatedAt?: any; // Firestore timestamp
  
  // Additional metadata
  notes?: string;
  admin_notes?: string; // Admin-only notes
  refund_reason?: string; // If refunded
  
  // Subscription info (for monthly packages)
  is_subscription?: boolean;
  subscription_id?: string;
  subscription_period_start?: string;
  subscription_period_end?: string;
  is_renewal?: boolean;
}

export interface CreditPackage {
  id: PackageType;
  name: string;
  name_ar: string;
  credits: number;
  price_omr: number;
  is_subscription: boolean;
  period?: 'monthly'; // For subscriptions
}

// Predefined packages
export const CREDIT_PACKAGES: Record<string, CreditPackage> = {
  // One-time packs
  test: {
    id: 'custom',
    name: 'Test: 1 generation',
    name_ar: 'تجربة: 1 توليد',
    credits: 10,
    price_omr: 0.1,
    is_subscription: false,
  },
  starter: {
    id: 'starter',
    name: 'Starter: 25 generations',
    name_ar: 'البداية: 25 توليد',
    credits: 250, // 25 generations × 10 credits per generation
    price_omr: 2,
    is_subscription: false,
  },
  value: {
    id: 'value',
    name: 'Value: 75 generations',
    name_ar: 'القيمة: 75 توليد',
    credits: 750, // 75 generations × 10 credits
    price_omr: 5,
    is_subscription: false,
  },
  pro: {
    id: 'pro',
    name: 'Pro: 200 generations',
    name_ar: 'الاحترافي: 200 توليد',
    credits: 2000, // 200 generations × 10 credits
    price_omr: 10,
    is_subscription: false,
  },
  
  // Monthly subscriptions
  basic_monthly: {
    id: 'basic_monthly',
    name: 'Basic: 100 generations/month',
    name_ar: 'الأساسي: 100 توليد/شهر',
    credits: 1000, // 100 generations × 10 credits
    price_omr: 3,
    is_subscription: true,
    period: 'monthly',
  },
  standard_monthly: {
    id: 'standard_monthly',
    name: 'Standard: 250 generations/month',
    name_ar: 'القياسي: 250 توليد/شهر',
    credits: 2500, // 250 generations × 10 credits
    price_omr: 6,
    is_subscription: true,
    period: 'monthly',
  },
  plus_monthly: {
    id: 'plus_monthly',
    name: 'Plus: 600 generations/month',
    name_ar: 'بلس: 600 توليد/شهر',
    credits: 6000, // 600 generations × 10 credits
    price_omr: 12,
    is_subscription: true,
    period: 'monthly',
  },
};
