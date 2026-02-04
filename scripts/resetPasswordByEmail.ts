import 'dotenv/config';
import admin from 'firebase-admin';
import { readFileSync } from 'node:fs';

type Args = {
  email?: string;
  password?: string;
  serviceAccountFile?: string;
};

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
    if (a === '--serviceAccountFile' || a === '--service-account-file' || a === '-f') {
      out.serviceAccountFile = argv[i + 1];
      i++;
      continue;
    }
  }
  return out;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}. Set it in .env or .env.local.`);
  return v;
}

function readServiceAccountFromFile(filePath: string): any {
  const raw = readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e: any) {
    throw new Error(`Service account file is not valid JSON: ${e?.message || e}`);
  }
}

function initAdmin(args: Args): void {
  if (admin.apps.length > 0) return;

  let serviceAccount: any;
  if (args.serviceAccountFile) {
    serviceAccount = readServiceAccountFromFile(args.serviceAccountFile);
  } else {
    const json = requireEnv('FIREBASE_SERVICE_ACCOUNT_JSON');
    try {
      serviceAccount = JSON.parse(json);
    } catch (e: any) {
      throw new Error(`FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON: ${e?.message || e}`);
    }
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { email, password } = args;

  if (!email) {
    throw new Error(
      'Missing --email. Example: npm run admin:reset-password -- --email admin@test.com --password "NewStrongPassword" --serviceAccountFile "C:/path/serviceAccount.json"'
    );
  }
  if (!password) {
    throw new Error(
      'Missing --password. Example: npm run admin:reset-password -- --email admin@test.com --password "NewStrongPassword" --serviceAccountFile "C:/path/serviceAccount.json"'
    );
  }
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }

  initAdmin(args);

  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().updateUser(user.uid, { password });

  // Do not print the password.
  // Print just enough for confirmation.
  // eslint-disable-next-line no-console
  console.log(`✅ Password updated for ${email} (uid=${user.uid})`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('❌ Reset password failed:', err?.message || err);
  process.exit(1);
});
