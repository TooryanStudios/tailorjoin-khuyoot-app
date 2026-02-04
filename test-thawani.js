// Quick test to see if Thawani API is accessible
const THAWANI_UAT_SECRET_KEY = 'rRQ26GcsZzoEhbrP2HZvLYDbn9C9et';
const THAWANI_UAT_API_BASE = 'https://uatcheckout.thawani.om';

const payload = {
    client_reference_id: 'test-user-123',
    products: [
        {
            name: 'Test Pack',
            unit_amount: 100, // 0.1 OMR
            quantity: 1
        }
    ],
    success_url: 'http://localhost:3000/success',
    cancel_url: 'http://localhost:3000/cancel',
    metadata: {
        userId: 'test-user-123',
        packageName: 'Test'
    }
};

console.log('Testing Thawani API connection...');
console.log('Payload:', JSON.stringify(payload, null, 2));

fetch(`${THAWANI_UAT_API_BASE}/api/v1/checkout/sessions`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'thawani-api-key': THAWANI_UAT_SECRET_KEY
    },
    body: JSON.stringify(payload)
})
.then(async (response) => {
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    if (!response.ok) {
        console.error('ERROR: API call failed');
    } else {
        console.log('SUCCESS: Session created');
    }
})
.catch((error) => {
    console.error('FETCH ERROR:', error.message);
    console.error('Error stack:', error.stack);
});
