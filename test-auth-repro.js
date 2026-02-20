
const API_KEY = 'AIzaSyB_SsoGd22clhuuqKHPQ_eyEEB8-YHOJvI'; // From logs/env
const EMAIL = 'arousalghabi@khuyoot.app'; // From logs
const PASSWORD = 'password123'; // Placeholder, will likely fail with INVALID_PASSWORD if user exists, or EMAIL_NOT_FOUND

async function testAuth() {
  console.log('Testing authentication with REST API...');
  console.log(`URL: https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY.substring(0, 10)}...`);

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: EMAIL,
          password: PASSWORD,
          returnSecureToken: true,
        }),
      }
    );

    const data = await response.json();
    
    console.log('Status:', response.status);
    console.log('Response Body:', JSON.stringify(data, null, 2));

    if (!response.ok) {
        if (data.error && data.error.message) {
            console.log('\n--- DIAGNOSIS ---');
            const msg = data.error.message;
            if (msg === 'EMAIL_NOT_FOUND') console.log('✅ API Key works. User does not exist.');
            else if (msg === 'INVALID_PASSWORD' || msg === 'INVALID_LOGIN_CREDENTIALS') console.log('✅ API Key works. Password incorrect (Expected if we guessed password).');
            else if (msg === 'USER_DISABLED') console.log('⚠️ User account is disabled.');
            else if (msg.includes('TOO_MANY_ATTEMPTS')) console.log('⚠️ Rate limited. Too many failed attempts.');
            else if (msg === 'Ip blocked') console.log('⚠️ IP address is blocked by Firebase/Google.');
            else console.log('❌ Unexpected error message.');
        } else {
            console.log('❌ Unknown error format.');
        }
    } else {
        console.log('✅ Login SUCCESS (Unexpected with dummy password)');
    }

  } catch (error) {
    console.error('Network/Fetch Error:', error);
  }
}

testAuth();
