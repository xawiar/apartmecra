const { collections } = require('../config/database');
const db = require('../config/database');

class BallotBoxObserverController {
  static async getAll(req, res) {
    try {
      const observers = await db.all(`
        SELECT bbo.*, 
               bb.ballot_number,
               bb.institution_name,
               d.name as district_name,
               t.name as town_name,
               n.name as neighborhood_name,
               v.name as village_name,
               bbo.district_id as observer_district_id,
               bbo.town_id as observer_town_id,
               bbo.neighborhood_id as observer_neighborhood_id,
               bbo.village_id as observer_village_id
        FROM ballot_box_observers bbo
        LEFT JOIN ballot_boxes bb ON bbo.ballot_box_id = bb.id
        LEFT JOIN districts d ON bbo.district_id = d.id
        LEFT JOIN towns t ON bbo.town_id = t.id
        LEFT JOIN neighborhoods n ON bbo.neighborhood_id = n.id
        LEFT JOIN villages v ON bbo.village_id = v.id
        ORDER BY bb.ballot_number, bbo.is_chief_observer DESC, bbo.name
      `);
      res.json(observers);
    } catch (error) {
      console.error('Error fetching ballot box observers:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  static async getByBallotBox(req, res) {
    try {
      const { ballotBoxId } = req.params;
      const observers = await db.all(`
        SELECT bbo.*, 
               bb.ballot_number,
               bb.institution_name
        FROM ballot_box_observers bbo
        LEFT JOIN ballot_boxes bb ON bbo.ballot_box_id = bb.id
        WHERE bbo.ballot_box_id = ?
        ORDER BY bbo.is_chief_observer DESC, bbo.name
      `, [ballotBoxId]);
      res.json(observers);
    } catch (error) {
      console.error('Error fetching observers by ballot box:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const observer = await db.get(`
        SELECT bbo.*, 
               bb.ballot_number,
               bb.institution_name,
               d.name as district_name,
               t.name as town_name,
               n.name as neighborhood_name,
               v.name as village_name
        FROM ballot_box_observers bbo
        LEFT JOIN ballot_boxes bb ON bbo.ballot_box_id = bb.id
        LEFT JOIN districts d ON bb.district_id = d.id
        LEFT JOIN towns t ON bb.town_id = t.id
        LEFT JOIN neighborhoods n ON bb.neighborhood_id = n.id
        LEFT JOIN villages v ON bb.village_id = v.id
        WHERE bbo.id = ?
      `, [id]);
      
      if (!observer) {
        return res.status(404).json({ message: 'Müşahit bulunamadı' });
      }
      
      res.json(observer);
    } catch (error) {
      console.error('Error fetching ballot box observer:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { ballot_box_id, tc, name, phone, is_chief_observer, district_id, town_id, neighborhood_id, village_id } = req.body;

      // Validation
      const errors = [];
      if (!tc) errors.push('TC kimlik numarası zorunludur');
      if (!name) errors.push('Ad soyad zorunludur');
      if (!phone) errors.push('Telefon numarası zorunludur');
      
      if (tc && tc.length !== 11) {
        errors.push('TC kimlik numarası 11 haneli olmalıdır');
      }

      if (errors.length > 0) {
        return res.status(400).json({ message: 'Doğrulama hatası: ' + errors.join(', '), errors });
      }

      // Check if TC already exists
      const existingObserver = await db.get('SELECT * FROM ballot_box_observers WHERE tc = ?', [tc]);
      if (existingObserver) {
        return res.status(400).json({ message: 'Bu TC kimlik numarası zaten kayıtlı' });
      }

      // Check if there's already a chief observer for this ballot box
      if (is_chief_observer && ballot_box_id) {
        const existingChiefObserver = await db.get('SELECT * FROM ballot_box_observers WHERE ballot_box_id = ? AND is_chief_observer = 1', [ballot_box_id]);
        if (existingChiefObserver) {
          return res.status(400).json({ message: 'Bu sandıkta zaten bir başmüşahit bulunmaktadır' });
        }
      }

      const sql = `INSERT INTO ballot_box_observers 
                   (ballot_box_id, tc, name, phone, is_chief_observer, district_id, town_id, neighborhood_id, village_id) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      
      const result = await db.run(sql, [ballot_box_id, tc, name, phone, is_chief_observer ? 1 : 0, district_id, town_id, neighborhood_id, village_id]);
      
      // Update in-memory collection
      const newObserver = {
        id: result.lastID,
        ballot_box_id,
        tc,
        name,
        phone,
        is_chief_observer: is_chief_observer ? 1 : 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      collections.ballot_box_observers.push(newObserver);
      
      res.status(201).json({ message: 'Müşahit başarıyla eklendi', observer: newObserver });
    } catch (error) {
      console.error('Error creating ballot box observer:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { ballot_box_id, tc, name, phone, is_chief_observer, district_id, town_id, neighborhood_id, village_id } = req.body;

      // Validation
      const errors = [];
      if (!tc) errors.push('TC kimlik numarası zorunludur');
      if (!name) errors.push('Ad soyad zorunludur');
      if (!phone) errors.push('Telefon numarası zorunludur');
      
      if (tc && tc.length !== 11) {
        errors.push('TC kimlik numarası 11 haneli olmalıdır');
      }

      if (errors.length > 0) {
        return res.status(400).json({ message: 'Doğrulama hatası: ' + errors.join(', '), errors });
      }

      // Get current observer to check ballot_box_id
      const currentObserver = await db.get('SELECT * FROM ballot_box_observers WHERE id = ?', [id]);
      if (!currentObserver) {
        return res.status(404).json({ message: 'Müşahit bulunamadı' });
      }

      // Check if TC already exists for another observer in the same ballot box
      const existingObserver = await db.get('SELECT * FROM ballot_box_observers WHERE ballot_box_id = ? AND tc = ? AND id != ?', [currentObserver.ballot_box_id, tc, id]);
      if (existingObserver) {
        return res.status(400).json({ message: 'Bu TC kimlik numarası bu sandıkta başka bir müşahitte kayıtlı' });
      }

      // Check if there's already a chief observer for this ballot box (if changing to chief observer)
      if (is_chief_observer && !currentObserver.is_chief_observer) {
        const existingChiefObserver = await db.get('SELECT * FROM ballot_box_observers WHERE ballot_box_id = ? AND is_chief_observer = 1 AND id != ?', [currentObserver.ballot_box_id, id]);
        if (existingChiefObserver) {
          return res.status(400).json({ message: 'Bu sandıkta zaten bir başmüşahit bulunmaktadır' });
        }
      }

      const sql = `UPDATE ballot_box_observers 
                   SET tc = ?, name = ?, phone = ?, is_chief_observer = ?, district_id = ?, town_id = ?, neighborhood_id = ?, village_id = ?, updated_at = CURRENT_TIMESTAMP
                   WHERE id = ?`;
      
      await db.run(sql, [tc, name, phone, is_chief_observer ? 1 : 0, district_id, town_id, neighborhood_id, village_id, id]);
      
      // Update in-memory collection
      const observerIndex = collections.ballot_box_observers.findIndex(obs => obs.id === parseInt(id));
      if (observerIndex !== -1) {
        collections.ballot_box_observers[observerIndex] = {
          ...collections.ballot_box_observers[observerIndex],
          tc,
          name,
          phone,
          is_chief_observer: is_chief_observer ? 1 : 0,
          updated_at: new Date().toISOString()
        };
      }
      
      res.json({ message: 'Müşahit başarıyla güncellendi' });
    } catch (error) {
      console.error('Error updating ballot box observer:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      const sql = 'DELETE FROM ballot_box_observers WHERE id = ?';
      await db.run(sql, [id]);
      
      // Update in-memory collection
      const observerIndex = collections.ballot_box_observers.findIndex(obs => obs.id === parseInt(id));
      if (observerIndex !== -1) {
        collections.ballot_box_observers.splice(observerIndex, 1);
      }
      
      res.json({ message: 'Müşahit başarıyla silindi' });
    } catch (error) {
      console.error('Error deleting ballot box observer:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }
}

module.exports = BallotBoxObserverController;
