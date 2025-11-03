const { collections } = require('../config/database');
const db = require('../config/database');

class BallotBoxController {
  static async getAll(req, res) {
    try {
      const page = parseInt(req.query.page, 10);
      const limit = parseInt(req.query.limit, 10);
      const hasPagination = Number.isFinite(page) && Number.isFinite(limit) && page > 0 && limit > 0;

      const baseSql = `
        SELECT bb.*, 
               d.name as district_name,
               t.name as town_name,
               n.name as neighborhood_name,
               v.name as village_name
        FROM ballot_boxes bb
        LEFT JOIN districts d ON bb.district_id = d.id
        LEFT JOIN towns t ON bb.town_id = t.id
        LEFT JOIN neighborhoods n ON bb.neighborhood_id = n.id
        LEFT JOIN villages v ON bb.village_id = v.id
        ORDER BY bb.created_at DESC`;

      if (hasPagination) {
        const offset = (page - 1) * limit;
        const [{ cnt }] = await db.all('SELECT COUNT(*) as cnt FROM ballot_boxes', []);
        const rows = await db.all(`${baseSql} LIMIT ? OFFSET ?`, [limit, offset]);
        return res.json({ data: rows, page, limit, total: cnt, totalPages: Math.ceil(cnt / limit) });
      }

      const ballotBoxes = await db.all(baseSql);
      res.json(ballotBoxes);
    } catch (error) {
      console.error('Error fetching ballot boxes:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;
      const ballotBox = await db.get(`
        SELECT bb.*, 
               d.name as district_name,
               t.name as town_name,
               n.name as neighborhood_name,
               v.name as village_name
        FROM ballot_boxes bb
        LEFT JOIN districts d ON bb.district_id = d.id
        LEFT JOIN towns t ON bb.town_id = t.id
        LEFT JOIN neighborhoods n ON bb.neighborhood_id = n.id
        LEFT JOIN villages v ON bb.village_id = v.id
        WHERE bb.id = ?
      `, [id]);
      
      if (!ballotBox) {
        return res.status(404).json({ message: 'Sandık bulunamadı' });
      }
      
      res.json(ballotBox);
    } catch (error) {
      console.error('Error fetching ballot box:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  static async getByNeighborhood(req, res) {
    try {
      const { neighborhoodId } = req.params;
      const ballotBoxes = await db.all(`
        SELECT bb.*, 
               d.name as district_name,
               t.name as town_name,
               n.name as neighborhood_name
        FROM ballot_boxes bb
        LEFT JOIN districts d ON bb.district_id = d.id
        LEFT JOIN towns t ON bb.town_id = t.id
        LEFT JOIN neighborhoods n ON bb.neighborhood_id = n.id
        WHERE bb.neighborhood_id = ?
        ORDER BY bb.ballot_number
      `, [neighborhoodId]);
      res.json(ballotBoxes);
    } catch (error) {
      console.error('Error fetching ballot boxes by neighborhood:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  static async getByVillage(req, res) {
    try {
      const { villageId } = req.params;
      const ballotBoxes = await db.all(`
        SELECT bb.*, 
               d.name as district_name,
               t.name as town_name,
               v.name as village_name
        FROM ballot_boxes bb
        LEFT JOIN districts d ON bb.district_id = d.id
        LEFT JOIN towns t ON bb.town_id = t.id
        LEFT JOIN villages v ON bb.village_id = v.id
        WHERE bb.village_id = ?
        ORDER BY bb.ballot_number
      `, [villageId]);
      res.json(ballotBoxes);
    } catch (error) {
      console.error('Error fetching ballot boxes by village:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { ballot_number, institution_name, neighborhood_id, village_id, district_id, town_id } = req.body;

      // Validation
      const errors = [];
      if (!ballot_number) errors.push('Sandık numarası zorunludur');
      if (!institution_name) errors.push('Kurum adı zorunludur');

      if (errors.length > 0) {
        return res.status(400).json({ message: 'Doğrulama hatası', errors });
      }

      // Check if ballot number already exists
      const existingBallotBox = await db.get('SELECT * FROM ballot_boxes WHERE ballot_number = ?', [ballot_number]);
      if (existingBallotBox) {
        return res.status(400).json({ message: 'Bu sandık numarası zaten kayıtlı' });
      }

      const sql = `INSERT INTO ballot_boxes 
                   (ballot_number, institution_name, neighborhood_id, village_id, district_id, town_id) 
                   VALUES (?, ?, ?, ?, ?, ?)`;
      
      const result = await db.run(sql, [ballot_number, institution_name, neighborhood_id || null, village_id || null, district_id || null, town_id || null]);
      
      // Update in-memory collection
      const newBallotBox = {
        id: result.lastID,
        ballot_number,
        institution_name,
        neighborhood_id: neighborhood_id || null,
        village_id: village_id || null,
        district_id: district_id || null,
        town_id: town_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      collections.ballot_boxes.push(newBallotBox);
      
      res.status(201).json({ message: 'Sandık başarıyla eklendi', ballotBox: newBallotBox });
    } catch (error) {
      console.error('Error creating ballot box:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { ballot_number, institution_name, neighborhood_id, village_id, district_id, town_id } = req.body;

      // Validation
      const errors = [];
      if (!ballot_number) errors.push('Sandık numarası zorunludur');
      if (!institution_name) errors.push('Kurum adı zorunludur');
      if (!district_id) errors.push('İlçe ID zorunludur');
      if (!neighborhood_id && !village_id) {
        errors.push('Mahalle veya köy seçilmelidir');
      }
      if (neighborhood_id && village_id) {
        errors.push('Hem mahalle hem köy seçilemez');
      }

      if (errors.length > 0) {
        return res.status(400).json({ message: 'Doğrulama hatası', errors });
      }

      // Check if ballot number already exists for another ballot box
      const existingBallotBox = await db.get('SELECT * FROM ballot_boxes WHERE ballot_number = ? AND id != ?', [ballot_number, id]);
      if (existingBallotBox) {
        return res.status(400).json({ message: 'Bu sandık numarası başka bir sandıkta kayıtlı' });
      }

      const sql = `UPDATE ballot_boxes 
                   SET ballot_number = ?, institution_name = ?, neighborhood_id = ?, village_id = ?, district_id = ?, town_id = ?, updated_at = CURRENT_TIMESTAMP
                   WHERE id = ?`;
      
      await db.run(sql, [ballot_number, institution_name, neighborhood_id, village_id, district_id, town_id, id]);
      
      // Update in-memory collection
      const ballotBoxIndex = collections.ballot_boxes.findIndex(bb => bb.id === parseInt(id));
      if (ballotBoxIndex !== -1) {
        collections.ballot_boxes[ballotBoxIndex] = {
          ...collections.ballot_boxes[ballotBoxIndex],
          ballot_number,
          institution_name,
          neighborhood_id,
          village_id,
          district_id,
          town_id,
          updated_at: new Date().toISOString()
        };
      }
      
      res.json({ message: 'Sandık başarıyla güncellendi' });
    } catch (error) {
      console.error('Error updating ballot box:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;
      
      const sql = 'DELETE FROM ballot_boxes WHERE id = ?';
      await db.run(sql, [id]);
      
      // Update in-memory collection
      const ballotBoxIndex = collections.ballot_boxes.findIndex(bb => bb.id === parseInt(id));
      if (ballotBoxIndex !== -1) {
        collections.ballot_boxes.splice(ballotBoxIndex, 1);
      }
      
      res.json({ message: 'Sandık başarıyla silindi' });
    } catch (error) {
      console.error('Error deleting ballot box:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }
}

module.exports = BallotBoxController;
