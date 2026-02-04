import 'dotenv/config';
import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';

type Args = {
  email?: string;
  password?: string;
  serviceAccountFile?: string;
};

// Simple arg parser
function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--email' || a === '-e') {
      out.email = argv[i + 1];
      i++;
      continue;
    }
    if (a === '--password' || a === '-p') {
      out.password = argv[i + 1];
      i++;
      continue;
    }
    if (a === '--serviceAccountFile' || a === '-f') {
      out.serviceAccountFile = argv[i + 1];
      i++;
      continue;
    }
  }
  return out;
}

function initAdmin(args: Args): void {
  if (admin.apps.length > 0) return;

  let serviceAccount: any;
  if (args.serviceAccountFile) {
    try {
      const raw = readFileSync(args.serviceAccountFile, 'utf8');
      serviceAccount = JSON.parse(raw);
      console.log(`✅ Loaded service account from ${args.serviceAccountFile}`);
    } catch (e: any) {
      console.error(`❌ Failed to read service account file: ${e.message}`);
      process.exit(1);
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      console.log('✅ Loaded service account from FIREBASE_SERVICE_ACCOUNT_JSON env var');
    } catch (e: any) {
      console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON env var');
      process.exit(1);
    }
  } else {
    console.error('❌ No service account provided. Use --serviceAccountFile or set FIREBASE_SERVICE_ACCOUNT_JSON.');
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.email || !args.password) {
    console.error('Usage: tsx scripts/createTestUser.ts --email <email> --password <password> [--serviceAccountFile <path>]');
    process.exit(1);
  }

  initAdmin(args);
  const auth = admin.auth();

  try {
    console.log(`🔍 Checking if user ${args.email} exists...`);
    try {
      const user = await auth.getUserByEmail(args.email);
      console.log(`👤 User found (uid: ${user.uid}). Updating password...`);
      await auth.updateUser(user.uid, {
        password: args.password,
        emailVerified: true,
        disabled: false
      });
      console.log('✅ Password updated successfully.');
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        console.log(`👤 User not found. Creating new user...`);
        const user = await auth.createUser({
          email: args.email,
          password: args.password,
          emailVerified: true,
          disabled: false
        });
        console.log(`✅ User created successfully (uid: ${user.uid}).`);
      } else {
        throw e;
      }
    }
  } catch (error: any) {
    console.error('❌ Operation failed:', error.message);
    process.exit(1);
  }
}

main();
