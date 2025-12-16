// Field Agent Script - Authorize New Tailor for Registration
// Run with: node scripts/authorize-tailor.js

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const db = admin.firestore();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function authorizeNewTailor() {
  console.log('\n🔐 Khuyoot - Field Agent Authorization Tool\n');
  console.log('This tool creates a pre-authorized UID for tailor registration.\n');
  
  try {
    // Collect tailor information
    const tailorName = await question('Tailor Name (Arabic): ');
    const shopName = await question('Shop Name (Arabic): ');
    const phone = await question('Phone (+968XXXXXXXX): ');
    const region = await question('Region (e.g., مسقط, صحار): ');
    const notes = await question('Notes (optional): ');
    
    // Validate phone format
    if (!phone.match(/^\+968\d{8}$/)) {
      console.error('❌ Invalid phone format. Must be +968XXXXXXXX');
      rl.close();
      return;
    }
    
    // Generate new UID
    const uid = db.collection('users').doc().id;
    
    // Create allowlist document
    await db.collection('system').doc('allowedUids').collection('uids').doc(uid).set({
      enabled: true,
      createdBy: 'field-agent',
      createdAt: admin.firestore.Timestamp.now(),
      tailorName: tailorName || 'N/A',
      shopName: shopName || 'N/A',
      phone: phone,
      region: region || 'N/A',
      notes: notes || '',
      used: false // Track if UID has been used
    });
    
    console.log('\n✅ Authorization successful!\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📋 AUTHORIZED UID: ${uid}`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n📱 Instructions for Tailor:');
    console.log('1. Open registration form on tablet/phone');
    console.log('2. Enter this UID in the "Registration Code" field');
    console.log(`3. UID: ${uid}`);
    console.log('4. Complete registration form\n');
    
    // Option to create another
    const another = await question('Authorize another tailor? (y/n): ');
    if (another.toLowerCase() === 'y') {
      await authorizeNewTailor();
    } else {
      rl.close();
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    rl.close();
  }
}

// List existing authorized UIDs
async function listAuthorizedUIDs() {
  console.log('\n📋 Authorized UIDs:\n');
  
  const snapshot = await db.collection('system').doc('allowedUids').collection('uids')
    .where('enabled', '==', true)
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get();
  
  if (snapshot.empty) {
    console.log('No authorized UIDs found.');
    return;
  }
  
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log('─────────────────────────────────────────────');
    console.log(`UID: ${doc.id}`);
    console.log(`Tailor: ${data.tailorName}`);
    console.log(`Shop: ${data.shopName}`);
    console.log(`Phone: ${data.phone}`);
    console.log(`Region: ${data.region}`);
    console.log(`Used: ${data.used ? '✅ Yes' : '❌ No'}`);
    console.log(`Created: ${data.createdAt.toDate().toLocaleString()}`);
  });
  console.log('─────────────────────────────────────────────\n');
}

// Disable a UID
async function disableUID() {
  const uid = await question('Enter UID to disable: ');
  
  try {
    await db.collection('system').doc('allowedUids').collection('uids').doc(uid).update({
      enabled: false,
      disabledAt: admin.firestore.Timestamp.now()
    });
    console.log(`✅ UID ${uid} has been disabled.\n`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Main menu
async function mainMenu() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🔐 Khuyoot Field Agent Tool');
  console.log('═══════════════════════════════════════════════════════');
  console.log('1. Authorize New Tailor');
  console.log('2. List Authorized UIDs');
  console.log('3. Disable UID');
  console.log('4. Exit');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const choice = await question('Select option (1-4): ');
  
  switch (choice) {
    case '1':
      await authorizeNewTailor();
      break;
    case '2':
      await listAuthorizedUIDs();
      await mainMenu();
      break;
    case '3':
      await disableUID();
      await mainMenu();
      break;
    case '4':
      console.log('👋 Goodbye!\n');
      rl.close();
      break;
    default:
      console.log('❌ Invalid option. Try again.\n');
      await mainMenu();
  }
}

// Start
mainMenu();
