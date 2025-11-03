const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'sekreterlik-app/server/database.sqlite');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('Connected to SQLite database');
});

// Function to fix excuse reasons
function fixExcuseReasons() {
  console.log('🔍 Mevcut toplantıları kontrol ediyorum...');
  
  // Get all meetings
  db.all('SELECT id, name, attendees FROM meetings', [], (err, meetings) => {
    if (err) {
      console.error('Error fetching meetings:', err.message);
      return;
    }
    
    console.log(`📊 Toplam ${meetings.length} toplantı bulundu`);
    
    let updatedCount = 0;
    let processedCount = 0;
    
    meetings.forEach((meeting, index) => {
      try {
        const attendees = JSON.parse(meeting.attendees || '[]');
        let hasChanges = false;
        
        // Check each attendee
        attendees.forEach(attendee => {
          // If hasExcuse is true and reason is "Katılmadı", change to "Bilinmiyor"
          if (attendee.excuse && attendee.excuse.hasExcuse && attendee.excuse.reason === 'Katılmadı') {
            attendee.excuse.reason = 'Bilinmiyor';
            hasChanges = true;
            console.log(`  ✅ ${meeting.name} - Üye ID ${attendee.memberId}: "Katılmadı" → "Bilinmiyor"`);
          }
        });
        
        // Update database if there are changes
        if (hasChanges) {
          const updatedAttendees = JSON.stringify(attendees);
          
          db.run(
            'UPDATE meetings SET attendees = ? WHERE id = ?',
            [updatedAttendees, meeting.id],
            function(err) {
              if (err) {
                console.error(`❌ Error updating meeting ${meeting.id}:`, err.message);
              } else {
                updatedCount++;
                console.log(`  🔄 Toplantı güncellendi: ${meeting.name} (ID: ${meeting.id})`);
              }
              
              processedCount++;
              if (processedCount === meetings.length) {
                console.log(`\n🎉 İşlem tamamlandı!`);
                console.log(`📈 Güncellenen toplantı sayısı: ${updatedCount}`);
                console.log(`📊 Toplam işlenen toplantı: ${processedCount}`);
                
                // Close database connection
                db.close((err) => {
                  if (err) {
                    console.error('Error closing database:', err.message);
                  } else {
                    console.log('Database connection closed');
                  }
                });
              }
            }
          );
        } else {
          processedCount++;
          console.log(`  ⏭️  Değişiklik gerekmiyor: ${meeting.name}`);
          
          if (processedCount === meetings.length) {
            console.log(`\n🎉 İşlem tamamlandı!`);
            console.log(`📈 Güncellenen toplantı sayısı: ${updatedCount}`);
            console.log(`📊 Toplam işlenen toplantı: ${processedCount}`);
            
            // Close database connection
            db.close((err) => {
              if (err) {
                console.error('Error closing database:', err.message);
              } else {
                console.log('Database connection closed');
              }
            });
          }
        }
      } catch (error) {
        console.error(`❌ Error processing meeting ${meeting.id}:`, error.message);
        processedCount++;
        
        if (processedCount === meetings.length) {
          console.log(`\n🎉 İşlem tamamlandı!`);
          console.log(`📈 Güncellenen toplantı sayısı: ${updatedCount}`);
          console.log(`📊 Toplam işlenen toplantı: ${processedCount}`);
          
          // Close database connection
          db.close((err) => {
            if (err) {
              console.error('Error closing database:', err.message);
            } else {
              console.log('Database connection closed');
            }
          });
        }
      }
    });
  });
}

// Start the fix process
console.log('🚀 Mazeret sebeplerini düzeltme işlemi başlatılıyor...\n');
fixExcuseReasons();
