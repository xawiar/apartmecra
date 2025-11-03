const PositionPermission = require('../models/PositionPermission');

class PermissionController {
  static async getAll(req, res) {
    try {
      const rows = await PositionPermission.getAll();
      const map = {};
      for (const r of rows) {
        if (!map[r.position]) map[r.position] = [];
        map[r.position].push(r.permission);
      }
      res.json(map);
    } catch (e) {
      res.status(500).json({ message: 'Yetkiler alınırken hata', error: e.message });
    }
  }

  static async getByPosition(req, res) {
    try {
      const { position } = req.params;
      const rows = await PositionPermission.getByPosition(position);
      res.json(rows.map(r => r.permission));
    } catch (e) {
      res.status(500).json({ message: 'Göreve ait yetkiler alınırken hata', error: e.message });
    }
  }

  static async setForPosition(req, res) {
    try {
      const { position } = req.params;
      const { permissions } = req.body;
      if (!Array.isArray(permissions)) {
        return res.status(400).json({ message: 'permissions dizi olmalı' });
      }
      await PositionPermission.setForPosition(position, permissions);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ message: 'Yetkiler güncellenirken hata', error: e.message });
    }
  }
}

module.exports = PermissionController;


