const db = require('../config/database');
const { collections } = require('../config/database');

class VisitController {
  // Increment visit count for a location
  static async incrementVisit(locationType, locationId) {
    try {
      const tableName = `${locationType}_visits`;
      const idColumn = `${locationType}_id`;
      
      // Check if visit record exists
      const existingVisit = await db.get(
        `SELECT * FROM ${tableName} WHERE ${idColumn} = ?`,
        [locationId]
      );
      
      if (existingVisit) {
        // Update existing record
        await db.run(
          `UPDATE ${tableName} 
           SET visit_count = visit_count + 1, 
               last_visit_date = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE ${idColumn} = ?`,
          [locationId]
        );
        
        // Update in-memory collection
        const collectionIndex = collections[tableName].findIndex(item => item[`${locationType}_id`] === locationId);
        if (collectionIndex !== -1) {
          collections[tableName][collectionIndex].visit_count += 1;
          collections[tableName][collectionIndex].last_visit_date = new Date().toISOString();
          collections[tableName][collectionIndex].updated_at = new Date().toISOString();
        }
        
        return { success: true, visitCount: existingVisit.visit_count + 1 };
      } else {
        // Create new record
        const result = await db.run(
          `INSERT INTO ${tableName} (${idColumn}, visit_count, last_visit_date) 
           VALUES (?, 1, CURRENT_TIMESTAMP)`,
          [locationId]
        );
        
        // Add to in-memory collection
        const newVisit = {
          id: result.lastID,
          [`${locationType}_id`]: locationId,
          visit_count: 1,
          last_visit_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        collections[tableName].push(newVisit);
        
        return { success: true, visitCount: 1 };
      }
    } catch (error) {
      console.error(`Error incrementing visit for ${locationType}:`, error);
      throw error;
    }
  }

  // Get visit count for a location
  static async getVisitCount(locationType, locationId) {
    try {
      const tableName = `${locationType}_visits`;
      const idColumn = `${locationType}_id`;
      
      const visit = await db.get(
        `SELECT * FROM ${tableName} WHERE ${idColumn} = ?`,
        [locationId]
      );
      
      return visit ? visit.visit_count : 0;
    } catch (error) {
      console.error(`Error getting visit count for ${locationType}:`, error);
      throw error;
    }
  }

  // Get all visit counts for a location type
  static async getAllVisitCounts(locationType) {
    try {
      const tableName = `${locationType}_visits`;
      const locationTable = locationType === 'event' ? 'events' : `${locationType}s`;
      
      const visits = await db.all(
        `SELECT v.*, l.name as location_name 
         FROM ${tableName} v 
         LEFT JOIN ${locationTable} l ON v.${locationType}_id = l.id 
         ORDER BY v.visit_count DESC`
      );
      
      return visits;
    } catch (error) {
      console.error(`Error getting all visit counts for ${locationType}:`, error);
      throw error;
    }
  }

  // Reset visit count for a location
  static async resetVisitCount(locationType, locationId) {
    try {
      const tableName = `${locationType}_visits`;
      const idColumn = `${locationType}_id`;
      
      await db.run(
        `UPDATE ${tableName} 
         SET visit_count = 0, 
             last_visit_date = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE ${idColumn} = ?`,
        [locationId]
      );
      
      // Update in-memory collection
      const collectionIndex = collections[tableName].findIndex(item => item[`${locationType}_id`] === locationId);
      if (collectionIndex !== -1) {
        collections[tableName][collectionIndex].visit_count = 0;
        collections[tableName][collectionIndex].last_visit_date = null;
        collections[tableName][collectionIndex].updated_at = new Date().toISOString();
      }
      
      return { success: true };
    } catch (error) {
      console.error(`Error resetting visit count for ${locationType}:`, error);
      throw error;
    }
  }

  // Decrement visit count for a location
  static async decrementVisit(locationType, locationId) {
    try {
      const tableName = `${locationType}_visits`;
      const idColumn = `${locationType}_id`;
      
      // Check if visit record exists
      const existingVisit = await db.get(
        `SELECT * FROM ${tableName} WHERE ${idColumn} = ?`,
        [locationId]
      );
      
      if (existingVisit && existingVisit.visit_count > 0) {
        // Update existing record (don't go below 0)
        const newCount = Math.max(0, existingVisit.visit_count - 1);
        await db.run(
          `UPDATE ${tableName} 
           SET visit_count = ?, 
               updated_at = CURRENT_TIMESTAMP
           WHERE ${idColumn} = ?`,
          [newCount, locationId]
        );
        
        // Update in-memory collection
        const collectionIndex = collections[tableName].findIndex(item => item[`${locationType}_id`] === locationId);
        if (collectionIndex !== -1) {
          collections[tableName][collectionIndex].visit_count = newCount;
          collections[tableName][collectionIndex].updated_at = new Date().toISOString();
        }
        
        return { success: true, visitCount: newCount };
      }
      
      return { success: true, visitCount: 0 };
    } catch (error) {
      console.error(`Error decrementing visit for ${locationType}:`, error);
      throw error;
    }
  }

  // Process event locations and increment visit counts
  static async processEventLocations(eventId, selectedLocationTypes, selectedLocations) {
    try {
      const results = [];
      
      for (const locationType of selectedLocationTypes) {
        const locationIds = selectedLocations[locationType];
        if (locationIds && Array.isArray(locationIds)) {
          for (const locationId of locationIds) {
            const result = await this.incrementVisit(locationType, locationId);
            results.push({
              locationType,
              locationId,
              visitCount: result.visitCount
            });
          }
        }
      }
      
      // Also increment event visit count
      const eventResult = await this.incrementVisit('event', eventId);
      results.push({
        locationType: 'event',
        locationId: eventId,
        visitCount: eventResult.visitCount
      });
      
      return results;
    } catch (error) {
      console.error('Error processing event locations:', error);
      throw error;
    }
  }
  
  // Recalculate all visit counts based on existing events
  static async recalculateAllVisitCounts() {
    try {
      console.log('Starting visit counts recalculation...');
      
      // Reset all visit counts to 0
      const locationTypes = ['district', 'town', 'neighborhood', 'village', 'stk'];
      for (const locationType of locationTypes) {
        await db.run(`UPDATE ${locationType}_visits SET visit_count = 0, updated_at = CURRENT_TIMESTAMP`);
        // Update in-memory collections
        const tableName = `${locationType}_visits`;
        if (collections[tableName]) {
          collections[tableName].forEach(item => {
            item.visit_count = 0;
            item.updated_at = new Date().toISOString();
          });
        }
      }
      
      // Get all active events
      const events = await db.all('SELECT id, selected_location_types, selected_locations FROM events WHERE archived = 0');
      console.log(`Found ${events.length} active events to process`);
      
      let totalProcessed = 0;
      
      // Process each event
      for (const event of events) {
        try {
          if (event.selected_location_types && event.selected_locations) {
            const selectedLocationTypes = JSON.parse(event.selected_location_types);
            const selectedLocations = JSON.parse(event.selected_locations);
            
            for (const locationType of selectedLocationTypes) {
              const locationIds = selectedLocations[locationType];
              if (locationIds && Array.isArray(locationIds)) {
                for (const locationId of locationIds) {
                  await this.incrementVisit(locationType, locationId);
                }
              }
            }
            totalProcessed++;
          }
        } catch (eventError) {
          console.error(`Error processing event ID ${event.id}:`, eventError);
        }
      }
      
      console.log(`Visit counts recalculation completed. Processed ${totalProcessed} events.`);
      return { success: true, eventsProcessed: totalProcessed, totalEvents: events.length };
    } catch (error) {
      console.error('Error recalculating visit counts:', error);
      throw error;
    }
  }
}

module.exports = VisitController;
