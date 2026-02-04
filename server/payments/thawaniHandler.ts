/**
 * Thawani Payment Integration (UAT Environment)
 * 
 * If you're getting "empty response" errors, the API keys below may be expired.
 * To get new keys:
 * 1. Log into https://uatcheckout.thawani.om
 * 2. Navigate to API Settings or Developer Settings
 * 3. Generate new UAT API keys
 * 4. Update the values below
 */

const THAWANI_UAT_SECRET_KEY = 'rRQ26GcsZzoEhbrP2HZvLYDbn9C9et';
const THAWANI_UAT_PUBLISHABLE_KEY = 'HGvTMLDssJghr9tlN9gr4DVYt0qyBy';
const THAWANI_UAT_API_BASE = 'https://uatcheckout.thawani.om';

/**
 * Creates a Thawani Checkout Session
 */
export async function createThawaniSession(reqBody: any) {
    console.log('[Thawani] Creating session with body:', JSON.stringify(reqBody, null, 2));
    
    const { userId, amount, packageName, successUrl, cancelUrl, metadata } = reqBody;

    if (!userId || !amount) {
        throw new Error('Missing required fields: userId or amount');
    }

    // Amount in Thawani is in small units (e.g. 1000 = 1 OMR)
    // The user's CREDIT_PACKAGES use OMR directly. 
    // We multiply by 1000 for OMR conversion.
    const amountInSmallUnits = Math.round(amount * 1000);

    // Ultra-conservative sanitization for legacy Sandbox engines
    const sanitizeThawaniId = (str: string) =>
        str ? str.replace(/[^a-zA-Z0-9]/g, '') : '';

    const payload = {
        // Embed userId in the ID so we don't need metadata (which often causes 400s)
        client_reference_id: `K${sanitizeThawaniId(userId).substring(0, 5)}${Date.now().toString().slice(-6)}`,
        mode: 'payment',
        products: [
            {
                name: 'Credits',
                unit_amount: amountInSmallUnits,
                quantity: 1
            }
        ],
        success_url: 'https://example.com/success', // Force HTTPS placeholders to rule out HTTP-rejection
        cancel_url: 'https://example.com/cancel'
    };

    console.log('[Thawani] Sending Ultra-Minimal Payload:', JSON.stringify(payload, null, 2));

    try {
        const response = await fetch(`${THAWANI_UAT_API_BASE}/api/v1/checkout/session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'thawani-api-key': THAWANI_UAT_SECRET_KEY
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        console.log('[Thawani] Response:', responseText);

        if (!response.ok) {
            const data = JSON.parse(responseText);
            throw new Error(data.description || data.message || `Thawani API error (${response.status})`);
        }

        const data = JSON.parse(responseText);
        
        return {
            session_id: data.data.session_id,
            checkout_url: `${THAWANI_UAT_API_BASE}/pay/${data.data.session_id}?key=${THAWANI_UAT_PUBLISHABLE_KEY}`
        };
    } catch (error: any) {
        console.error('[Thawani] Error creating session:', error.message);
        console.error('[Thawani] Full error:', error);
        throw error;
    }
}

import { fulfillPurchase } from '../services/paymentService';

/**
 * Webhook handler for Thawani payment success
 */
export async function handleThawaniWebhook(reqBody: any) {
    const { event_type, data } = reqBody;

    if (event_type !== 'checkout.cleared') {
        process.stdout.write(`[Thawani] Skipping event type: ${event_type}\n`);
        return { ok: true };
    }

    const { client_reference_id, metadata } = data;
    const userId = client_reference_id || metadata?.userId;
    const amountPaidOmr = data.total_amount / 1000;

    process.stdout.write(`[Thawani] Payment cleared for user ${userId}. Amount: ${amountPaidOmr} OMR\n`);

    if (userId) {
        // Credits to grant: Prefer metadata if set, otherwise 100 credits per 1 OMR
        const creditsToGrant = Number(metadata?.credits) || Math.round(amountPaidOmr * 100);
        
        try {
            await fulfillPurchase({
                userId,
                amount: creditsToGrant,
                packageName: metadata?.packageName || 'Thawani Package',
                amountPaid: amountPaidOmr,
                paymentMethod: 'thawani',
                paymentReference: data.session_id
            });
            return { ok: true };
        } catch (e) {
            console.error('[Thawani] Failed to grant credits:', e);
            throw e;
        }
    }

    return { ok: false, error: 'User ID missing' };
}
