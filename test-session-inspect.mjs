// Direct test of Thawani API with session retrieval
const THAWANI_UAT_SECRET_KEY = 'rRQ26GcsZzoEhbrP2HZvLYDbn9C9et';
const THAWANI_UAT_API_BASE = 'https://uatcheckout.thawani.om';

async function test() {
    const payload = {
        client_reference_id: 'test-user-' + Date.now(),
        mode: 'payment',
        products: [
            {
                name: 'Test Product',
                unit_amount: 1000, // 1 OMR
                quantity: 1
            }
        ],
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
        metadata: {
            userId: 'test-user-123'
        }
    };

    console.log('--- Creating Session ---');
    const createResp = await fetch(`${THAWANI_UAT_API_BASE}/api/v1/checkout/session`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'thawani-api-key': THAWANI_UAT_SECRET_KEY
        },
        body: JSON.stringify(payload)
    });

    const createData = await createResp.json();
    console.log('Create Response:', JSON.stringify(createData, null, 2));

    if (createData.success && createData.data && createData.data.session_id) {
        const sessionId = createData.data.session_id;
        console.log('\n--- Retrieving Session ---');
        const getResp = await fetch(`${THAWANI_UAT_API_BASE}/api/v1/checkout/session/${sessionId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'thawani-api-key': THAWANI_UAT_SECRET_KEY
            }
        });

        const getData = await getResp.json();
        console.log('Retrieve Response:', JSON.stringify(getData, null, 2));
    }
}

test().catch(console.error);
