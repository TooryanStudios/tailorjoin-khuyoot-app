import 'dotenv/config';
import { getAuth } from '../server/tryon/firebaseAdmin.ts';

async function checkAuth(email: string) {
  const auth = getAuth();
  
  try {
    const userRecord = await auth.getUserByEmail(email);
    console.log(`✅ Found user in Auth:`);
    console.log(`   UID: ${userRecord.uid}`);
    console.log(`   Email: ${userRecord.email}`);
    console.log(`   DisplayName: ${userRecord.displayName}`);
    console.log(`   CustomClaims: ${JSON.stringify(userRecord.customClaims)}`);
  } catch (error) {
    console.error(`❌ User not found in Auth: ${email}`);
  }
}

const email = process.argv[2] || 'master.admin@khuyoot.app';
checkAuth(email).catch(console.error);
