export type CreditActionType = 'generation' | 'upscale' | 'premium_template';

export type CreditPricing = Record<CreditActionType, { credit_cost: number; is_active: boolean }>;

export type CreditTransactionStatus = 'pending' | 'completed' | 'failed';

export type CreditTransaction = {
  transaction_id: string;
  user_id: string;
  amount: number;
  action_type: CreditActionType | string;
  status: CreditTransactionStatus;
  createdAt?: unknown;
  updatedAt?: unknown;
  meta?: Record<string, unknown>;
};

export type UserCreditProfile = {
  user_id: string;
  credit_balance: number;
  tier?: string;
};
