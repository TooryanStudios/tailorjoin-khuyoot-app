
const API_KEY = 'AIzaSyB_SsoGd22clhuuqKHPQ_eyEEB8-YHOJvI';

async function createUser(email, password) {
  console.log(`\nAttempting to create user: ${email}...`);
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          password: password,
          returnSecureToken: true,
        }),
      }
    );

    const data = await response.json();
    
    if (response.ok) {
        console.log(`✅ SUCCESS: Created user ${data.email} (UID: ${data.localId})`);
        console.log(`🔑 Password is now set to: ${password}`);
    } else {
        console.log(`❌ FAILED (${response.status}): ${data.error?.message || 'Unknown error'}`);
        if (data.error?.message === 'EMAIL_EXISTS') {
            console.log('ℹ️ User already exists. The login failure is due to incorrect password.');
        }
    }

  } catch (error) {
    console.error('Network/Fetch Error:', error);
  }
}

createUser('arousalghabi@khuyoot.app', 'password123');
