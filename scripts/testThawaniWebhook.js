/**
 * TEST SCRIPT: Simulate Thawani Webhook
 * Run this to grant credits to a specific user locally.
 */
async function simulatePayment(userId, credits = 100) {
    const payload = {
        event_type: 'checkout.cleared',
        data: {
            session_id: 'test_session_' + Date.now(),
            client_reference_id: userId,
            total_amount: (credits / 100) * 1000, // 1 OMR = 100 credits
            metadata: {
                userId: userId,
                credits: credits,
                packageName: 'Test Package'
            }
        }
    };

    console.log(`Simulating payment for user: ${userId}...`);
    
    try {
        const resp = await fetch('http://localhost:8788/api/payments/thawani/webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const result = await resp.json();
        console.log('Result:', result);
    } catch (e) {
        console.error('Failed to simulate payment:', e.message);
    }
}

// USAGE: 
// Copy your UID from the Designer HUD (top left) and run:
// simulatePayment('YOUR_UID_HERE', 500);
console.log('Test script loaded. Use simulatePayment(uid, credits) in console.');
