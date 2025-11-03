/**
 * Script to clean up member_users for deleted/archived members
 * and create missing member_users for active members
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { encryptField, decryptField } = require('../utils/crypto');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const MemberUser = require('../models/MemberUser');

async function cleanupMemberUsers() {
  console.log('Starting member_users cleanup...\n');

  try {
    // 1. Delete member_users for deleted/archived members
    console.log('1. Deleting member_users for deleted/archived members...');
    const orphanedUsers = await new Promise((resolve, reject) => {
      db.all(`
        SELECT mu.*, m.id as member_exists, m.archived
        FROM member_users mu
        LEFT JOIN members m ON mu.member_id = m.id
        WHERE mu.member_id IS NOT NULL
          AND (m.id IS NULL OR m.archived = 1)
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    let deletedCount = 0;
    for (const user of orphanedUsers) {
      try {
        await MemberUser.deleteUser(user.id);
        deletedCount++;
        console.log(`  - Deleted member_user ID ${user.id} for missing/archived member ID ${user.member_id}`);
      } catch (error) {
        console.error(`  - Error deleting member_user ID ${user.id}:`, error.message);
      }
    }
    console.log(`  ✓ Deleted ${deletedCount} orphaned member_users\n`);

    // 2. Create missing member_users for active members
    console.log('2. Creating missing member_users for active members...');
    const membersWithoutUsers = await new Promise((resolve, reject) => {
      db.all(`
        SELECT m.id, m.tc, m.phone
        FROM members m
        LEFT JOIN member_users mu ON mu.member_id = m.id
        WHERE m.archived = 0
          AND mu.id IS NULL
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    let createdCount = 0;
    for (const member of membersWithoutUsers) {
      try {
        const tc = decryptField(member.tc);
        const phone = decryptField(member.phone);
        const username = tc;
        const password = phone.replace(/\D/g, ''); // Normalize password
        
        // Check if username already exists (skip if username is already taken by another user)
        const existingUser = await new Promise((resolve, reject) => {
          db.get('SELECT * FROM member_users WHERE username = ? AND (member_id IS NULL OR member_id != ?)', [username, member.id], (err, row) => {
            if (err) reject(err);
            else resolve(row);
          });
        });

        if (!existingUser) {
          await MemberUser.createMemberUser(member.id, username, password);
          createdCount++;
          console.log(`  - Created member_user for member ID ${member.id} (username: ${username})`);
        } else {
          console.log(`  - Skipped member ID ${member.id} - username ${username} already exists`);
        }
      } catch (error) {
        console.error(`  - Error creating member_user for member ID ${member.id}:`, error.message);
      }
    }
    console.log(`  ✓ Created ${createdCount} missing member_users\n`);

    // 3. Create missing member_users for town presidents
    console.log('3. Creating missing member_users for town presidents...');
    const townsWithoutUsers = await new Promise((resolve, reject) => {
      db.all(`
        SELECT t.id as town_id, t.name as town_name, 
               to_chair.chairman_name, to_chair.chairman_phone
        FROM towns t
        INNER JOIN town_officials to_chair ON t.id = to_chair.town_id
        LEFT JOIN member_users mu ON mu.town_id = t.id AND mu.user_type = 'town_president'
        WHERE to_chair.chairman_name IS NOT NULL 
          AND to_chair.chairman_phone IS NOT NULL
          AND mu.id IS NULL
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    let createdTownUsersCount = 0;
    for (const town of townsWithoutUsers) {
      try {
        await MemberUser.createTownPresidentUser(
          town.town_id,
          town.town_name,
          town.chairman_name,
          town.chairman_phone
        );
        createdTownUsersCount++;
        console.log(`  - Created town president user for town ID ${town.town_id} (${town.town_name})`);
      } catch (error) {
        console.error(`  - Error creating town president user for town ID ${town.town_id}:`, error.message);
      }
    }
    console.log(`  ✓ Created ${createdTownUsersCount} missing town president users\n`);

    console.log('Cleanup completed successfully!');
    console.log(`Summary:`);
    console.log(`  - Deleted ${deletedCount} orphaned member_users`);
    console.log(`  - Created ${createdCount} missing member_users for members`);
    console.log(`  - Created ${createdTownUsersCount} missing town president users`);

  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Run cleanup
cleanupMemberUsers()
  .then(() => {
    console.log('\nScript completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nScript failed:', error);
    process.exit(1);
  });

