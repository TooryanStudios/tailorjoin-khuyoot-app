import 'dotenv/config';
import { getFirestore } from '../server/tryon/firebaseAdmin.ts';

async function findAndDeleteBadTemplate() {
  const templateId = process.argv[2] || '05edf8015452191ade5684ab7435f7f8';
  
  try {
    const db = getFirestore();
    
    console.log(`🔍 Looking for template: ${templateId}`);
    
    const docRef = db.collection('tryon_garment_templates').doc(templateId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      console.log(`❌ Template not found in Firestore: ${templateId}`);
      
      // Search all templates
      console.log('\n📋 All templates in collection:');
      const all = await db.collection('tryon_garment_templates').get();
      all.docs.forEach(d => {
        const data = d.data();
        console.log(`  ${d.id}: ${data.name} - ${data.imageUrl?.substring(0, 60)}`);
      });
      
      return;
    }
    
    const data = doc.data();
    console.log('\n✅ Found template:');
    console.log(`  ID: ${templateId}`);
    console.log(`  Name: ${data?.name}`);
    console.log(`  imageUrl: ${data?.imageUrl}`);
    console.log(`  thumbnailUrl: ${data?.thumbnailUrl}`);
    console.log(`  enabled: ${data?.enabled}`);
    
    console.log('\n🗑️  Deleting template...');
    await docRef.delete();
    console.log('✅ Template deleted successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

findAndDeleteBadTemplate().then(() => {
  process.exit(0);
});
