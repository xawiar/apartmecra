const db = require('../config/database');
const Region = require('../models/Region');
const { invalidate } = require('../middleware/cache');

class RegionController {
  // Get all regions
  static async getAll(req, res) {
    try {
      const regions = await db.all('SELECT * FROM regions WHERE (deleted = 0 OR deleted IS NULL) ORDER BY name');
      res.json(regions);
    } catch (error) {
      console.error('Error getting regions:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Create new region
  static async create(req, res) {
    try {
      const regionData = req.body;
      const errors = Region.validate(regionData);
      
      if (errors.length > 0) {
        return res.status(400).json({ message: 'Doğrulama hatası', errors });
      }
      
      // Check if region already exists
      const existingRegion = await db.get('SELECT * FROM regions WHERE name = ? AND (deleted = 0 OR deleted IS NULL)', [regionData.name]);
      if (existingRegion) {
        return res.status(400).json({ message: 'Bu bölge zaten kayıtlı' });
      }
      
      const result = await db.run('INSERT INTO regions (name) VALUES (?)', [regionData.name]);
      const newRegion = await db.get('SELECT * FROM regions WHERE id = ?', [result.lastID]);
      
      // Invalidate regions cache
      try { invalidate('/api/regions'); } catch (_) {}
      res.status(201).json(newRegion);
    } catch (error) {
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Update region
  static async update(req, res) {
    try {
      const { id } = req.params;
      const regionData = req.body;
      const errors = Region.validate(regionData);
      
      if (errors.length > 0) {
        return res.status(400).json({ message: 'Doğrulama hatası', errors });
      }
      
      // Get the old region name before updating
      const oldRegion = await db.get('SELECT * FROM regions WHERE id = ? AND (deleted = 0 OR deleted IS NULL)', [parseInt(id)]);
      if (!oldRegion) {
        return res.status(404).json({ message: 'Bölge bulunamadı' });
      }
      
      // Check if new name already exists (excluding current region)
      const existingRegion = await db.get('SELECT * FROM regions WHERE name = ? AND id != ?', [regionData.name, parseInt(id)]);
      if (existingRegion) {
        return res.status(400).json({ message: 'Bu bölge adı zaten kullanılıyor' });
      }
      
      // Update the region
      const sql = 'UPDATE regions SET name = ? WHERE id = ?';
      const params = [regionData.name, parseInt(id)];
      
      const result = await db.run(sql, params);
      if (result.changes === 0) {
        return res.status(404).json({ message: 'Bölge bulunamadı' });
      }
      
      // Update all members with this region
      const membersUpdateResult = await db.run('UPDATE members SET region = ? WHERE region = ?', [regionData.name, oldRegion.name]);
      console.log(`Updated ${membersUpdateResult.changes} members with region change from "${oldRegion.name}" to "${regionData.name}"`);
      
      // Update member users table if it has region column
      try {
        const memberUsersUpdateResult = await db.run('UPDATE member_users SET region = ? WHERE region = ?', [regionData.name, oldRegion.name]);
        console.log(`Updated ${memberUsersUpdateResult.changes} member users with region change`);
      } catch (error) {
        // Ignore if region column doesn't exist in member_users
        console.log('Region column not found in member_users table');
      }
      
      const updatedRegion = await db.get('SELECT * FROM regions WHERE id = ?', [parseInt(id)]);
      // Invalidate regions cache
      try { invalidate('/api/regions'); } catch (_) {}
      res.json(updatedRegion);
    } catch (error) {
      console.error('Error updating region:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Delete region
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const numericId = parseInt(id);
      console.log('[RegionController.delete] Incoming id:', id, 'parsed:', numericId);
      // First check if region exists
      const region = await db.get('SELECT * FROM regions WHERE id = ? AND (deleted = 0 OR deleted IS NULL)', [numericId]);
      console.log('[RegionController.delete] Found region by id?', !!region, region);
      if (!region) {
        return res.status(404).json({ message: 'Bölge bulunamadı' });
      }
      
      // Check if any members are using this region
      const membersUsingRegion = await db.get('SELECT COUNT(*) as count FROM members WHERE region = ?', [region.name]);
      console.log('[RegionController.delete] Members using region:', membersUsingRegion?.count);
      if (membersUsingRegion.count > 0) {
        return res.status(400).json({ 
          message: `Bu bölge ${membersUsingRegion.count} üye tarafından kullanılıyor. Önce bu üyelerin bölgelerini değiştirin.` 
        });
      }
      
      // Delete the region
      // Soft delete
      const result = await db.run('UPDATE regions SET deleted = 1 WHERE id = ?', [numericId]);
      console.log('[RegionController.delete] Soft delete changes:', result?.changes);
      if (result.changes === 0) {
        return res.status(404).json({ message: 'Bölge bulunamadı' });
      }
      
      // Invalidate regions cache
      try { invalidate('/api/regions'); } catch (_) {}
      res.json({ message: 'Bölge başarıyla silindi', region: region });
    } catch (error) {
      console.error('Error deleting region:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }
}

module.exports = RegionController;