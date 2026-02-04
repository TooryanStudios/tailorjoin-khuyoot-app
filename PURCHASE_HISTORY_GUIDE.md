# Purchase History & Credit System - Complete Guide

## Overview
The credit purchase system now tracks complete transaction history with all relevant financial and user balance information.

## 📦 Package Types

### One-Time Credit Packs
| Package | Generations | Credits | Price (OMR) |
|---------|------------|---------|-------------|
| Starter | 25 | 250 | 2 |
| Value | 75 | 750 | 5 |
| Pro | 200 | 2000 | 10 |

### Monthly Subscriptions
| Package | Generations/Month | Credits | Price (OMR/month) |
|---------|------------------|---------|-------------------|
| Basic | 100 | 1000 | 3 |
| Standard | 250 | 2500 | 6 |
| Plus | 600 | 6000 | 12 |

**Note:** Credits are calculated as: `generations × 10` (each generation costs 10 credits)

## 🗄️ Database Structure

### Collections

#### 1. `purchase_history` (NEW)
Stores detailed purchase records for financial tracking and user purchase history.

**Document Structure:**
```typescript
{
  // Identification
  purchase_id: string;        // Unique purchase ID
  transaction_id: string;      // Links to credit_transactions
  user_id: string;            // User who made the purchase
  
  // Package Details
  package_type: 'starter' | 'value' | 'pro' | 'basic_monthly' | 'standard_monthly' | 'plus_monthly';
  package_name: string;        // Arabic name "البداية: 25 توليد"
  
  // Financial Information
  amount_paid: number;         // Amount in OMR (e.g., 2, 5, 10)
  currency: 'OMR';
  credits_purchased: number;   // Credits added (250, 750, 2000, etc.)
  
  // Balance Tracking
  balance_before: number;      // User's credit balance before purchase
  balance_after: number;       // User's credit balance after purchase
  
  // Transaction Status
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: 'credit_card' | 'debit_card' | 'bank_transfer' | 'cash' | 'other';
  payment_reference: string;   // Optional: Bank reference, transaction ID
  
  // Timestamps
  purchase_date: string;       // ISO string
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Subscription Info (for monthly packages)
  is_subscription: boolean;
  subscription_id?: string;
  subscription_period_start?: string;  // ISO string
  subscription_period_end?: string;    // ISO string
  is_renewal?: boolean;       // True if this is an auto-renewal
  
  // Optional Metadata
  notes?: string;             // User-facing notes
  admin_notes?: string;       // Admin-only notes
  refund_reason?: string;     // Reason if status is 'refunded'
}
```

**Indexes Required:**
- `user_id` (ascending) + `createdAt` (descending) - for user purchase history queries
- `status` (ascending) + `createdAt` (descending) - for admin filtering

#### 2. `credit_transactions` (EXISTING - Enhanced)
Technical transaction log for credit operations.

**Enhanced Meta Fields:**
```typescript
meta: {
  purchase_type: string;      // Package type
  package_name: string;       // Package name
  amount_paid: number;        // Price in OMR
  payment_method: string;
  payment_reference: string;
  is_subscription: boolean;
  timestamp: number;
}
```

#### 3. `user_profiles` (EXISTING - Enhanced)
User credit profile with purchase tracking.

**New Fields:**
```typescript
{
  last_purchase_id: string;   // Most recent purchase ID
  // Existing fields:
  credit_balance: number;
  last_credit_op: string;
  last_credit_tx: string;
  // ...
}
```

## 🔧 API Functions

### 1. `purchaseCredits()` - Enhanced
Processes credit purchase with full transaction tracking.

```typescript
await firebaseService.purchaseCredits({
  userId: string;              // Required: User ID
  amount: number;              // Required: Credits to add
  packageType?: string;        // Package identifier ('starter', 'pro', etc.)
  packageName?: string;        // Display name "الاحترافي: 200 توليد"
  amountPaid?: number;         // Price in OMR
  paymentMethod?: string;      // Payment method used
  paymentReference?: string;   // Payment reference/transaction ID
  isSubscription?: boolean;    // Is this a subscription?
  subscriptionPeriod?: {       // Subscription validity period
    start: string;
    end: string;
  };
});

// Returns:
{
  new_balance: number;         // Updated credit balance
  transaction_id: string;      // Transaction ID
  purchase_id: string;         // Purchase history record ID
}
```

### 2. `getPurchaseHistory()` - New
Retrieves user's purchase history.

```typescript
const history = await firebaseService.getPurchaseHistory({
  userId: string;              // Required: User ID
  limit?: number;              // Optional: Max records (default: 50)
});

// Returns array of purchase records sorted by date (newest first)
```

## 📊 Purchase Information Tracked

### Essential Information
1. **Transaction Identification**
   - Unique purchase ID
   - Transaction ID (links to credit_transactions)
   - User ID

2. **Package Details**
   - Package type/category
   - Package name (localized)
   - Is it a subscription?

3. **Financial Data**
   - Amount paid (OMR)
   - Currency
   - Credits purchased

4. **Balance Tracking**
   - Balance before purchase
   - Balance after purchase
   - Net change (credits_purchased)

5. **Payment Information**
   - Payment method
   - Payment reference/ID
   - Transaction status

6. **Temporal Data**
   - Purchase date/time
   - Created timestamp
   - Updated timestamp
   - Subscription period (if applicable)

### Optional Metadata
- User notes
- Admin notes
- Refund reason (if refunded)
- Renewal flag (for subscriptions)

## 🎯 Usage Example

### User Makes a Purchase

```typescript
// User selects "Pro: 200 generations" package
const result = await firebaseService.purchaseCredits({
  userId: 'user123',
  amount: 2000,                    // 200 generations × 10 credits
  packageType: 'pro',
  packageName: 'الاحترافي: 200 توليد',
  amountPaid: 10,                  // 10 OMR
  paymentMethod: 'cash',
  isSubscription: false,
});

// System creates:
// 1. Purchase history record in purchase_history collection
// 2. Transaction record in credit_transactions collection
// 3. Updates user_profiles with new balance and references
```

### View Purchase History

```typescript
const history = await firebaseService.getPurchaseHistory({
  userId: 'user123',
  limit: 10  // Last 10 purchases
});

history.forEach(purchase => {
  console.log(`
    Date: ${purchase.purchase_date}
    Package: ${purchase.package_name}
    Paid: ${purchase.amount_paid} ${purchase.currency}
    Credits: ${purchase.credits_purchased}
    Balance: ${purchase.balance_before} → ${purchase.balance_after}
    Status: ${purchase.status}
  `);
});
```

## 🔐 Firestore Security Rules

Add these rules to protect purchase history:

```javascript
// Allow users to read their own purchase history
match /purchase_history/{purchaseId} {
  allow read: if request.auth != null 
    && resource.data.user_id == request.auth.uid;
  
  // Only server (admin SDK) can write
  allow write: if false;
}

// Allow users to read their own transactions
match /credit_transactions/{txId} {
  allow read: if request.auth != null 
    && resource.data.user_id == request.auth.uid;
  
  allow write: if false;
}
```

## 📈 Admin Features (Future)

### Suggested Admin Dashboard Queries

1. **Total Revenue**
```typescript
const allPurchases = await getDocs(
  query(collection(db, 'purchase_history'), 
    where('status', '==', 'completed'))
);
const totalRevenue = allPurchases.docs.reduce(
  (sum, doc) => sum + doc.data().amount_paid, 0
);
```

2. **Popular Packages**
```typescript
const packageCounts = {};
allPurchases.docs.forEach(doc => {
  const pkg = doc.data().package_type;
  packageCounts[pkg] = (packageCounts[pkg] || 0) + 1;
});
```

3. **Monthly Revenue Report**
```typescript
const startOfMonth = new Date();
startOfMonth.setDate(1);
startOfMonth.setHours(0, 0, 0, 0);

const monthlyPurchases = await getDocs(
  query(
    collection(db, 'purchase_history'),
    where('status', '==', 'completed'),
    where('createdAt', '>=', startOfMonth)
  )
);
```

## 🚀 Migration Notes

### Existing Users
- Old transactions in `credit_transactions` remain valid
- New purchases will create both transaction and purchase history records
- No data migration needed

### Backward Compatibility
- Old code using `purchaseCredits(userId, amount)` still works
- Optional parameters default to sensible values
- Purchase history is created automatically for all new purchases

## 📝 TODO / Future Enhancements

1. **Payment Gateway Integration**
   - Add actual payment processing
   - Store payment gateway transaction IDs
   - Handle payment callbacks

2. **Subscription Management**
   - Auto-renewal system
   - Subscription cancellation
   - Period tracking and expiry

3. **Refund System**
   - Refund processing
   - Credit reversal
   - Refund history tracking

4. **Analytics Dashboard**
   - Revenue reports
   - Popular package analytics
   - User spending patterns

5. **Export Features**
   - PDF receipt generation
   - Excel export for accounting
   - Tax reports

---

**Last Updated:** January 26, 2026
**Version:** 1.0
