
const API_KEY = 'AIzaSyB_SsoGd22clhuuqKHPQ_eyEEB8-YHOJvI'; // From logs/env

async function testLogin(email, password, label) {
  console.log(`\nTesting ${label} login: ${email}...`);
  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
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
        console.log(`✅ SUCCESS: Logged in as ${data.email} (UID: ${data.localId})`);
    } else {
        console.log(`❌ FAILED (${response.status}): ${data.error?.message || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('Network/Fetch Error:', error);
  }
}

async function main() {
    // 1. Test Admin Account (should work)
    await testLogin('master.admin@khuyoot.app', 'T00ryan@rtz', 'Existing Admin');

    // 2. Test User Account with common dev passwords (might fail)
    await testLogin('arousalghabi@khuyoot.app', '123456', 'User (pwd: 123456)');
    await testLogin('arousalghabi@khuyoot.app', 'password', 'User (pwd: password)');
    await testLogin('arousalghabi@khuyoot.app', 'khuyoot123', 'User (pwd: khuyoot123)');
}

main();
