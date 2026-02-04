
const userId = 'boc0OgXi2oaPu4JEqpGNAv7A28x2';
const credits = 500;

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

fetch('http://localhost:8788/api/payments/thawani/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
})
.then(resp => resp.json())
.then(result => {
    console.log('Success!', result);
})
.catch(e => {
    console.error('Failed to simulate payment:', e.message);
});
