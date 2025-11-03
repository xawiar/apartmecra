const db = require('../config/database');
const Event = require('../models/Event');
const { invalidate } = require('../middleware/cache');
const VisitController = require('./VisitController');

class EventController {
  // Get all events
  static async getAll(req, res) {
    try {
      const showArchived = req.query.archived === 'true';
      let sql, params;
      
      const page = Math.max(parseInt(req.query.page || '1'), 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit || '50'), 1), 200);
      const offset = (page - 1) * limit;

      if (showArchived) {
        sql = 'SELECT * FROM events ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?';
        params = [limit, offset];
      } else {
        sql = 'SELECT * FROM events WHERE archived = 0 ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?';
        params = [limit, offset];
      }
      
      const events = await db.all(sql, params);
      
      // Parse attendees
      const processedEvents = events.map(event => ({
        ...event,
        attendees: event.attendees ? JSON.parse(event.attendees) : []
      }));
      
      res.json(processedEvents);
    } catch (error) {
      console.error('Error getting events:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Get event by ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const event = await db.get('SELECT * FROM events WHERE id = ?', [parseInt(id)]);
      
      if (!event) {
        return res.status(404).json({ message: 'Etkinlik bulunamadı' });
      }
      
      // Parse attendees
      const processedEvent = {
        ...event,
        attendees: event.attendees ? JSON.parse(event.attendees) : []
      };
      
      res.json(processedEvent);
    } catch (error) {
      console.error('Error getting event by ID:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Create new event
  static async create(req, res) {
    try {
      const eventData = req.body;
      const errors = Event.validate(eventData);
      
      if (errors.length > 0) {
        return res.status(400).json({ message: 'Doğrulama hatası', errors });
      }
      
      const sql = `INSERT INTO events (name, date, location, description, archived, attendees, selected_location_types, selected_locations) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
      const params = [
        eventData.name,
        eventData.date,
        eventData.location,
        eventData.description || null,
        0, // archived = false
        JSON.stringify(eventData.attendees || []), // Store attendees as JSON string
        JSON.stringify(eventData.selectedLocationTypes || []), // Store selected location types
        JSON.stringify(eventData.selectedLocations || {}) // Store selected locations
      ];
      
      const result = await db.run(sql, params);
      const newEvent = await db.get('SELECT * FROM events WHERE id = ?', [result.lastID]);
      
      // Invalidate events cache so new event appears immediately
      try { invalidate('/api/events'); } catch (_) {}
      res.status(201).json(newEvent);
    } catch (error) {
      console.error('Error creating event:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Update event
  static async update(req, res) {
    try {
      const { id } = req.params;
      const eventData = req.body;
      const errors = Event.validate(eventData);
      
      if (errors.length > 0) {
        return res.status(400).json({ message: 'Doğrulama hatası', errors });
      }
      
      const sql = `UPDATE events SET name = ?, date = ?, location = ?, description = ?, attendees = ? 
                   WHERE id = ?`;
      const params = [
        eventData.name,
        eventData.date,
        eventData.location,
        eventData.description || null,
        JSON.stringify(eventData.attendees || []),
        parseInt(id)
      ];
      
      const result = await db.run(sql, params);
      
      if (result.changes === 0) {
        return res.status(404).json({ message: 'Etkinlik bulunamadı' });
      }
      
      const updatedEvent = await db.get('SELECT * FROM events WHERE id = ?', [parseInt(id)]);
      try { invalidate('/api/events'); } catch (_) {}
      res.json(updatedEvent);
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Archive event
  static async archive(req, res) {
    try {
      const { id } = req.params;
      const sql = 'UPDATE events SET archived = 1 WHERE id = ?';
      const result = await db.run(sql, [parseInt(id)]);
      
      if (result.changes === 0) {
        return res.status(404).json({ message: 'Etkinlik bulunamadı' });
      }
      
      try { invalidate('/api/events'); } catch (_) {}
      res.json({ message: 'Etkinlik başarıyla arşivlendi' });
    } catch (error) {
      console.error('Error archiving event:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Delete event
  static async delete(req, res) {
    try {
      const { id } = req.params;
      // Get event with location info before deleting
      const existing = await db.get('SELECT id, archived, selected_location_types, selected_locations FROM events WHERE id = ?', [parseInt(id)]);
      if (!existing) {
        return res.status(404).json({ message: 'Etkinlik bulunamadı' });
      }
      if (!existing.archived) {
        return res.status(400).json({ message: 'Etkinlik önce arşivlenmeli (archived=1)'});
      }
      
      // Decrement visit counts for locations affected by this event
      try {
        if (existing.selected_location_types && existing.selected_locations) {
          const selectedLocationTypes = JSON.parse(existing.selected_location_types);
          const selectedLocations = JSON.parse(existing.selected_locations);
          
          for (const locationType of selectedLocationTypes) {
            const locationIds = selectedLocations[locationType];
            if (locationIds && Array.isArray(locationIds)) {
              for (const locationId of locationIds) {
                await VisitController.decrementVisit(locationType, locationId);
              }
            }
          }
          console.log(`Visit counts decremented for deleted event ID ${id}`);
        }
      } catch (visitError) {
        console.error('Error decrementing visit counts for deleted event:', visitError);
        // Continue with deletion even if visit count decrement fails
      }
      
      const sql = 'DELETE FROM events WHERE id = ?';
      const result = await db.run(sql, [parseInt(id)]);
      
      if (result.changes === 0) {
        return res.status(404).json({ message: 'Etkinlik bulunamadı' });
      }
      
      try { invalidate('/api/events'); } catch (_) {}
      res.json({ message: 'Etkinlik başarıyla silindi' });
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }
}

module.exports = EventController;
