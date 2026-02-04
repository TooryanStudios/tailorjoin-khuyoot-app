// Direct test of Thawani API with SINGULAR session
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
    success_url: 'https://example.com/success',
    cancel_url: 'https://example.com/cancel',
    metadata: {
        userId: 'test-user-123',
        packageName: 'Test'
    }
};

try {
    const response = await fetch(`${THAWANI_UAT_API_BASE}/api/v1/checkout/session`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'thawani-api-key': THAWANI_UAT_SECRET_KEY
        },
        body: JSON.stringify(payload)
    });

    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response body:', responseText);
} catch (error) {
    console.error('Fetch error:', error);
}
