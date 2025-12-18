// Script to clean up duplicate users created with wrong IDs
// Run with: node cleanup-duplicate-users.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // You need to download this from Firebase Console

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function cleanupDuplicateUsers() {
  try {
    console.log('Starting cleanup of duplicate users...\n');
    
    // Get all users from Auth
    const listUsersResult = await admin.auth().listUsers();
    const authUsers = listUsersResult.users;
    
    console.log(`Found ${authUsers.length} users in Firebase Auth\n`);
    
    // Get all sites and companies to know valid IDs
    const sitesSnapshot = await db.collection('sites').get();
    const companiesSnapshot = await db.collection('companies').get();
    
    const validSiteIds = new Set();
    const validCompanyIds = new Set();
    
    sitesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.id) {
        validSiteIds.add(data.id);
      }
      // Also add document ID as valid (for old sites)
      validSiteIds.add(doc.id);
    });
    
    companiesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.id) {
        validCompanyIds.add(data.id);
      }
      // Also add document ID as valid (for old companies)
      validCompanyIds.add(doc.id);
    });
    
    console.log(`Valid Site IDs: ${Array.from(validSiteIds).join(', ')}`);
    console.log(`Valid Company IDs: ${Array.from(validCompanyIds).join(', ')}\n`);
    
    let deletedCount = 0;
    let keptCount = 0;
    
    for (const user of authUsers) {
      const email = user.email;
      if (!email) continue;
      
      // Check if it's a site or company user
      if (email.includes('@site.local')) {
        const siteId = email.replace('@site.local', '');
        
        // Check if this is a valid site ID
        if (!validSiteIds.has(siteId)) {
          console.log(`❌ Deleting invalid site user: ${email} (siteId: ${siteId})`);
          try {
            await admin.auth().deleteUser(user.uid);
            await db.collection('users').doc(user.uid).delete().catch(() => null);
            deletedCount++;
          } catch (error) {
            console.error(`   Error deleting user ${email}:`, error.message);
          }
        } else {
          console.log(`✅ Keeping valid site user: ${email}`);
          keptCount++;
        }
      } else if (email.includes('@company.local')) {
        const companyId = email.replace('@company.local', '');
        
        // Check if this is a valid company ID
        if (!validCompanyIds.has(companyId)) {
          console.log(`❌ Deleting invalid company user: ${email} (companyId: ${companyId})`);
          try {
            await admin.auth().deleteUser(user.uid);
            await db.collection('users').doc(user.uid).delete().catch(() => null);
            deletedCount++;
          } catch (error) {
            console.error(`   Error deleting user ${email}:`, error.message);
          }
        } else {
          console.log(`✅ Keeping valid company user: ${email}`);
          keptCount++;
        }
      } else {
        // Not a site or company user, keep it
        console.log(`✅ Keeping other user: ${email}`);
        keptCount++;
      }
    }
    
    console.log(`\n✅ Cleanup complete!`);
    console.log(`   Deleted: ${deletedCount} invalid users`);
    console.log(`   Kept: ${keptCount} valid users`);
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Run cleanup
cleanupDuplicateUsers()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

