const db = require('../config/database');
const Meeting = require('../models/Meeting');

class MeetingController {
  // Get all meetings
  static async getAll(req, res) {
    try {
      const showArchived = req.query.archived === 'true';
      let sql, params;
      
      const page = Math.max(parseInt(req.query.page || '1'), 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit || '50'), 1), 200);
      const offset = (page - 1) * limit;

      if (showArchived) {
        sql = 'SELECT * FROM meetings ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?';
        params = [limit, offset];
      } else {
        sql = 'SELECT * FROM meetings WHERE archived = 0 ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?';
        params = [limit, offset];
      }
      
      const meetings = await db.all(sql, params);
      
      // Parse regions and attendees
      const processedMeetings = meetings.map(meeting => ({
        ...meeting,
        regions: meeting.regions ? JSON.parse(meeting.regions) : [],
        attendees: meeting.attendees ? JSON.parse(meeting.attendees) : []
      }));
      
      res.json(processedMeetings);
    } catch (error) {
      console.error('Error getting meetings:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Get meeting by ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const meeting = await db.get('SELECT * FROM meetings WHERE id = ?', [parseInt(id)]);
      
      if (!meeting) {
        return res.status(404).json({ message: 'Toplantı bulunamadı' });
      }
      
      // Parse regions and attendees
      const processedMeeting = {
        ...meeting,
        regions: meeting.regions ? JSON.parse(meeting.regions) : [],
        attendees: meeting.attendees ? JSON.parse(meeting.attendees) : []
      };
      
      res.json(processedMeeting);
    } catch (error) {
      console.error('Error getting meeting by ID:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Create new meeting
  static async create(req, res) {
    try {
      const meetingData = req.body;
      const errors = Meeting.validate(meetingData);
      
      if (errors.length > 0) {
        return res.status(400).json({ message: 'Doğrulama hatası', errors });
      }
      
      const sql = `INSERT INTO meetings (name, date, notes, archived, regions, attendees) 
                   VALUES (?, ?, ?, ?, ?, ?)`;
      const params = [
        meetingData.name,
        meetingData.date,
        meetingData.notes || null,
        0, // archived = false
        JSON.stringify(meetingData.regions || []),
        JSON.stringify(meetingData.attendees || [])
      ];
      
      const result = await db.run(sql, params);
      const newMeeting = await db.get('SELECT * FROM meetings WHERE id = ?', [result.lastID]);
      
      res.status(201).json(newMeeting);
    } catch (error) {
      console.error('Error creating meeting:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Update meeting
  static async update(req, res) {
    try {
      const { id } = req.params;
      const meetingData = req.body;
      const errors = Meeting.validate(meetingData);
      
      if (errors.length > 0) {
        return res.status(400).json({ message: 'Doğrulama hatası', errors });
      }
      
      const sql = `UPDATE meetings SET name = ?, date = ?, notes = ?, regions = ? WHERE id = ?`;
      const params = [
        meetingData.name,
        meetingData.date,
        meetingData.notes || null,
        JSON.stringify(meetingData.regions || []),
        parseInt(id)
      ];
      
      const result = await db.run(sql, params);
      if (result.changes === 0) {
        return res.status(404).json({ message: 'Toplantı bulunamadı' });
      }
      
      const updatedMeeting = await db.get('SELECT * FROM meetings WHERE id = ?', [parseInt(id)]);
      res.json(updatedMeeting);
    } catch (error) {
      console.error('Error updating meeting:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Archive meeting
  static async archive(req, res) {
    try {
      const { id } = req.params;
      const meeting = await db.get('SELECT * FROM meetings WHERE id = ?', [parseInt(id)]);
      
      if (!meeting) {
        return res.status(404).json({ message: 'Toplantı bulunamadı' });
      }
      
      // Update in database
      const result = await db.run('UPDATE meetings SET archived = 1 WHERE id = ?', [parseInt(id)]);
      
      if (result.changes === 0) {
        return res.status(404).json({ message: 'Toplantı bulunamadı' });
      }
      
      const archivedMeeting = { ...meeting, archived: 1 };
      res.json({ message: 'Toplantı arşivlendi', meeting: archivedMeeting });
    } catch (error) {
      console.error('Error archiving meeting:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Update attendance
  static updateAttendance(req, res) {
    try {
      const { id } = req.params;
      const { memberId, attended } = req.body;
      
      const meeting = db.findById('meetings', parseInt(id));
      if (!meeting) {
        return res.status(404).json({ message: 'Toplantı bulunamadı' });
      }
      
      // When updating attendance, remove any existing excuse
      meeting.addAttendee(memberId, attended, { hasExcuse: false, reason: '' });
      db.update('meetings', parseInt(id), { attendees: meeting.attendees });
      
      res.json({ message: 'Yoklama güncellendi', meeting });
    } catch (error) {
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Update excuse information
  static updateExcuse(req, res) {
    try {
      const { id } = req.params;
      const { memberId, hasExcuse, reason } = req.body;
      
      const meeting = db.findById('meetings', parseInt(id));
      if (!meeting) {
        return res.status(404).json({ message: 'Toplantı bulunamadı' });
      }
      
      meeting.updateExcuse(memberId, hasExcuse, reason);
      db.update('meetings', parseInt(id), { attendees: meeting.attendees });
      
      res.json({ message: 'Mazeret bilgisi güncellendi', meeting });
    } catch (error) {
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Delete all meetings
  static archiveAll(req, res) {
    try {
      // Get all meetings
      const meetings = db.get('meetings');
      
      // Move each meeting to archivedMeetings
      meetings.forEach(meeting => {
        const archivedMeeting = { ...meeting, archived: true };
        db.add('archivedMeetings', archivedMeeting);
      });
      
      // Clear all active meetings
      db.deleteAll('meetings');
      
      res.json({ message: 'Tüm toplantılar arşivlendi' });
    } catch (error) {
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }
}

module.exports = MeetingController;