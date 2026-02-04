// Test Thawani with SINGULAR 'session' instead of 'sessions'
const THAWANI_UAT_SECRET_KEY = 'rRQ26GcsZzoEhbrP2HZvLYDbn9C9et';

const urls = [
    'https://uatcheckout.thawani.om/api/v1/checkout/sessions',
    'https://uatcheckout.thawani.om/api/v1/checkout/session',
    'https://uatcheckout.thawani.om/checkout/session',
    'https://uatcheckout.thawani.om/api/v1/sessions'
];

for (const url of urls) {
    console.log(`\n--- Testing: ${url} ---`);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'thawani-api-key': THAWANI_UAT_SECRET_KEY
            },
            body: JSON.stringify({
                client_reference_id: 'test' + Date.now(),
                mode: 'payment',
                products: [{ name: 'Test', unit_amount: 100, quantity: 1 }],
                success_url: 'http://localhost:3000/success',
                cancel_url: 'http://localhost:3000/cancel'
            })
        });

        console.log('Status:', response.status, response.statusText);
        const text = await response.text();
        console.log('Body length:', text.length);
        if (text) {
            console.log('Body snippet:', text.substring(0, 100));
        }
    } catch (e) {
        console.log('Error:', e.message);
    }
}
