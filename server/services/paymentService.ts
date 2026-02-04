import admin from 'firebase-admin';
import { getFirestore } from '../tryon/firebaseAdmin';

/**
 * Atomic credit fulfillment service (Server-side)
 * This replicates the logic of the client-side purchaseCredits but uses Admin SDK.
 */
export async function fulfillPurchase(params: {
    userId: string;
    amount: number;
    packageName: string;
    paymentMethod: string;
    paymentReference: string;
    amountPaid: number;
}) {
    const db = getFirestore();
    const { userId, amount, packageName, paymentMethod, paymentReference, amountPaid } = params;

    const profileRef = db.collection('user_profiles').doc(userId);
    const txRef = db.collection('credit_transactions').doc();
    const purchaseRef = db.collection('purchase_history').doc();

    const result = await db.runTransaction(async (tx) => {
        const profileSnap = await tx.get(profileRef);
        const currentData = profileSnap.data() || {};
        const currentBalance = currentData.credit_balance || 0;
        const newBalance = currentBalance + amount;

        // 1. Log Credit Transaction
        tx.set(txRef, {
            transaction_id: txRef.id,
            user_id: userId,
            amount: amount,
            action_type: 'purchase',
            status: 'completed',
            meta: {
                purchase_type: 'credit_package',
                package_name: packageName,
                amount_paid: amountPaid,
                payment_method: paymentMethod,
                payment_reference: paymentReference,
                timestamp: Date.now(),
            },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 2. Log Purchase History (detailed record)
        tx.set(purchaseRef, {
            purchase_id: purchaseRef.id,
            transaction_id: txRef.id,
            user_id: userId,
            package_name: packageName,
            amount_paid: amountPaid,
            currency: 'OMR',
            credits_purchased: amount,
            balance_before: currentBalance,
            balance_after: newBalance,
            status: 'completed',
            payment_method: paymentMethod,
            payment_reference: paymentReference,
            purchase_date: new Date().toISOString(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 3. Update User Profile
        if (profileSnap.exists) {
            tx.update(profileRef, {
                credit_balance: newBalance,
                last_credit_op: 'purchase',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        } else {
            tx.set(profileRef, {
                user_id: userId,
                credit_balance: newBalance,
                last_credit_op: 'purchase',
                tier: 'Free',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }

        return { newBalance, transactionId: txRef.id };
    });

    return result;
}
