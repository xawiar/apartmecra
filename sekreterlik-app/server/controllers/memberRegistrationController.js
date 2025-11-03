const db = require('../config/database');

class MemberRegistrationController {
  static getAll(req, res) {
    try {
      const registrations = db.get('memberRegistrations');
      res.json(registrations);
    } catch (error) {
      res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
    }
  }

  static create(req, res) {
    try {
      const { memberId, count, date } = req.body;
      
      // Validate required fields
      if (!memberId || !count || !date) {
        return res.status(400).json({ 
          message: 'Üye ID, sayı ve tarih alanları zorunludur' 
        });
      }
      
      // Validate count is a positive number
      if (count <= 0) {
        return res.status(400).json({ 
          message: 'Üye sayısı pozitif bir sayı olmalıdır' 
        });
      }
      
      // Create new registration with a unique ID and creation timestamp
      const newRegistration = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        memberId: parseInt(memberId),
        count: parseInt(count),
        date,
        createdAt: new Date().toISOString() // Add creation timestamp
      };
      
      console.log('Creating new registration with ID:', newRegistration.id, '(type:', typeof newRegistration.id, ')');
      
      db.add('memberRegistrations', newRegistration);
      
      console.log('Registration created successfully');
      
      res.status(201).json(newRegistration);
    } catch (error) {
      console.error('Error creating member registration:', error);
      res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
    }
  }

  static update(req, res) {
    try {
      const { id } = req.params;
      const { memberId, count, date } = req.body;
      
      console.log('Update request received:', { id, memberId, count, date });
      
      // Validate required fields
      if (!memberId || !count || !date) {
        return res.status(400).json({ 
          message: 'Üye ID, sayı ve tarih alanları zorunludur' 
        });
      }
      
      // Validate count is a positive number
      if (count <= 0) {
        return res.status(400).json({ 
          message: 'Üye sayısı pozitif bir sayı olmalıdır' 
        });
      }
      
      // Parse the ID to ensure it's an integer
      const registrationId = parseInt(id);
      console.log('Parsed registration ID:', registrationId, '(type:', typeof registrationId, ')');
      
      // Find the existing registration to preserve createdAt timestamp
      const existingRegistration = db.findById('memberRegistrations', registrationId);
      console.log('Existing registration found:', existingRegistration);
      
      if (!existingRegistration) {
        console.log('Registration not found in database');
        return res.status(404).json({ message: 'Kayıt bulunamadı' });
      }
      
      // Update the registration while preserving the createdAt timestamp
      const updatedRegistration = db.update('memberRegistrations', registrationId, {
        memberId: parseInt(memberId),
        count: parseInt(count),
        date,
        createdAt: existingRegistration.createdAt // Preserve the original creation timestamp
      });
      
      console.log('Updated registration:', updatedRegistration);
      
      if (!updatedRegistration) {
        console.log('Failed to update registration');
        return res.status(404).json({ message: 'Kayıt bulunamadı' });
      }
      
      // Return the updated registration with all fields including createdAt
      res.json(updatedRegistration);
    } catch (error) {
      console.error('Error updating member registration:', error);
      res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
    }
  }

  static delete(req, res) {
    try {
      const { id } = req.params;
      const registrationId = parseInt(id);
      if (Number.isNaN(registrationId)) {
        return res.status(400).json({ message: 'Geçersiz kayıt ID' });
      }
      const existing = db.findById('memberRegistrations', registrationId);
      if (!existing) {
        return res.status(404).json({ message: 'Kayıt bulunamadı' });
      }
      const removed = db.delete('memberRegistrations', registrationId);
      if (!removed) {
        return res.status(404).json({ message: 'Kayıt bulunamadı' });
      }
      return res.json({ message: 'Kayıt silindi', id: registrationId });
    } catch (error) {
      console.error('Error deleting member registration:', error);
      res.status(500).json({ message: 'Sunucu hatası: ' + error.message });
    }
  }
}

module.exports = MemberRegistrationController;