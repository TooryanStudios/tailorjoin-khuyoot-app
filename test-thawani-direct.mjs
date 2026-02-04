// Direct test of Thawani API
const THAWANI_UAT_SECRET_KEY = 'rRQ26GcsZzoEhbrP2HZvLYDbn9C9et';
const THAWANI_UAT_API_BASE = 'https://uatcheckout.thawani.om';

const payload = {
    client_reference_id: 'test-user-123',
    products: [
        {
            name: 'Test Pack',
            unit_amount: 100,
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

console.log('=== Testing Thawani API ===');
console.log('Payload:', JSON.stringify(payload, null, 2));
console.log('');

try {
    const response = await fetch(`${THAWANI_UAT_API_BASE}/api/v1/checkout/sessions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'thawani-api-key': THAWANI_UAT_SECRET_KEY
        },
        body: JSON.stringify(payload)
    });

    console.log('Response status:', response.status);
    console.log('Response statusText:', response.statusText);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('');

    const responseText = await response.text();
    console.log('Raw response body:');
    console.log('---START---');
    console.log(responseText);
    console.log('---END---');
    console.log('');
    console.log('Response length:', responseText.length);
    console.log('First 500 chars:', responseText.substring(0, 500));

    try {
        const data = JSON.parse(responseText);
        console.log('\nParsed JSON:');
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('\nFailed to parse as JSON:', e.message);
    }
} catch (error) {
    console.error('Fetch error:', error);
}
