// Quick test of REST auth API
const API_KEY = 'AIzaSyB_SsoGd22clhuuqKHPQ_eyEEB8-YHOJvI';
const email = 'diag_user_01@test.com';
const password = 'TestPass@123';

console.log('Testing Firebase Auth REST API...');
console.log('Email:', email);
console.log('Password:', password.substring(0, 3) + '***');

fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email,
    password,
    returnSecureToken: true,
  }),
})
  .then(async (response) => {
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('✅ SUCCESS!');
      console.log('UID:', data.localId);
      console.log('Email:', data.email);
      console.log('Token:', data.idToken.substring(0, 50) + '...');
    } else {
      console.log('❌ FAILED');
      console.log('Error:', data.error?.message);
    }
  })
  .catch((error) => {
    console.error('❌ Network error:', error);
  });
