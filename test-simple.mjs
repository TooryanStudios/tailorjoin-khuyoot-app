// Direct test with more detailed output
const THAWANI_UAT_SECRET_KEY = 'rRQ26GcsZzoEhbrP2HZvLYDbn9C9et';

console.log('Testing Thawani at: https://uatcheckout.thawani.om/api/v1/checkout/sessions');
console.log('API Key:', THAWANI_UAT_SECRET_KEY.substring(0, 10) + '...');

const payload = {
    client_reference_id: 'test123',
    mode: 'payment',
    products: [{
        name: 'Test',
        unit_amount: 100,
        quantity: 1
    }],
    success_url: 'http://localhost:3000/success',
    cancel_url: 'http://localhost:3000/cancel'
};

console.log('\nRequest payload:', JSON.stringify(payload, null, 2));

const response = await fetch('https://uatcheckout.thawani.om/api/v1/checkout/sessions', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'thawani-api-key': THAWANI_UAT_SECRET_KEY
    },
    body: JSON.stringify(payload)
});

console.log('\nStatus:', response.status, response.statusText);
const text = await response.text();
console.log('Response body length:', text.length);
console.log('Response body:', text || '(empty)');

if (text) {
    try {
        const json = JSON.parse(text);
        console.log('\nParsed:', JSON.stringify(json, null, 2));
    } catch (e) {
        console.log('\nNot valid JSON');
    }
}
