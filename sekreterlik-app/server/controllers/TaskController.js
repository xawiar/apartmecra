const db = require('../config/database');
const Task = require('../models/Task');

class TaskController {
  // Get all tasks
  static async getAll(req, res) {
    try {
      const tasks = await db.all('SELECT * FROM tasks ORDER BY created_at DESC');
      res.json(tasks);
    } catch (error) {
      console.error('Error getting tasks:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Get task by ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const task = await db.get('SELECT * FROM tasks WHERE id = ?', [parseInt(id)]);
      
      if (!task) {
        return res.status(404).json({ message: 'Görev bulunamadı' });
      }
      
      res.json(task);
    } catch (error) {
      console.error('Error getting task by ID:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Create new task
  static async create(req, res) {
    try {
      const taskData = req.body;
      const errors = Task.validate(taskData);
      
      if (errors.length > 0) {
        return res.status(400).json({ message: 'Doğrulama hatası', errors });
      }
      
      const sql = `INSERT INTO tasks (title, description, assigned_to, due_date, status) 
                   VALUES (?, ?, ?, ?, ?)`;
      const params = [
        taskData.title,
        taskData.description || null,
        taskData.assigned_to || taskData.assignee,
        taskData.due_date || taskData.dueDate,
        taskData.status || 'pending'
      ];
      
      const result = await db.run(sql, params);
      const newTask = await db.get('SELECT * FROM tasks WHERE id = ?', [result.lastID]);
      
      res.status(201).json(newTask);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Update task
  static async update(req, res) {
    try {
      const { id } = req.params;
      const taskData = req.body;
      const errors = Task.validate(taskData);
      
      if (errors.length > 0) {
        return res.status(400).json({ message: 'Doğrulama hatası', errors });
      }
      
      const sql = `UPDATE tasks 
                   SET title = ?, description = ?, assigned_to = ?, due_date = ?, status = ?
                   WHERE id = ?`;
      const params = [
        taskData.title,
        taskData.description || null,
        taskData.assigned_to || taskData.assignee || null,
        taskData.due_date || taskData.dueDate || null,
        taskData.status || 'pending',
        parseInt(id)
      ];
      
      const result = await db.run(sql, params);
      if (result.changes === 0) {
        return res.status(404).json({ message: 'Görev bulunamadı' });
      }
      const updated = await db.get('SELECT * FROM tasks WHERE id = ?', [parseInt(id)]);
      res.json(updated);
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Delete task
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const existing = await db.get('SELECT * FROM tasks WHERE id = ?', [parseInt(id)]);
      if (!existing) {
        return res.status(404).json({ message: 'Görev bulunamadı' });
      }
      const result = await db.run('DELETE FROM tasks WHERE id = ?', [parseInt(id)]);
      if (result.changes === 0) {
        return res.status(404).json({ message: 'Görev bulunamadı' });
      }
      res.json({ message: 'Görev silindi' });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Archive task
  static async archive(req, res) {
    try {
      const { id } = req.params;
      const existing = await db.get('SELECT * FROM tasks WHERE id = ?', [parseInt(id)]);
      if (!existing) {
        return res.status(404).json({ message: 'Görev bulunamadı' });
      }
      // There is no archived flag in tasks; use status to mark as archived
      const result = await db.run('UPDATE tasks SET status = ? WHERE id = ?', ['archived', parseInt(id)]);
      if (result.changes === 0) {
        return res.status(404).json({ message: 'Görev bulunamadı' });
      }
      const updated = await db.get('SELECT * FROM tasks WHERE id = ?', [parseInt(id)]);
      res.json({ message: 'Görev arşivlendi', task: updated });
    } catch (error) {
      console.error('Error archiving task:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }

  // Archive all tasks (instead of deleting them)
  static async archiveAll(req, res) {
    try {
      await db.run("UPDATE tasks SET status = 'archived' WHERE status != 'archived'");
      res.json({ message: 'Tüm görevler arşivlendi' });
    } catch (error) {
      console.error('Error archiving all tasks:', error);
      res.status(500).json({ message: 'Sunucu hatası', error: error.message });
    }
  }
}

module.exports = TaskController;